public class ReturnOrderTriggerHandler {
    private static final String ORDER_ACTION = 'update';
    private static final Map<String, Integer> returnApprovedStatusMap = new Map<String, Integer>{
        'LINE_COMPLETE' => 2,
        'ORDER_COMPLETE' => 2,
        'PARTIAL' => 10
    };

    private static final Map<String, Integer> returnCanceledStatusMap = new Map<String, Integer>{
        'LINE_COMPLETE' => 3,
        'ORDER_COMPLETE' => 6,
        'PARTIAL' => 7
    };

    public static void handleReturnRequest(List<ReturnOrder> triggerList){
        Map<Id, ReturnOrder> orderSumIdToReturnOrder = new Map<Id, ReturnOrder>();
        List<Id> returnOrderIds = new List<Id>();
        for (ReturnOrder retOrder : triggerList) {
            if (retOrder.Status == 'Approved' || retOrder.Status == 'Canceled') {
                orderSumIdToReturnOrder.put(retOrder.orderSummaryId, retOrder);
                returnOrderIds.add(retOrder.Id);
            }
        }

        if (!orderSumIdToReturnOrder.isEmpty()) {
            Map<Id, List<OrderItemSummary>> orderSumMap = new Map<Id, List<OrderItemSummary>>();
            List<OrderSummary> orderSumList = [SELECT ID, OrderNumber FROM OrderSummary WHERE ID IN: orderSumIdToReturnOrder.keySet()];
            List<OrderItemSummary> orderItemSumList = [SELECT ID, TYPE, OrderSummaryId, ProductCode, Product2Id, QuantityOrdered, Status FROM OrderItemSummary WHERE  OrderSummaryId IN : orderSumIdToReturnOrder.keySet()];
            List<Shipment> returnShipment = [SELECT Id, ReturnOrderId FROM Shipment WHERE ReturnOrderId IN: returnOrderIds];
            List<Id> returnShipmentIds = getReturnShipmentIds(returnShipment); 
            List<ReturnOrderLineItem> returnOrderLineItems = [SELECT Id, ReturnOrderId, QuantityExpected, Product2Id, (SELECT ShipmentId, TrackingUrl, ReturnOrderLineItemId FROM ReturnOrderLineItemShipmentItems WHERE ShipmentId IN: returnShipmentIds) FROM ReturnOrderLineItem WHERE ReturnOrderId IN: returnOrderIds];
            Map<Id, List<ReturnOrderLineItem>> returnOrderIdToreturnOrderLineItems = createReturnOrderIdToreturnOrderLineItems(returnOrderIds, returnOrderLineItems);

            for (OrderSummary order : orderSumList) {
                List<OrderItemSummary> productItemList = new List<OrderItemSummary>();
                for (OrderItemSummary item : orderItemSumList) {
                    if (item.orderSummaryId == order.id) {
                        productItemList.add(item);
                    }
                }
                orderSumMap.put(order.id, productItemList);
            }

            for (OrderSummary orderSum : orderSumList) {
                ReturnOrder currentReturnOrder = orderSumIdToReturnOrder.get(orderSum.Id);
                String payload = getPayload(orderSum.Id, currentReturnOrder, JSON.Serialize(orderSumMap.get(orderSum.id)), returnOrderIdToreturnOrderLineItems.get(currentReturnOrder.Id), returnShipment);
                sendReturnUpdate(payload, orderSum.OrderNumber);
            }
        }
    }

    public static String getPayload(String orderSumId, ReturnOrder returnOrder, String lineItemsJson, List<ReturnOrderLineItem> returnOrderLineItemsList, List<Shipment> shipments){
        List<OrderItemSummary> lineItems = (List<OrderItemSummary>)JSON.deserialize(lineItemsJson, List<OrderItemSummary>.class);
        String payload='';
        JSONGenerator gen = JSON.createGenerator(true);
        List<String> product2Ids = new List<String>();
        Boolean isPartialOrderReturn = false;
        Map<String, Integer> returnMap = returnOrder.Status == 'Approved' ? returnApprovedStatusMap : returnCanceledStatusMap;

        gen.writeStartObject();
        gen.writeStringField('c_orderAction', ORDER_ACTION);
        gen.writeFieldName('product_items');
        gen.writeStartArray();
        for(OrderItemSummary item : lineItems){	
            if(Item.Type =='Order Product'){
                product2Ids.add(item.Product2Id);
                List<ReturnOrderLineItem> returnOrderLineItem = getReturnOrderLineItem(returnOrderLineItemsList, item.Product2Id);

                if(returnOrderLineItem.size() > 0){
                    gen.writeStartObject();
                    gen.writeStringField('product_id',item.ProductCode);

                    if(returnOrderLineItem[0].QuantityExpected == item.QuantityOrdered){
                        gen.writeNumberField('c_externalLineItemReturnStatus', returnMap.get('LINE_COMPLETE'));
                    }
                    else{
                        gen.writeNumberField('c_externalLineItemReturnStatus', returnMap.get('PARTIAL'));
                        isPartialOrderReturn = true;
                    }
                
                    List<Id> shipmentIds = getReturnShipmentIdsWithReturnOrderId(shipments, returnOrder.Id);
                    if(returnOrderLineItem[0].ReturnOrderLineItemShipmentItems.size() > 0){
                        ShipmentItem shipmentItem = returnOrderLineItem[0].ReturnOrderLineItemShipmentItems[0];
                        if (shipmentIds.contains(shipmentItem.ShipmentId)) {
                            gen.writeStringField('c_returnShippingLabel', shipmentItem.TrackingUrl);
                        }
                    }
                
                    gen.writeEndObject();
                }
                else {
                    isPartialOrderReturn = true;
                }
            }
        }
        gen.writeEndArray();

        if(isPartialOrderReturn){
            gen.writeNumberField('c_externalReturnStatus', returnMap.get('PARTIAL'));
            
        } else {
            gen.writeNumberField('c_externalReturnStatus', returnMap.get('ORDER_COMPLETE'));
        }

        gen.writeEndObject();
        payload = gen.getAsString();

        return payload;
    }

    public static Map<Id, List<ReturnOrderLineItem>> createReturnOrderIdToreturnOrderLineItems(List<Id> returnOrderIds, List<ReturnOrderLineItem> returnOrderLineItems){
        Map<Id, List<ReturnOrderLineItem>> returnOrderIdToreturnOrderLineItems = new Map<Id, List<ReturnOrderLineItem>>();
        for(Id returnOrderId: returnOrderIds){
            List<ReturnOrderLineItem> returnOrderLineItemList = new List<ReturnOrderLineItem>();
            for(ReturnOrderLineItem returnOrderLineItem: returnOrderLineItems){
                if(returnOrderLineItem.ReturnOrderId == returnOrderId){
                    returnOrderLineItemList.add(returnOrderLineItem);
                }
            }
            returnOrderIdToreturnOrderLineItems.put(returnOrderId, returnOrderLineItemList);
        }
        return returnOrderIdToreturnOrderLineItems;
    }

    public static List<ReturnOrderLineItem> getReturnOrderLineItem(List<ReturnOrderLineItem> returnOrderLineItemList, String product2Id){
        List<ReturnOrderLineItem> newReturnOrderLineItemList = new List<ReturnOrderLineItem>();
        for(ReturnOrderLineItem returnOrderLineItem : returnOrderLineItemList){
            if(returnOrderLineItem.Product2Id == product2Id){
                newReturnOrderLineItemList.add(returnOrderLineItem);
            }
        }
        return newReturnOrderLineItemList;
    }

    public static List<Id> getReturnShipmentIds(List<Shipment> shipments){
        List<Id> returnShipmentIds = new List<Id>();
        for(Shipment shipment: shipments){
            returnShipmentIds.add(shipment.Id);
        }
        return returnShipmentIds;
    }

    public static List<Id> getReturnShipmentIdsWithReturnOrderId(List<Shipment> shipments, String returnOrderId){
        List<Id> returnShipmentIds = new List<Id>();
        for(Shipment shipment: shipments){
            if (shipment.ReturnOrderId == returnOrderId) {
                returnShipmentIds.add(shipment.Id);
            }
        }
        return returnShipmentIds;
    }

    
    @future(callout = true)
    public static void sendReturnUpdate(String payload, String orderNumber){
        OrderStatusExportAuthHelper authHelper = new OrderStatusExportAuthHelper();
        HttpResponse res = new HttpResponse();
        Order_Status_Update_Params__mdt params = authHelper.getOAuthConnInfo();
        String token = authHelper.getOAuthToken(params);
        res = authHelper.sendOrderUpdate(params, token, orderNumber, payload);
    }
}
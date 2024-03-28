public class ReturnOrderLineItemTriggerHandler {
    private static final String ORDER_ACTION = 'update';
    private static final Map<String, Integer> returnStatusMap = new Map<String, Integer>{
        'CANCELLED' => 6,
        'LINE_CANCELLED' => 3,
        'PARTIAL_CANCEL' => 7,
        'RETURNED' => 4,
        'PARTIAL_RETURNED' => 5
    };
    
    public static void handleReturnRequest (List<ReturnOrderLineItem> triggerList){
            sendReturnUpdate(JSON.Serialize(triggerList));
    }

    @future(callout = true)
    public static void sendReturnUpdate(String lineItemsJson){
        List<ReturnOrderLineItem> triggerList = (  List<ReturnOrderLineItem>)JSON.deserialize(lineItemsJson, List<ReturnOrderLineItem>.class);
        Map<Id, Map<ReturnOrderLineItem, String>> lineItemReturnMap = new Map<Id, Map<ReturnOrderLineItem, String>>();
        for (ReturnOrderLineItem line : triggerList) {
            if (line.QuantityRejected > 0) {
                if (line.QuantityRejected == line.QuantityReceived) {
                    if (lineItemReturnMap.containsKey(line.ReturnOrderId)) {
                        lineItemReturnMap.get(line.ReturnOrderId).put(line, 'CANCELLED');
                    } else {
                        Map<ReturnOrderLineItem, String> innerMap = new Map<ReturnOrderLineItem, String>();
                        innerMap.put(line, 'CANCELLED');
                        lineItemReturnMap.put(line.ReturnOrderId, innerMap);
                    }
                } else {
                    if (lineItemReturnMap.containsKey(line.ReturnOrderId)) {
                        lineItemReturnMap.get(line.ReturnOrderId).put(line, 'PARTIAL_CANCEL');
                    } else {
                        Map<ReturnOrderLineItem, String> innerMap = new Map<ReturnOrderLineItem, String>();
                        innerMap.put(line, 'PARTIAL_CANCEL');
                        lineItemReturnMap.put(line.ReturnOrderId, innerMap);
                    }
                }
            } else if (line.QuantityReturned > 0) {
                if (line.QuantityReturned == line.QuantityReceived) {
                    if (lineItemReturnMap.containsKey(line.ReturnOrderId)) {
                        lineItemReturnMap.get(line.ReturnOrderId).put(line, 'RETURNED');
                    } else {
                        Map<ReturnOrderLineItem, String> innerMap = new Map<ReturnOrderLineItem, String>();
                        innerMap.put(line, 'RETURNED');
                        lineItemReturnMap.put(line.ReturnOrderId, innerMap);
                    }
                } else {
                    if (lineItemReturnMap.containsKey(line.ReturnOrderId)) {
                        lineItemReturnMap.get(line.ReturnOrderId).put(line, 'PARTIAL_RETURNED');
                    } else {
                        Map<ReturnOrderLineItem, String> innerMap = new Map<ReturnOrderLineItem, String>();
                        innerMap.put(line, 'PARTIAL_RETURNED');
                        lineItemReturnMap.put(line.ReturnOrderId, innerMap);
                    }
                }
            }
        }
        Map<Id, String> returnAndSummaryMap = new Map<Id, String>();
        Map<Id, Id> mapReturnAndSummary = new Map<Id, Id>();
        for (ReturnOrder ret : [SELECT ID, OrderSummaryId FROM ReturnOrder WHERE ID IN : lineItemReturnMap.keySet()]) {
            mapReturnAndSummary.put(ret.id, ret.OrderSummaryId);
        }
        for (OrderSummary orderSum : [SELECT ID, OrderNumber FROM OrderSummary WHERE ID IN : mapReturnAndSummary.values()]) {
            returnAndSummaryMap.put(orderSum.id, orderSum.OrderNumber);
        }
        Set<Id> orderProductSumId = new Set<Id>();
        for (Id returnOrderId : lineItemReturnMap.keySet()) {
            for (ReturnOrderLineItem returnLine : lineItemReturnMap.get(returnOrderId).keySet()) {
                orderProductSumId.add(returnLine.OrderItemSummaryId);
            }
        }
        
        if (!orderProductSumId.isEmpty()) {
            Map<Id, OrderItemSummary> orderItemSum = new Map<Id, OrderItemSummary>();
            for (OrderItemSummary orderItem : [SELECT ID, ProductCode, Type FROM OrderItemSummary WHERE ID IN: orderProductSumId]) {
                orderItemSum.put(orderItem.id, orderItem);
            }
            OrderStatusExportAuthHelper authHelper = new OrderStatusExportAuthHelper();
            HttpResponse res = new HttpResponse();
            Order_Status_Update_Params__mdt params = authHelper.getOAuthConnInfo();
            String token = authHelper.getOAuthToken(params);
            for (Id returnId : lineItemReturnMap.keySet()) {
                String payload='';
                JSONGenerator gen = JSON.createGenerator(true);
                    gen.writeStartObject();
                    gen.writeStringField('c_orderAction', ORDER_ACTION);
                    if (lineItemReturnMap.get(returnId).values().contains('PARTIAL_CANCEL')) {
                        gen.writeNumberField('c_externalReturnStatus',returnStatusMap.get('PARTIAL_CANCEL') );
                    }else if(lineItemReturnMap.get(returnId).values().contains('PARTIAL_RETURNED')){
                        gen.writeNumberField('c_externalReturnStatus',returnStatusMap.get('PARTIAL_RETURNED') );
                    }else if(lineItemReturnMap.get(returnId).values().contains('CANCELLED')){
                        gen.writeNumberField('c_externalReturnStatus',returnStatusMap.get('CANCELLED') );
                    }else if(lineItemReturnMap.get(returnId).values().contains('RETURNED')){
                        gen.writeNumberField('c_externalReturnStatus',returnStatusMap.get('RETURNED') );
                    }

                    gen.writeFieldName('product_items');
                    gen.writeStartArray();
                    for(ReturnOrderLineItem item : lineItemReturnMap.get(returnId).keySet()){
                        if (orderItemSum.containskey(item.OrderItemSummaryId)) {
                            if(orderItemSum.get(item.OrderItemSummaryId).Type =='Order Product'){
                                gen.writeStartObject();
                                gen.writeStringField('product_id',orderItemSum.get(item.OrderItemSummaryId).ProductCode);

                                gen.writeNumberField('c_quantityReceived', item.QuantityReceived);
                                gen.writeNumberField('c_quantityReturned', item.QuantityReturned);
                                gen.writeNumberField('c_quantityRejected', item.QuantityRejected);
                                
                                if (returnStatusMap.containsKey(lineItemReturnMap.get(returnId).get(item))) {
                                    gen.writeNumberField('c_externalLineItemReturnStatus',returnStatusMap.get(lineItemReturnMap.get(returnId).get(item)));
                                }
                                gen.writeEndObject();
                            }
                        }
                    }
                    gen.writeEndArray();
                    gen.writeEndObject();
                payload = gen.getAsString();
                string orderNumber = returnAndSummaryMap.get(mapReturnAndSummary.get(returnId));
                res = authHelper.sendOrderUpdate(params, token, orderNumber, payload);
            }        
        }
    }
}
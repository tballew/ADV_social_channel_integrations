public class ExportOrderSummaryItemCancel {

    private static final String CANCEL = 'Cancel';
    private static final String ORDER_ACTION = 'update';

    @InvocableMethod(label='Export OrderItemSummary Cancel' description='Service to export Order Item Summary cancel to external system')
    public static List<OutputResource> exportService(List<Id> orderSummaryIds){
       ExportOrderSummaryItemCancel exportOrderSummaryItemCancel = new ExportOrderSummaryItemCancel();
       List<OutputResource> outputResource = exportOrderSummaryItemCancel.processData(orderSummaryIds);
	   return outputResource;
    }
    
    public List<OutputResource> processData(List<Id> orderSummaryIds){
        OrderStatusExportAuthHelper authHelper = new OrderStatusExportAuthHelper();
        Order_Status_Update_Params__mdt params = new Order_Status_Update_Params__mdt();
        HttpResponse res = new HttpResponse();
        List<OutputResource> outputResList = new List<OutputResource>();

        if(orderSummaryIds.size() > 0) {
            params = authHelper.getOAuthConnInfo();
            String token = authHelper.getOAuthToken(params);
            Map<ID, OrderSummary> orderSummaries = getOrderSummary(orderSummaryIds);
            Map<ID, OrderItemSummaryChange> orderItemSumChangesMap = getOrderItemSummaryChanges(orderSummaryIds);
            Map<ID, List<OrderItemSummaryChange>> orderItemSumChangesListMap = getOrderItemSummaryChangeListMap(orderSummaries, orderItemSumChangesMap);
            List<Id> orderItemSummaryIds = getOrderItemSummaryIds(orderItemSumChangesMap);
            Map<ID, OrderItemSummary> orderItemSummaryMap = getOrderItemSummaryMap(orderItemSummaryIds);
  		    List<Order_Export_Line_Status_Map__c> statusMap = [select id,OMS_Status__c,Export_Status__c from Order_Export_Line_Status_Map__c];

            for(String orderSummaryId : orderSummaryIds){ 
            
                OrderSummary orderSummary = orderSummaries.get(orderSummaryId);
                List<OrderItemSummaryChange> orderItemSumChanges = orderItemSumChangesListMap.get(orderSummaryId);

                if(orderItemSumChanges.size() > 0){
                    String payload = getPayload(orderSummary, orderItemSumChanges, orderItemSummaryMap, statusMap);

                    res = authHelper.sendOrderUpdate(params,token,orderSummary.OrderNumber,payload);

                    OutputResource response = new OutputResource();
    
                    response.ErrorCode= String.valueof(res.getStatusCode());
                    response.ErrorMsg = res.getStatus();
                    outputResList.add(response);
                }
            }
            updateOrdItemSumChanges(orderItemSumChangesListMap);
        }

        return outputResList;
    }

    public void updateOrdItemSumChanges(Map<ID, List<OrderItemSummaryChange>> orderItemSumChangesListMap){
        List<OrderItemSummaryChange> ordItemSumChangesListToDelete = new List<OrderItemSummaryChange>();
        List<OrderItemSummaryChange> ordItemSumChangesListToAdd = new List<OrderItemSummaryChange>();
        for(Id orderItemSumChangesListId: orderItemSumChangesListMap.keySet()){
            List<OrderItemSummaryChange> orderItemSumChangesList = orderItemSumChangesListMap.get(orderItemSumChangesListId);
            for(OrderItemSummaryChange ordItemSumChange : orderItemSumChangesList){
                ordItemSumChangesListToDelete.add(ordItemSumChange);
            }
        }
        delete ordItemSumChangesListToDelete;

        for(OrderItemSummaryChange ordItemSumChange : ordItemSumChangesListToDelete){
            ordItemSumChange.Id = null;
            ordItemSumChange.IsCancelAndSynced__c = true;
            ordItemSumChangesListToAdd.add(ordItemSumChange);
        }
        insert ordItemSumChangesListToAdd;
    }
   
    public String getPayload(OrderSummary orderSummary, List<OrderItemSummaryChange> ordItemSumChanges, Map<ID, OrderItemSummary> orderItemSummaryMap, List<Order_Export_Line_Status_Map__c> statusMap){
        List<String> providerList = new List<String>();
        Map<String, String> carrierMap = new Map<String, String>();
        String payload='';
        JSONGenerator gen = JSON.createGenerator(true);
        gen.writeStartObject();
            gen.writeStringField('c_orderAction', ORDER_ACTION);
            gen.writeFieldName('product_items');
            gen.writeStartArray();
                for(OrderItemSummaryChange ordItemSumChange : ordItemSumChanges){
                    OrderItemSummary orderItemSummary = orderItemSummaryMap.get(ordItemSumChange.OrderItemSummaryId);
                    gen.writeStartObject();
                        gen.writeStringField('product_id', orderItemSummary.ProductCode);
                        gen.writeNumberField('c_quantityCanceled', orderItemSummary.QuantityCanceled);
                        gen.writeNumberField('c_externalLineItemStatus', Integer.valueOf(getOrderLineStatus(statusMap, orderItemSummary.Status)));
                        gen.writeStringField('c_reason', ordItemSumChange.Reason);
                    gen.writeEndObject();
                }
            gen.writeEndArray();
        gen.writeEndObject();
        payload = gen.getAsString();

        return payload;
    }

    public Map<ID, List<OrderItemSummaryChange>> getOrderItemSummaryChangeListMap(Map<ID, OrderSummary> orderSummaries, Map<ID, OrderItemSummaryChange> orderItemSummaryChangeMap){
        Map<ID, List<OrderItemSummaryChange>> orderItemSummaryChangeListMap = new Map<ID, List<OrderItemSummaryChange>>();
        for(ID orderSummaryId : orderSummaries.keySet()){
            List<OrderItemSummaryChange> orderItemSummaryChangeList = new List<OrderItemSummaryChange>();
            for(ID orderItemSummaryChangeId : orderItemSummaryChangeMap.keySet()){
                OrderItemSummaryChange orderItemSummaryChange = orderItemSummaryChangeMap.get(orderItemSummaryChangeId);
                if (orderSummaryId == orderItemSummaryChange.OrderSummaryId){
                    orderItemSummaryChangeList.add(orderItemSummaryChange);
                }
            }
            orderItemSummaryChangeListMap.put(orderSummaryId, orderItemSummaryChangeList);
        }
        return orderItemSummaryChangeListMap;
    }

    public List<Id> getOrderItemSummaryIds(Map<ID, OrderItemSummaryChange> orderItemSummaryChanges){
        List<Id> orderItemSummaryIds = new List<Id>();
        for(ID orderItemSummaryChangeId: orderItemSummaryChanges.keySet()){
            OrderItemSummaryChange orderItemSummaryChange = orderItemSummaryChanges.get(orderItemSummaryChangeId);
            orderItemSummaryIds.add(orderItemSummaryChange.OrderItemSummaryId);
        }
        return orderItemSummaryIds;
    }

    public Map<ID, OrderSummary> getOrderSummary(List<String> orderSummaryId){
        Map<ID, OrderSummary> ordSummaries = new Map<ID, OrderSummary>([Select id, OrderNumber, Status from OrderSummary where id IN: orderSummaryId]);
      
        return ordSummaries;
    }

    public Map<ID, OrderItemSummary> getOrderItemSummaryMap(List<String> orderItemSummaryIds){
        Map<ID, OrderItemSummary> orderItemSummary = new Map<ID, OrderItemSummary>([Select Id, QuantityCanceled, QuantityOrdered, ProductCode, Status from OrderItemSummary where Id IN: orderItemSummaryIds]);

        return orderItemSummary;
    }

    public Map<ID, OrderItemSummaryChange> getOrderItemSummaryChanges(List<String> orderSummaryIds){
        Map<ID, OrderItemSummaryChange> orderItemSummaryChanges = new Map<ID, OrderItemSummaryChange>([Select Id, IsDeleted, OrderItemSummaryChangeNumber, CurrencyIsoCode, CreatedDate, CreatedById,
                                                                LastModifiedDate, LastModifiedById, SystemModstamp, OrderItemSummaryId, ChangeOrderItemId, OrderSummaryId,
                                                                Reason, ChangeType, IsPreFulfillment, ReasonText, IsCancelAndSynced__c 
                                                                from OrderItemSummaryChange 
                                                                where OrderSummaryId IN: orderSummaryIds and
                                                                ChangeType =: CANCEL and 
                                                                IsCancelAndSynced__c =: false]);
        
        return orderItemSummaryChanges;
    }

    //Get Order Line Status Mapping
     public String getOrderLineStatus(List<Order_Export_Line_Status_Map__c> statusMaps, String status) {
        String orderStatus='0';
       
        for(Order_Export_Line_Status_Map__c statusMap: statusMaps){
            if(statusMap.OMS_Status__c == status){
                orderStatus = statusMap.Export_Status__c;
            }
        }

        return orderStatus;
    }

    public class OutputResponse{
        public integer HTTPStatusCode;
        public string HTTPStatusRes;
    }
    
    public class OutputResource{
        @InvocableVariable(Label='Error Code')
        public String ErrorCode;
        
        @InvocableVariable(Label='Error Message')
        public String ErrorMsg;
    }
    
    public class CustomException extends Exception {
        
    }
}
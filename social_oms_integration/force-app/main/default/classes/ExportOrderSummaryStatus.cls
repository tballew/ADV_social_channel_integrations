public class ExportOrderSummaryStatus {
	private static final String ORDER_ACTION = 'update';
    private static final Integer EXPORT_STATUS = 2;
    private static final String SHIPPED_STATUS = 'shipped';
    private static final String NOT_SHIPPED_STATUS = 'not_shipped';

    
    @InvocableMethod(label='Export OrderSummary Status' description='Service to export Order Summary Status order to external system')
    public static List<OutputResource> exportService(List<Id> ids){

       ExportOrderSummaryStatus ordSum = new ExportOrderSummaryStatus();
       List<OutputResource> outputResource = ordSum.processData(ids);
	   return outputResource;
    }
    
    public List<OutputResource> processData(List<Id> ids){
        OrderStatusExportAuthHelper authHelper = new OrderStatusExportAuthHelper();
        Order_Status_Update_Params__mdt params = new Order_Status_Update_Params__mdt();
        HttpResponse res = new HttpResponse();
        List<OutputResource> outputResList = new List<OutputResource>();
        //getOrderSummaryExport Record
        List<String> inputList = new List<String>();
       
       inputList = getOrderSummaryList(ids);
		
       	
        if(inputList.size() >0) {
			   params = authHelper.getOAuthConnInfo();
        	   String token = authHelper.getOAuthToken(params);
            
              
               for(String osIn : inputList){
                    
                   List<OrderItemSummary> item = getOrderItemSummaryList(osIn);
                  
                   if(item.size() >0){
                       
                       OrderSummary ordSum = getOrderSummary(osIn);
                       
                       String payload = getPayload(item,ordSum.Status);
                       
                       res = authHelper.sendOrderUpdate(params,token,ordSum.OrderNumber,payload);
                       
                       OutputResource response = new OutputResource();
     
                    	response.ErrorCode= String.valueof(res.getStatusCode());
                    	response.ErrorMsg = res.getStatus();
						outputResList.add(response);
                       
                   }
        
                   
                    
               }
        }
    
        return outputResList;
    }
   
      
    
    public String getPayload(List<OrderItemSummary> itemList,String externalOrderStatus){
            List<String> providerList = new List<String>();
            Map<String, String> carrierMap = new Map<String, String>();
     		String payload='';
        	JSONGenerator gen = JSON.createGenerator(true);
			gen.writeStartObject();
            gen.writeStringField('c_orderAction', ORDER_ACTION);
			gen.writeFieldName('product_items');
			gen.writeStartArray();
            for(OrderItemSummary item : itemList){	
                if(Item.Type =='Order Product'){
             		for(ShipmentItem ship : item.ShipmentItems){
                        providerList.add(ship.Shipment.Provider);
               		}
                }
            }
            List<Order_Export_Carrier_Map__mdt> mapList = [SELECT Provider__c, Carrier_Name__c FROM Order_Export_Carrier_Map__mdt WHERE Provider__c IN: providerList];
            for (Order_Export_Carrier_Map__mdt mapFor : mapList) {
                carrierMap.put(mapFor.Provider__c.toLowercase(), mapFor.Carrier_Name__c);
            }
            List<ProcessException> peList = new List<ProcessException>();
        	for(OrderItemSummary item : itemList){	
                if(Item.Type =='Order Product'){
        			gen.writeStartObject();
            		gen.writeStringField('product_id',item.ProductCode);
                	gen.writeNumberField('c_externalLineItemStatus',Integer.valueOf(getOrderLineStatus(item.Status)));
             		for(ShipmentItem ship : item.ShipmentItems){
                        if (carrierMap.containsKey(ship.Shipment.Provider.toLowercase())) {
                            gen.writeStringField('c_trackingNumber',ship.Shipment.TrackingNumber);	
                            gen.writeStringField('c_carrier',carrierMap.get(ship.Shipment.Provider.toLowercase()));
                        }else {
                            ProcessException pe = new ProcessException();
                            pe.AttachedToId = item.id;
                            pe.Status = 'New';
                            pe.Priority	= 'High';
                            pe.Message = System.Label.carrier_map_exception_message;
                            pe.OrderSummaryId = item.OrderSummaryId;
                            peList.add(pe);
                        }
               		}
                    if (!peList.isEmpty()) {
                        insert peList;
                    }
            		gen.writeEndObject();
                }
            }
 
			gen.writeEndArray();
        	String externalOrderStatusCC = getOrderHeaderStatus(externalOrderStatus);
			gen.writeNumberField('c_externalChannelOrderStatus',Integer.valueOf(externalOrderStatusCC));
			gen.writeNumberField('c_externalExportStatus',EXPORT_STATUS);
       		
        	if(externalOrderStatusCC =='5')
        		gen.writeStringField('shipping_status',SHIPPED_STATUS );
       		else
                gen.writeStringField('shipping_status',NOT_SHIPPED_STATUS );
 			gen.writeEndObject();
        
        	payload = gen.getAsString();
        	return payload;
    }
    
    
     public OrderSummary getOrderSummary(String orderSummaryId){
        
        OrderSummary ordSummary = [Select id,OrderNumber,Status from OrderSummary where id =:orderSummaryId ];
       
        return ordSummary;
        
    }
    
    public List<OrderItemSummary> getOrderItemSummaryList(String orderSummaryId){
        
        List<OrderItemSummary> itemSummary = [Select id,OrderSummary.OrderNumber,OrderSummary.Status, ProductCode, Status,Type, QuantityShipped, QuantityReturned, QuantityFulfilled, 
                                              (select id,ShipmentId,Shipment.TrackingNumber,Shipment.Provider from ShipmentItems) 
                                              from OrderItemSummary where OrderSummaryId =:orderSummaryId];
        
        return itemSummary;
        
    }

    
    public  List<String> getOrderSummaryList(List<Id> ids){
        List<String> sapList = new List<String>();
        
        for(OrderSummaryExport__c  rec : [Select Order_Summary_Id__c from  OrderSummaryExport__c  where id in:ids ]){
            sapList.add(rec.Order_Summary_Id__c);
        }
      
        return sapList;
    }
    
    //Get Order Line Status Mapping
     public String getOrderLineStatus(String status) {
        
        String orderStatus='0';
       
  		Order_Export_Line_Status_Map__c statusMap = [select id,OMS_Status__c,Export_Status__c from Order_Export_Line_Status_Map__c where  OMS_Status__c=:status limit 1];
        
     	if(statusMap !=null){
            orderStatus = statusMap.Export_Status__c;
       	}
        return orderStatus;
    }
    
    //Get Order Status Mapping
     public String getOrderHeaderStatus(String status) {
        
        String orderStatus='3';
       
  		Order_Export_Header_Status_Map__c statusMap = [select id,OMS_Status__c,Export_Status__c from Order_Export_Header_Status_Map__c where  OMS_Status__c=:status limit 1];
        
     	if(statusMap !=null){
            orderStatus = statusMap.Export_Status__c;
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
 
        @InvocableVariable(Label='Order Summary Id')
        public String OrderSummaryId;
       
        
        
        
    }
    
    public class CustomException extends Exception {
        
    }
 
}
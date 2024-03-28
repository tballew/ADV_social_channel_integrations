public with sharing class OrderTriggerHandler {
    public static void handleCancellationReason(List<Order> orderList){
        List<Reason_Code_Settings__mdt> metaList = [SELECT MasterLabel, DeveloperName,TikTok__c, Instagram__c FROM Reason_Code_Settings__mdt];
        if (!metaList[0].Instagram__c) {
            Set<id> ordersId = new Set<id>();
                for (Order order : orderList) {
                    ordersId.add(order.id);
                }

            List<Order> orderSumList = [SELECT ID, Channel_Type__c FROM Order WHERE ID IN: ordersId AND Channel_Type__c = 'Instagram'];
            if (!orderSumList.isEmpty()) {
                HandleReasonCodes.updatePicklistFieldInstagram();
            }
        }
        
    }
}

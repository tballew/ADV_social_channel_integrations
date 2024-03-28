/* order statuses mapping (order.externalChannelOrderStatus)
    2   CREATED      Order Status is created (reserved for future use)
    3   NEW           Order Status is new, not shipped
    5   COMPLETED    Order Status is completed, shipped
    6   CANCELLED    Order Status is cancelled
    7   CANCELLED_PARTIAL    Order Status is cancelled partial. One or more of the order line items are cancelled or part of the quantity is cancelled.
*/

Map<String, String> omsStatusMap = new Map<String, String>();
omsStatusMap.put('Activated', '3');
omsStatusMap.put('Approved', '3');
omsStatusMap.put('Cancelled', '6');
omsStatusMap.put('Created', '3');
omsStatusMap.put('Draft', '2');
omsStatusMap.put('Fulfilled', '5');
omsStatusMap.put('Partially Fulfilled', '3');
omsStatusMap.put('Pending', '3');
omsStatusMap.put('Pickup', '3');
omsStatusMap.put('Rejected', '3');
omsStatusMap.put('Released', '3');
omsStatusMap.put('Waiting Allocation', '3');
omsStatusMap.put('Waiting Fulfillment', '3');
omsStatusMap.put('Waiting to Fulfill', '3');
Set<String> omsStatuses = omsStatusMap.keySet();

// see if each status already exists in Salesforce
List<Order_Export_Header_Status_Map__c> existingRecords = [SELECT Id, OMS_Status__c, Export_Status__c FROM Order_Export_Header_Status_Map__c WHERE OMS_Status__c IN :omsStatuses];

// create a map of existing statuses
Map<String, Order_Export_Header_Status_Map__c> existingStatusMap = new Map<String, Order_Export_Header_Status_Map__c>();
if (existingRecords.size() > 0) {
    for (Order_Export_Header_Status_Map__c existingRecord : existingRecords) {
        existingStatusMap.put(existingRecord.OMS_Status__c, existingRecord);
    }
}

// loop each status, and insert if it doesn't already exist in Salesforce
List<Order_Export_Header_Status_Map__c> recordsToInsert = new List<Order_Export_Header_Status_Map__c>();
for (String omsStatus : omsStatuses) {
    if (existingStatusMap.containsKey(omsStatus)) {
        Order_Export_Header_Status_Map__c matchingRecord = existingStatusMap.get(omsStatus);
        System.debug('OMS_Status__c of "' + matchingRecord.OMS_Status__c + '" already exists with an export status of "' + matchingRecord.Export_Status__c + '", skipping.');
    } else {
        recordsToInsert.add(new Order_Export_Header_Status_Map__c(Name=omsStatus, OMS_Status__c=omsStatus, Export_Status__c=omsStatusMap.get(omsStatus)));
    }
}

// insert records
if (recordsToInsert.size() > 0) {
    insert recordsToInsert;
    System.debug('Inserted ' + recordsToInsert.size() + ' records');
} else {
    System.debug('No records to insert');
}

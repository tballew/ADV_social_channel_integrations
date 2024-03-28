/* external line item statuses mapping (productLineItem.externalLineItemStatus)
    0   SHIPPING_STATUS_NOTSHIPPED      the products represented in the line item are not shipped
    1   SHIPPING_STATUS_PARTSHIPPED     partial quantity of the line item is shipped
    2   SHIPPING_STATUS_SHIPPED          the products represented in the line item are shipped
    6   CANCELLED                           the products represented in the line item are cancelled
    7   CANCELLED_PARTIAL                 partial quantity of the line item has been cancelled
*/

Map<String, String> lineItemStatusMap = new Map<String, String>();
lineItemStatusMap.put('Allocated', '0');
lineItemStatusMap.put('Canceled', '6');
lineItemStatusMap.put('Fulfilled', '2');
lineItemStatusMap.put('Ordered', '0');
lineItemStatusMap.put('Partially Allocated', '0');
lineItemStatusMap.put('Partially Fulfilled', '1');
lineItemStatusMap.put('Reshipped', '2');
lineItemStatusMap.put('Return Initiated', '0');
lineItemStatusMap.put('Returned', '0');
Set<String> lineItemStatuses = lineItemStatusMap.keySet();

// see if each status already exists in Salesforce
List<Order_Export_Line_Status_Map__c> existingRecords = [SELECT Id, OMS_Status__c, Export_Status__c FROM Order_Export_Line_Status_Map__c WHERE OMS_Status__c IN :lineItemStatuses];

// create a map of existing statuses
Map<String, Order_Export_Line_Status_Map__c> existingStatusMap = new Map<String, Order_Export_Line_Status_Map__c>();
if (existingRecords.size() > 0) {
    for (Order_Export_Line_Status_Map__c existingRecord : existingRecords) {
        existingStatusMap.put(existingRecord.OMS_Status__c, existingRecord);
    }
}

// loop each status, and insert if it doesn't already exist in Salesforce
List<Order_Export_Line_Status_Map__c> recordsToInsert = new List<Order_Export_Line_Status_Map__c>();
for (String lineItemStatus : lineItemStatuses) {
    if (existingStatusMap.containsKey(lineItemStatus)) {
        Order_Export_Line_Status_Map__c matchingRecord = existingStatusMap.get(lineItemStatus);
        System.debug('OMS_Status__c of "' + matchingRecord.OMS_Status__c + '" already exists with an export status of "' + matchingRecord.Export_Status__c + '", skipping.');
    } else {
        recordsToInsert.add(new Order_Export_Line_Status_Map__c(Name=lineItemStatus, OMS_Status__c=lineItemStatus, Export_Status__c=lineItemStatusMap.get(lineItemStatus)));
    }
}

// insert records
if (recordsToInsert.size() > 0) {
    insert recordsToInsert;
    System.debug('Inserted ' + recordsToInsert.size() + ' records');
} else {
    System.debug('No records to insert');
}

/* 06/23/2023 Code Coverage: 94% */
@IsTest(SeeAllData=true) //Required due to the ConnectApi call, following the documentation guidance: https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/connectAPI_TestingApex.htm
public class ExportOrderSummaryStatusTest {

    private static final SocialMockGenerator socialMockGenerator = new SocialMockGenerator();

    //It is not possible to use SeeAllData=true and @TestSetup in the same class. Therefore, each method has to create its own records.
    @isTest
    public static void testOrderSummaryChangeStatus() {
        account newAccount = socialMockGenerator.generateAccount('Coffe Account');
        Product2 newProduct = socialMockGenerator.generateProduct('Coffe Machine', '12456');
        Pricebook2 newPricebook = socialMockGenerator.generatePricebook('Coffe Machine Pricebook', true);
        PricebookEntry[] newPricebookEntry = socialMockGenerator.generatePricebookEntry(newProduct, newPricebook, 50, 50, true);
        Order newOrder = socialMockGenerator.generateOrder('draft', newAccount, newPricebook);
        OrderDeliveryMethod newOrderDeliveryMethod = socialMockGenerator.generateOrderDeliveryMethod('Test ODM', true, '12342', newProduct);
        OrderDeliveryGroup newOrderDeliveryGroup = socialMockGenerator.generateOrderDeliveryGroup(newOrder, 'Coffe Delivery', newOrderDeliveryMethod);
        OrderItem newOrderItem = socialMockGenerator.generateOrderItem(newOrder, newProduct, newPricebookEntry, 1, 10, newOrderDeliveryGroup, null);
        socialMockGenerator.updateOrderStatus(newOrder, 'Activated');

        OrderSummaryExport__c orderExpo = socialMockGenerator.generateOrderSummaryAndMap(newOrder, 'UNMANAGED');

        OrderItemSummary itemSummary = [Select id, Type, status, OrderSummaryId from OrderItemSummary WHERE OrderSummaryId =: orderExpo.Order_Summary_Id__c limit 1];
        itemSummary.Type = 'Order Product';
        update itemSummary;

        Order_Export_Line_Status_Map__c orderMap = new Order_Export_Line_Status_Map__c();
        orderMap.OMS_Status__c = itemSummary.status;
        orderMap.Export_Status__c = '2';
        insert orderMap;
        Test.startTest();

        Test.setMock(HttpCalloutMock.class, new OrderExportMockGenerator());
        List<id> idExport = new List<id>();
        idExport.add(orderExpo.id);
        List<ExportOrderSummaryStatus.OutputResource> Resource = ExportOrderSummaryStatus.exportService(idExport);
        system.assertEquals(Resource[0].ErrorCode, '200', 'Integration error');

        Test.stopTest();
    }

    @isTest
    public static void testOrderSummaryChangeStatusExternal() {
        account newAccount = socialMockGenerator.generateAccount('Coffe Account');
        Product2 newProduct = socialMockGenerator.generateProduct('Coffe Machine', null);
        Pricebook2 newPricebook = socialMockGenerator.generatePricebook('Coffe Machine Pricebook', true);
        PricebookEntry[] newPricebookEntry = socialMockGenerator.generatePricebookEntry(newProduct, newPricebook, 50, 50, true);
        Order newOrder = socialMockGenerator.generateOrder('draft', newAccount, newPricebook);
        OrderDeliveryMethod newOrderDeliveryMethod = socialMockGenerator.generateOrderDeliveryMethod('Test ODM', true, '12342', newProduct);
        OrderDeliveryGroup newOrderDeliveryGroup = socialMockGenerator.generateOrderDeliveryGroup(newOrder, 'Coffe Delivery', newOrderDeliveryMethod);
        OrderItem newOrderItem = socialMockGenerator.generateOrderItem(newOrder, newProduct, newPricebookEntry, 1, 10, newOrderDeliveryGroup,  null);
        socialMockGenerator.updateOrderStatus(newOrder, 'Activated');

        OrderSummaryExport__c orderExpo = socialMockGenerator.generateOrderSummaryAndMap(newOrder, 'UNMANAGED');

        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new OrderExportMockGenerator());
        List<id> idExport = new List<id>();
        idExport.add(orderExpo.id);
        List<ExportOrderSummaryStatus.OutputResource> Resource = ExportOrderSummaryStatus.exportService(idExport);
        system.assertEquals(Resource[0].ErrorCode, '200', 'Integration error');
        Test.stopTest();
    }
}



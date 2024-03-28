@IsTest(SeeAllData=true) 
//Required due to the ConnectApi call, following the documentation guidance: https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/connectAPI_TestingApex.htm
private class CancelOrderTest {

    private static final SocialMockGenerator socialMockGenerator = new SocialMockGenerator();

    @IsTest
    public static void testCancelOrder() {
        account newAccount = socialMockGenerator.generateAccount('Coffe Account');
        Product2 newProduct = socialMockGenerator.generateProduct('Coffe Machine',  '123456');
        Pricebook2 newPricebook = socialMockGenerator.generatePricebook('Coffe Machine Pricebook', true);
        PricebookEntry[] newPricebookEntry = socialMockGenerator.generatePricebookEntry(newProduct, newPricebook, 50, 50, true);
        Order newOrder = socialMockGenerator.generateOrder('draft', newAccount, newPricebook);
        OrderDeliveryMethod newOrderDeliveryMethod = socialMockGenerator.generateOrderDeliveryMethod('Test ODM', true, '12342', newProduct);
        OrderDeliveryGroup newOrderDeliveryGroup = socialMockGenerator.generateOrderDeliveryGroup(newOrder, 'Coffe Delivery', newOrderDeliveryMethod);
        OrderItem newOrderItem = socialMockGenerator.generateOrderItem(newOrder, newProduct, newPricebookEntry, 1, 10, newOrderDeliveryGroup, 'Order Product');
        
        socialMockGenerator.updateOrderStatus(newOrder, 'Activated');
        String orderSummaryId = socialMockGenerator.generateOrderSummary(newOrder, 'MANAGED');
        String itemSummaryId = [SELECT Id FROM OrderItemSummary WHERE OrderSummaryId =: orderSummaryId AND Product2Id =: newProduct.Id LIMIT 1].Id;

        ConnectApi.ChangeInputRepresentation changeInput = new ConnectApi.ChangeInputRepresentation();
        List<ConnectApi.ChangeItemInputRepresentation> changeItemInputRepresentationList = new List<ConnectApi.ChangeItemInputRepresentation>();
        ConnectApi.ChangeItemInputRepresentation changeItemInputRepresentation = new ConnectApi.ChangeItemInputRepresentation();
        changeItemInputRepresentation.orderItemSummaryId = itemSummaryId;
        changeItemInputRepresentation.quantity = 1;
        changeItemInputRepresentation.reason = 'Unknown';
        changeItemInputRepresentation.shippingReductionFlag = false;
        changeItemInputRepresentationList.add(changeItemInputRepresentation);
        changeInput.changeItems = changeItemInputRepresentationList;
        ConnectApi.OrderSummary.submitCancel(orderSummaryId, changeInput);

        List<String> orderSummaryIds = new List<String>();
        orderSummaryIds.add(orderSummaryId);
        ExportOrderSummaryItemCancel exportOrderSummaryItemCancel = new ExportOrderSummaryItemCancel();

        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new OrderExportMockGenerator());

        exportOrderSummaryItemCancel.processData(orderSummaryIds);

        Test.stopTest();
    }
}
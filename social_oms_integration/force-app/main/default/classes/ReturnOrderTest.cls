@IsTest(SeeAllData=true) 
//Required due to the ConnectApi call, following the documentation guidance: https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/connectAPI_TestingApex.htm
public class ReturnOrderTest {

    private static final SocialMockGenerator socialMockGenerator = new SocialMockGenerator();

    //It is not possible to use SeeAllData=true and @TestSetup in the same class. Therefore, each method has to create its own records.
    @IsTest
    public static void testCreateFullReturnOrderDraft() {
        ConnectApi.ReturnOrderOutputRepresentation returnOrderOutputRepresentation = createDraftReturnOrder(1, 1, false);
        
        Test.startTest();
        
        String returnOrderId = [SELECT Id FROM ReturnOrder WHERE Id =: returnOrderOutputRepresentation.returnOrderId LIMIT 1].Id;
        system.assertEquals(returnOrderId, returnOrderOutputRepresentation.returnOrderId, 'Error creating Return Order');

        Test.stopTest();
    }

    @IsTest
    public static void testCreateFullReturnOrderAndApprove() {
        ConnectApi.ReturnOrderOutputRepresentation returnOrderOutputRepresentation = createDraftReturnOrder(1, 1, false);

        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new OrderExportMockGenerator());

        ReturnOrder returnOrder = [SELECT Id, Status FROM ReturnOrder WHERE Id =: returnOrderOutputRepresentation.returnOrderId LIMIT 1];
        returnOrder.Status = 'Approved';
        update returnOrder;

        system.assertEquals(returnOrder.Id, returnOrderOutputRepresentation.returnOrderId, 'Error creating Return Order');

        Test.stopTest();
    }

    @IsTest
    public static void testCreateFullReturnOrderAndApproveWithShipment() {
        ConnectApi.ReturnOrderOutputRepresentation returnOrderOutputRepresentation = createDraftReturnOrder(1, 1, false);
        ReturnOrderLineItem returnOrderLineItem = [SELECT Id FROM ReturnOrderLineItem WHERE ReturnOrderId =: returnOrderOutputRepresentation.returnOrderId LIMIT 1];
        List<Shipment> shipmentList = createShipmentAndShipmentItems(returnOrderOutputRepresentation.returnOrderId, returnOrderLineItem.Id);

        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new OrderExportMockGenerator());

        ReturnOrder returnOrder = [SELECT Id, Status FROM ReturnOrder WHERE Id =: returnOrderOutputRepresentation.returnOrderId LIMIT 1];
        returnOrder.Status = 'Approved';
        update returnOrder;

        system.assertEquals(returnOrder.Id, returnOrderOutputRepresentation.returnOrderId, 'Error creating Return Order');

        Test.stopTest();
    }

    @IsTest
    public static void testCreatePartialQtyReturnOrderAndApprove() {
        ConnectApi.ReturnOrderOutputRepresentation returnOrderOutputRepresentation = createDraftReturnOrder(2, 1, false);
        
        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new OrderExportMockGenerator());

        ReturnOrder returnOrder = [SELECT Id, Status FROM ReturnOrder WHERE Id =: returnOrderOutputRepresentation.returnOrderId LIMIT 1];
        returnOrder.Status = 'Approved';
        update returnOrder;

        system.assertEquals(returnOrder.Id, returnOrderOutputRepresentation.returnOrderId, 'Error creating Return Order');

        Test.stopTest();
    }

    @IsTest
    public static void testCreatePartialItemReturnOrderAndApprove() {
        ConnectApi.ReturnOrderOutputRepresentation returnOrderOutputRepresentation = createDraftReturnOrder(1, 1, true);
        
        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new OrderExportMockGenerator());

        ReturnOrder returnOrder = [SELECT Id, Status FROM ReturnOrder WHERE Id =: returnOrderOutputRepresentation.returnOrderId LIMIT 1];
        returnOrder.Status = 'Approved';
        update returnOrder;

        system.assertEquals(returnOrder.Id, returnOrderOutputRepresentation.returnOrderId, 'Error creating Return Order');

        Test.stopTest();
    }

    @IsTest
    public static void testCreateFullReturnOrderAndCancel() {
        ConnectApi.ReturnOrderOutputRepresentation returnOrderOutputRepresentation = createDraftReturnOrder(1, 1, false);
        
        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new OrderExportMockGenerator());

        ReturnOrder returnOrder = [SELECT Id, Status FROM ReturnOrder WHERE Id =: returnOrderOutputRepresentation.returnOrderId LIMIT 1];
        returnOrder.Status = 'Canceled';
        update returnOrder;

        system.assertEquals(returnOrder.Id, returnOrderOutputRepresentation.returnOrderId, 'Error creating Return Order');

        Test.stopTest();
    }

    @IsTest
    public static void testCreatePartialQtyReturnOrderAndCancel() {
        ConnectApi.ReturnOrderOutputRepresentation returnOrderOutputRepresentation = createDraftReturnOrder(2, 1, false);
        
        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new OrderExportMockGenerator());

        ReturnOrder returnOrder = [SELECT Id, Status FROM ReturnOrder WHERE Id =: returnOrderOutputRepresentation.returnOrderId LIMIT 1];
        returnOrder.Status = 'Canceled';
        update returnOrder;

        system.assertEquals(returnOrder.Id, returnOrderOutputRepresentation.returnOrderId, 'Error creating Return Order');

        Test.stopTest();
    }

    @IsTest
    public static void testCreatePartialItemReturnOrderAndCancel() {
        ConnectApi.ReturnOrderOutputRepresentation returnOrderOutputRepresentation = createDraftReturnOrder(1, 1, true);
        
        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new OrderExportMockGenerator());

        ReturnOrder returnOrder = [SELECT Id, Status FROM ReturnOrder WHERE Id =: returnOrderOutputRepresentation.returnOrderId LIMIT 1];
        returnOrder.Status = 'Canceled';
        update returnOrder;

        system.assertEquals(returnOrder.Id, returnOrderOutputRepresentation.returnOrderId, 'Error creating Return Order');

        Test.stopTest();
    }

    public static ConnectApi.ReturnOrderOutputRepresentation createDraftReturnOrder(Decimal singleProductQuantity, Decimal returnQuantity, Boolean createSecondProduct){
        account newAccount = socialMockGenerator.generateAccount('Coffe Account');
        Product2 newProduct = socialMockGenerator.generateProduct('Coffe Machine', '12456');
        Pricebook2 newPricebook = socialMockGenerator.generatePricebook('Coffe Machine Pricebook', true);
        PricebookEntry[] newPricebookEntry = socialMockGenerator.generatePricebookEntry(newProduct, newPricebook, 50, 50, true);
        Order newOrder = socialMockGenerator.generateOrder('draft', newAccount, newPricebook);
        OrderDeliveryMethod newOrderDeliveryMethod = socialMockGenerator.generateOrderDeliveryMethod('Test ODM', true, '12342', newProduct);
        OrderDeliveryGroup newOrderDeliveryGroup = socialMockGenerator.generateOrderDeliveryGroup(newOrder, 'Coffe Delivery', newOrderDeliveryMethod);
        OrderItem newOrderItem = socialMockGenerator.generateOrderItem(newOrder, newProduct, newPricebookEntry, singleProductQuantity, 10, newOrderDeliveryGroup, 'Order Product');
        
        if(createSecondProduct){
            Product2 newProduct2 = socialMockGenerator.generateProduct('Nicer Coffe Machine', '124567');
            PricebookEntry[] newPricebookEntry2 = socialMockGenerator.generatePricebookEntry(newProduct2, newPricebook, 50, 50, true);
            OrderItem newOrderItem2 = socialMockGenerator.generateOrderItem(newOrder, newProduct2, newPricebookEntry2, singleProductQuantity, 10, newOrderDeliveryGroup, 'Order Product');
        }

        socialMockGenerator.updateOrderStatus(newOrder, 'Activated');
        String orderSummaryId = socialMockGenerator.generateOrderSummary(newOrder, 'MANAGED');
        String itemSummaryId = [SELECT Id FROM OrderItemSummary WHERE OrderSummaryId =: orderSummaryId AND Product2Id =: newProduct.Id LIMIT 1].Id;

        List<ConnectApi.OrderItemSummaryInputRepresentation> orderItemSummaryInputRepresentationList = new List<ConnectApi.OrderItemSummaryInputRepresentation>();
        ConnectApi.OrderItemSummaryInputRepresentation orderItemSummaryInputRepresentation = socialMockGenerator.generateOrderItemSummaryInputRepresentation(itemSummaryId, 1);
        orderItemSummaryInputRepresentationList.add(orderItemSummaryInputRepresentation);
        socialMockGenerator.generateFullfilmentOrder(orderSummaryId, newOrderDeliveryGroup.Id, orderItemSummaryInputRepresentationList);

        FulfillmentOrder fulfillmentOrder = [SELECT Status FROM FulfillmentOrder WHERE OrderSummaryId=: orderSummaryId LIMIT 1];
        fulfillmentOrder.Status = 'Fulfilled';
        update fulfillmentOrder;

        List<ConnectApi.ReturnOrderLineItemInputRepresentation> returnOrderLineItemInputRepresentationList = new List<ConnectApi.ReturnOrderLineItemInputRepresentation>();
        returnOrderLineItemInputRepresentationList = socialMockGenerator.generateAndAddReturnOrderLineItemInput(returnOrderLineItemInputRepresentationList, false, itemSummaryId, returnQuantity, 'Unknown');
        ConnectApi.ReturnOrderInputRepresentation returnOrderInputRepresentation = socialMockGenerator.generateReturnOrderInput(orderSummaryId, 'MANAGED', 'Draft', returnOrderLineItemInputRepresentationList);

        return socialMockGenerator.generateReturnOrder(returnOrderInputRepresentation);
    }

    public static List<Shipment> createShipmentAndShipmentItems(String returnOrderId, String returnOrderLineItemId) {
        List<Shipment> shipmentList = new List<Shipment>();
        Shipment shipment = socialMockGenerator.generateShipment(returnOrderId);
        ShipmentItem shipmentItem = socialMockGenerator.generateShipmentItem(shipment.Id, returnOrderLineItemId);
        shipmentList.add(shipment);
        return shipmentList;
    }
}



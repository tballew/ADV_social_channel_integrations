@IsTest(SeeAllData=true)
public class SocialMockGenerator {
    public account generateAccount(String name){
        account acc = new account();
        acc.name = name;
        insert acc;
        return acc;
    }

    public Product2 generateProduct(String name, String productCode){
        Product2 newProduct = new Product2();
        newProduct.Name = name;
        if (productCode != null) {
            newProduct.ProductCode = productCode;
        }
        insert newProduct;
        return newProduct;
    }

    public Pricebook2 generatePricebook(String name, Boolean isActive){
        Pricebook2 newPricebook =  new Pricebook2();
        newPricebook.Name = name;
        newPricebook.IsActive = isActive;
        insert newPricebook;
        return newPricebook;
    }

    public List<PricebookEntry> generatePricebookEntry(Product2 product, Pricebook2 pricebook, Decimal standardUnitPrice, Decimal newUnitPrice, Boolean isActive){
        List<PricebookEntry> newPricebookEntry = new PricebookEntry[]{
            new PricebookEntry (Product2ID = product.id, 
                                Pricebook2ID = Test.getStandardPricebookId(),
                                UnitPrice = standardUnitPrice,
                                isActive = isActive),
            new PricebookEntry (Product2ID = product.id,
                                Pricebook2ID = pricebook.id,
                                UnitPrice = newUnitPrice,
                                isActive = isActive)
        };
        insert newPricebookEntry;
        return newPricebookEntry;
    }

    public Order generateOrder(String status, account account, Pricebook2 pricebook){
        Order newOrder = new Order();
        newOrder.Status = status;
        neworder.AccountId = account.id;
        newOrder.Pricebook2Id = pricebook.id;
        neworder.EffectiveDate = date.today();
        insert newOrder;
        return newOrder;
    }

    public OrderDeliveryMethod generateOrderDeliveryMethod(String name, Boolean isActive, String referenceNumber, Product2 product){
        OrderDeliveryMethod newOrderDeliveryMethod = new OrderDeliveryMethod();
        newOrderDeliveryMethod.Name = name;
        newOrderDeliveryMethod.IsActive = isActive;
        newOrderDeliveryMethod.ReferenceNumber = referenceNumber;
        newOrderDeliveryMethod.ProductId = product.Id;        
        insert newOrderDeliveryMethod;
        return newOrderDeliveryMethod;
    }

    public OrderDeliveryGroup generateOrderDeliveryGroup(Order order, String name, OrderDeliveryMethod orderDeliveryMethod){
        OrderDeliveryGroup orderDeliveryGroup = new OrderDeliveryGroup(
            OrderId = order.id,
            DeliverToName = name,
            OrderDeliveryMethodId = orderDeliveryMethod.id
        );
        insert orderDeliveryGroup;
        return orderDeliveryGroup;
    }

    public OrderItem generateOrderItem(Order order, Product2 product, List<PricebookEntry> pricebookEntry, Decimal quantity, Decimal unitPrice, OrderDeliveryGroup orderDeliveryGroup, String type){
        OrderItem newOrderItem = new OrderItem();
        newOrderItem.OrderId = order.Id;
        newOrderItem.Product2Id = product.Id;
        newOrderItem.PricebookEntryId = pricebookEntry[1].Id;
        newOrderItem.Quantity = quantity;
        newOrderItem.UnitPrice = unitPrice;
        newOrderItem.OrderDeliveryGroupId = orderDeliveryGroup.id;
        newOrderItem.TotalLineAmount = quantity * unitPrice;
        if(type != null){
            newOrderItem.Type = type;
        }
        insert newOrderItem;
        return newOrderItem;
    }

    public void updateOrderStatus(Order order, String status){ 
        order.status = status;
        update order;
    }

    public ConnectApi.ReturnOrderInputRepresentation generateReturnOrderInput(String orderSummaryId, String returnOrderLifeCycleType, String status, List<ConnectApi.ReturnOrderLineItemInputRepresentation> returnOrderLineItemInputRepresentationList){
        ConnectApi.ReturnOrderInputRepresentation returnOrderInput = new ConnectApi.ReturnOrderInputRepresentation();
        returnOrderInput.orderSummaryId = orderSummaryId;
        returnOrderInput.returnOrderLifeCycleType = returnOrderLifeCycleType;
        returnOrderInput.status = status;
        returnOrderInput.returnOrderLineItems = returnOrderLineItemInputRepresentationList;
        return returnOrderInput;
    }

    public List<ConnectApi.ReturnOrderLineItemInputRepresentation> generateAndAddReturnOrderLineItemInput(
        List<ConnectApi.ReturnOrderLineItemInputRepresentation> returnOrderLineItemInputRepresentationList,
        Boolean canReduceShipping,
        String orderItemSummaryId,
        Decimal quantityExpected,
        String reasonForReturn
    ){
        ConnectApi.ReturnOrderLineItemInputRepresentation returnOrderLineItemInputRepresentation = new ConnectApi.ReturnOrderLineItemInputRepresentation();

        returnOrderLineItemInputRepresentation.canReduceShipping = canReduceShipping;
        returnOrderLineItemInputRepresentation.orderItemSummaryId = orderItemSummaryId;
        returnOrderLineItemInputRepresentation.quantityExpected = quantityExpected;

        if(reasonForReturn != null){
            returnOrderLineItemInputRepresentation.reasonForReturn = reasonForReturn;
        }
        
        returnOrderLineItemInputRepresentationList.add(returnOrderLineItemInputRepresentation);

        return returnOrderLineItemInputRepresentationList;
    }

    public ConnectApi.ReturnOrderOutputRepresentation generateReturnOrder(ConnectApi.ReturnOrderInputRepresentation returnOrderInput){
        ConnectApi.ReturnOrderOutputRepresentation returnOrderOutputRepresentation = ConnectApi.ReturnOrder.createReturnOrder(returnOrderInput);

        return returnOrderOutputRepresentation;
    }

    public String generateOrderSummary(Order order, String orderLifeCycleType){
        ConnectApi.OrderSummaryInputRepresentation orderSum = new ConnectApi.OrderSummaryInputRepresentation();
        orderSum.orderId = order.id;
        orderSum.orderLifeCycleType = orderLifeCycleType;
        ConnectApi.OrderSummaryOutputRepresentation orderSumOut = ConnectApi.OrderSummaryCreation.createOrderSummary(orderSum);

        return orderSumOut.orderSummaryId;
    }

    public OrderSummaryExport__c generateOrderSummaryAndMap(Order order, String orderLifeCycleType){
        String orderSummaryId = generateOrderSummary(order, orderLifeCycleType);

        String orderSummaryStatus = String.ValueOf([SELECT ID, Status FROM OrderSummary WHERE Id =: orderSummaryId].STATUS);

        OrderSummaryExport__c orderExpo = new OrderSummaryExport__c();
        orderExpo.Created_Date__c = datetime.now();
        orderExpo.Export_Attempt_Date_Time__c = datetime.now();
        orderExpo.Export_Attempts_Counter__c = 1;
        orderExpo.Order_Summary_Id__c = orderSummaryId;
        orderExpo.Status__c = 'New';
        insert orderExpo;

        Order_Export_Header_Status_Map__c statusHeader = new Order_Export_Header_Status_Map__c();
        statusHeader.OMS_Status__c = orderSummaryStatus;
        statusHeader.Export_Status__c = '2';
        insert statusHeader;

        return orderExpo;
    }

    public ConnectApi.OrderItemSummaryInputRepresentation generateOrderItemSummaryInputRepresentation(String itemSummaryId, Decimal quantity){
        ConnectApi.OrderItemSummaryInputRepresentation orderItemSummaryInputRepresentation = new ConnectApi.OrderItemSummaryInputRepresentation();
        orderItemSummaryInputRepresentation.orderItemSummaryId = itemSummaryId;
        orderItemSummaryInputRepresentation.quantity = quantity;
        return orderItemSummaryInputRepresentation;
    }

    public void generateFullfilmentOrder(String orderSummaryId, String orderDeliveryGroupId, List<ConnectApi.OrderItemSummaryInputRepresentation> orderItemSummaryInputRepresentationList){
        ConnectApi.FulfillmentOrderInputRepresentation fulfillmentOrderInput = new ConnectApi.FulfillmentOrderInputRepresentation();
        List<ConnectApi.FulfillmentGroupInputRepresentation> fulfillmentGroupInputRepresentationList = new List<ConnectApi.FulfillmentGroupInputRepresentation>();
        ConnectApi.FulfillmentGroupInputRepresentation fulfillmentGroupInputRepresentation = new connectApi.FulfillmentGroupInputRepresentation();

        Schema.Location location = new Schema.Location();
        location.Name = 'inventory_m';
        location.LocationType = 'Store';
        location.IsInventoryLocation = true;
        location.ShouldSyncWithOci = true;
        location.ExternalReference = 'inventory_m';
        insert location;

        fulfillmentGroupInputRepresentation.fulfilledFromLocationId = location.Id;
        fulfillmentGroupInputRepresentation.fulfillmentType = 'In Store Pickup';
        fulfillmentGroupInputRepresentation.orderItemSummaries = orderItemSummaryInputRepresentationList;
        fulfillmentGroupInputRepresentationList.add(fulfillmentGroupInputRepresentation);
        fulfillmentOrderInput.fulfillmentGroups = fulfillmentGroupInputRepresentationList;
        fulfillmentOrderInput.orderSummaryId = orderSummaryId;
        String orderDeliveryGroupSummaryId = [SELECT Id FROM OrderDeliveryGroupSummary WHERE OriginalOrderDeliveryGroupId=:orderDeliveryGroupId LIMIT 1].Id;
        fulfillmentOrderInput.orderDeliveryGroupSummaryId = orderDeliveryGroupSummaryId;
        ConnectApi.FulfillmentOrder.createFulfillmentOrders(fulfillmentOrderInput);
    }


    public Shipment generateShipment(String returnOrderId){
        Shipment newShipment = new Shipment();
        newShipment.ShipToName = 'Default';
        newShipment.TrackingUrl = 'Test URL';
        newShipment.ReturnOrderId = returnOrderId;
        insert newShipment;
        return newShipment;
    }

    public ShipmentItem generateShipmentItem(String shipmentId, String returnOrderLineItemId){
        ShipmentItem newShipmentItem = new ShipmentItem();
        newShipmentItem.ShipmentId = shipmentId;
        newShipmentItem.ReturnOrderLineItemId = returnOrderLineItemId;
        newShipmentItem.Quantity = 1;
        insert newShipmentItem;
        return newShipmentItem;
    }
}
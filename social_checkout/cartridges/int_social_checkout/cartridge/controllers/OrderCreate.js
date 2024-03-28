'use strict';

var server = require('server');
var orderCreateHelper = require('*/cartridge/scripts/orderCreateHelpers');

/**
 * OrderCreate-PlaceOrder : The CheckoutServices-PlaceOrder endpoint places the order
 * @name CheckoutServices-PlaceOrder
 * @function
 * @memberof CheckoutServices
 * @param {middleware} - server.middleware.https
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */


server.post('Social', function (req, res, next) {
	/* Local API Includes */
	var CustomerMgr = require('dw/customer/CustomerMgr');
    var ProductInventoryMgr = require ('dw/catalog/ProductInventoryMgr');
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
	var Shipment = require('dw/order/Shipment');
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var Money = require('dw/value/Money');
    var OrderMgr = require('dw/order/OrderMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
	var Order = require('dw/order/Order');
    var socialInventoryList =  null;
	var inTransaction = false;
    var isGuest = true;
    var customer =null;

    session.custom.isSocial=true;

    //get  order JSON string
    var orderReqStr = req.httpParameterMap.getRequestBodyAsString();

    try {
        var  orderJSON = JSON.parse(orderReqStr);
    } catch (e) {
        res.json({
            error: true,
            msg: "Unable to parse order json"
        });
        return next();

    }

    //check channel inventory list
    if (orderJSON.hasOwnProperty ('social_channel_id')) {
        var iListID = "inventory_s_channel_"+orderJSON.social_channel_id;
        socialInventoryList = ProductInventoryMgr.getInventoryList(iListID);
        if (socialInventoryList == null) {
            res.json({
                error: true,
                msg: "no inventory list for this social channel"
            });
            return next();
        }
    }
    else {
        res.json({
            error: true,
            msg: "social channel id parameter missing"
        });
        return next();
    }

    try {
        //create Basket for order
        var socialBasket = BasketMgr.getCurrentOrNewBasket();

        Transaction.begin();
        inTransaction = true;

        //set customer info
        if (!isGuest) {
            socialBasket.setCustomerNo(customerInfo.customer_no);
        }
        socialBasket.setCustomerEmail(customerInfo.customer_email);
        socialBasket.setCustomerName(customerInfo.customer_name);

        // Create billing address
        orderCreateHelper.setBillingAddress (socialBasket, customerInfo.billing_address)

		//create shipping address using default shipment
        var shipment = orderCreateHelper.setShippingAddress (socialBasket, orderJSON.shipment);

		// Create product line items and set cost
        var itemStockInfo = orderCreateHelper.addItemsToBasket(socialBasket,shipment,  orderJSON.product_lineitems, socialInventoryList);

        //check item availability
        if (itemStockInfo.error == true) {
            Transaction.rollback();
            res.json(itemStockInfo);
            return next();
        }

        //set shipping method
        orderCreateHelper.setShippingMethod (shipment, orderJSON.shipment);
        
        // Set shipping cost
        orderCreateHelper.setShippingCost(shipment, orderJSON.totals.adjusted_shipping_total);

        // remove any promotions
        orderCreateHelper.removePriceAdjustments(socialBasket);

        // Update totals and do not call calculate hook since it will override prices, promotions, and taxes
		socialBasket.updateTotals();
		socialBasket.updateOrderLevelPriceAdjustmentTax();


        // Add basket currency, credit card payment instrument, and payment transaction
	    socialBasket.removeAllPaymentInstruments();
	    var currency = orderJSON.currency;
		var amount = new Money(socialBasket.getTotalGrossPrice().getValue(), currency);

        var paymentMethod = orderJSON.payment.payment_method;

        var opi = socialBasket.createPaymentInstrument(paymentMethod, amount);
        opi.paymentTransaction.setPaymentProcessor(PaymentMgr.getPaymentMethod(paymentMethod).paymentProcessor);

		// Set channel type for reporting
		socialBasket.setChannelType(orderJSON.social_channel_id);

        //create order
        var order = OrderMgr.createOrder(socialBasket);

        // Tie customer record to the order
        if (!isGuest) {
	        order.setCustomer(customer);
        }

        var placeOrderStatus = OrderMgr.placeOrder(order);
        if (placeOrderStatus.error) {
            OrderMgr.failOrder(order, false);
            res.json({
                error: true,
                success: "Failed order. Order #" + order.orderNo
            });
            return next();
        }

        Transaction.commit();
		inTransaction = false;
        res.json({
            error: false,
            orderNo: order.orderNo,
            orderItems: itemStockInfo.itemInfo,
            msg: "Success Order Created with  order #"+ order.orderNo
        });
        return next();
    } catch (e) {
        if (inTransaction) Transaction.rollback();

        res.json({
            error: true,
            msg: "Exception: " + e
        });
        return next();
    }

});

module.exports = server.exports();

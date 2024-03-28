'use strict';

/**
 * set the billing address for the order
 * @param {dw.order.Basket} basket - basket 
 * @param {Object} billingAdressJson - object representing the billing address 
 * */
function  setBillingAddress (basket, billingAdressJson)  {
    var billingAddress = basket.createBillingAddress();
    billingAddress.setFirstName(billingAdressJson.first_name);
    billingAddress.setLastName(billingAdressJson.last_name);
    billingAddress.setAddress1(billingAdressJson.address1);
    billingAddress.setAddress2(billingAdressJson.address2);
    billingAddress.setCity(billingAdressJson.city);
    billingAddress.setPostalCode(billingAdressJson.postal_code);
    billingAddress.setStateCode(billingAdressJson.state_code);
    billingAddress.setCountryCode(billingAdressJson.country_code);
    billingAddress.setPhone(billingAdressJson.phone);
}

/**
 * set the shipping address for the order
 * @param {dw.order.Basket} basket - basket
 * @param {Object} shipmentJson - json representing the shippment
 * @return {object} shipment - shipment object of the basket
 * */
 function setShippingAddress (basket, shipmentJson)  {
    var shipment = basket.getDefaultShipment();
    var shippingAddress = shipment.shippingAddress;
    var shippingAdressJson = shipmentJson.shipping_address;
    shippingAddress = shipment.createShippingAddress();
    shippingAddress.setFirstName(shippingAdressJson.first_name);
    shippingAddress.setLastName(shippingAdressJson.last_name);
    shippingAddress.setAddress1(shippingAdressJson.address1);
    shippingAddress.setAddress2(shippingAdressJson.address2);
    shippingAddress.setCity(shippingAdressJson.city);
    shippingAddress.setPostalCode(shippingAdressJson.postal_code);
    shippingAddress.setStateCode(shippingAdressJson.state_code);
    shippingAddress.setCountryCode(shippingAdressJson.country_code);
    shippingAddress.setPhone(shippingAdressJson.phone);
    return shipment;
}

/**
 * add the items to the basket
 * @param {dw.order.Basket} basket - basket
 * @param {object} shipment - shipment object of the basket
 * @param {Object} productItems - list of product lime items
 * @param {Object} sInventory - social inventory list
 * */
function addItemsToBasket(basket, shipment, productItems, sInventory) {
    try {
        var itemInfoArray = [];
        for(var i = 0; i < productItems.length; i++) {
            var item =  productItems[i];
            var productID = item.product_id;
            var qty = item.quantity;
            //check inventory
            var piRecord =  sInventory.getRecord(productID);
            if (piRecord != null) {
                var scATS = piRecord.ATS.value ;
                if (scATS >= qty) {
                    var pli = basket.createProductLineItem(productID, shipment);
                    pli.setProductInventoryList(sInventory);
                    pli.setQuantityValue(qty*1);
                    var price = item.net_price;
                    price /= qty;
                    pli.setPriceValue(price);
                    var taxRate = item.tax_rate;
                    pli.updateTax(taxRate*1.0);
                    itemInfoArray.push({
                        product_id: productID,
                        ats: scATS - qty
                    });
                } else {
                    return {
                        error: true,
                        product_id :productID,
                        ats: piRecord.ATS.value,
                        msg: "Insufficient qty available"
                    };
                }
            } else {
                return {
                    error: true,
                    product_id :productID,
                    msg: "Item not available for the given social channel"
                };
            }
        }
        return {
            error: false,
            itemInfo: itemInfoArray,
            msg: "item added to cart"
        };
    } catch (e) {
        return {
            error: true,
            msg: "Error adding item : " +  e
        };
    }
}


/**
 * set shipping method
 * @param {object} shipment - shipment object of the basket
 * @param {Object} shipmentJson - json representing the shippment
 * */
 function setShippingMethod(shipment, shipmentJson) {
    var ShippingMgr = require('dw/order/ShippingMgr');
    var methods = ShippingMgr.getAllShippingMethods().iterator();
    var shipMethodID = shipmentJson.shipping_method;
    var shippingMethod = null;
    while (methods.hasNext()) {
        var method = methods.next();
        if (method.getID() === shipMethodID) {
            shippingMethod = method;
            break;
        }
    }
    shipment.setShippingMethod(shippingMethod);
}


/**
 * set shipping cost
 * @param {object} shipment - shipment object of the basket
 * @param {object} shippingTotalsJson - Json of the shipping totals
 * */
 function setShippingCost(shipment, shippingTotalsJson) {
	    var sli = shipment.getStandardShippingLineItem();
	    var shippingCost = shippingTotalsJson.net_price;
	    sli.setPriceValue(shippingCost*1.0);
		sli.updateTax(0.0);
}

/**
 * remove any promotion/price adjustments
 * @param {dw.order.Basket} basket - basket
 * */
 function removePriceAdjustments(basket) {
    var paIter = basket.priceAdjustments.iterator();
    while (paIter.hasNext()) {
        var pa = paIter.next();
        basket.removePriceAdjustment(pa);
    }
}


module.exports = {
    setBillingAddress: setBillingAddress,
    setShippingAddress: setShippingAddress,
    addItemsToBasket : addItemsToBasket,
    setShippingMethod : setShippingMethod,
    setShippingCost : setShippingCost,
    removePriceAdjustments : removePriceAdjustments
};

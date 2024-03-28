'use strict';

var Status = require('dw/system/Status');
var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');
var Shipment = require('dw/order/Shipment');

const responseCodes = {
  SUCCESS: {
    status: Status.OK,
    code: "SUCCESS",
    msg: "Shipment(s) successfully updated."
  },
  NOTUPDATED: {
    status: Status.ERROR,
    code: "NOTUPDATED",
    msg: "1 or more shipment(s) weren't updated cuz either a) request didn't transition it to 'shipped' or b) it wasn't already in a 'shipped' state."
  },
  NOTEXISTS: {
    status: Status.ERROR,
    code: "NOTEXISTS",
    msg: "1 or more shipment(s) weren't updated cuz they didn't exist for the given order."
  },
  BADREQUEST: {
    status: Status.ERROR,
    code: "BADREQUEST",
    msg: "Incorrect shipment(s) info 'c_shipmentsInfo' json."
  }
}

/**
 * Find order shipment by shipping no
 * @note you can use order.getShipment(shipment_id) if you have the shipment ID, but not the shipping number.
 * 
 * @param {dw.order.Order} order Order to search
 * @param {string} shippingNo Shipping number to search for
 * @returns {dw.order.Shipment|null}
 **/
function getShipmentByShippingNo(orderShipments, shippingNo) {
  for (var i = 0; i < orderShipments.length; ++i) {
    var orderShipment = orderShipments[i];
    if (orderShipment.getShipmentNo() === shippingNo) {
      return orderShipments[i];
    }
  }
  return null;
}

// PATCH	/orders/{order_no}
// Considered fields for update are status (same status transitions are possible as for
// dw.order.Order.setStatus(int status) plus CREATED to FAILED) and custom properties.
// sample: 
// {
//   "status": "cancelled",
//   "c_shipmentsInfo": "{\"00000001\":{\"trackingNumber\":\"1142\",\"shippingStatus\":\"shipped\"},\"00000002\":{\"trackingNumber\":\"2132\",\"trackingUrl\":\"www.trackingparcel.com\"},\"00000003\":{\"trackingNumber\":\"1142\"}}"
//}
exports.afterPATCH = function (order, orderInput) {
  var isOrderStatusUpdate = false;
  var response = Transaction.wrap(function () {

    if(!empty(orderInput) && !empty(order.custom.shipmentsInfo)) {
      var jsonShippingInfo = JSON.parse(order.custom.shipmentsInfo);
      if (empty(jsonShippingInfo)) return responseCodes.BADREQUEST;
      var keys = Object.keys(jsonShippingInfo);
      var orderShipments = order.getShipments();
      for (var i=0; i<keys.length; i++) {
        var shipmentNo = keys[i];
        var orderShipment = getShipmentByShippingNo(orderShipments, shipmentNo);
        if (!empty(orderShipment)) {
          var shipmentNewValues = jsonShippingInfo[shipmentNo];
          if  (
                (!empty(shipmentNewValues) && (!empty(shipmentNewValues.shippingStatus)) && (shipmentNewValues.shippingStatus == "shipped") )
                  ||
                (orderShipment.getShippingStatus().getValue() == Shipment.SHIPPING_STATUS_SHIPPED)
              )
          {
              orderShipment.setShippingStatus(Shipment.SHIPPING_STATUS_SHIPPED);
              if (!empty(shipmentNewValues.trackingNumber)) orderShipment.setTrackingNumber(shipmentNewValues.trackingNumber);
              if (!empty(shipmentNewValues.trackingUrl)) orderShipment.custom.trackingUrl = shipmentNewValues.trackingUrl;
              isOrderStatusUpdate = true;
          } else return responseCodes.NOTUPDATED;
        } else return responseCodes.NOTEXISTS;
      }
    }
    return responseCodes.SUCCESS;
  });
	dw.system.HookMgr.callHook('app.order.events.update', 'update', order);
  return new Status(response.status, response.code, response.msg);
};

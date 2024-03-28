'use strict';

var OrderMgr = require('dw/order/OrderMgr'),
    Order = require('dw/order/Order'),
    Logger = require('dw/system/Logger'),
    File = require('dw/io/File'),
    FileReader = require('dw/io/FileReader'),
    Status = require('dw/system/Status'),
    CSVStreamReader = require('dw/io/CSVStreamReader');


/**
 * Script to update order and shipping status
 * @param {Object} args The argument object
 * @returns {boolean} - returns execute result
 */
 function execute(args) {
   try {
      //read order statuses csv file
      var ioreader = new FileReader(new File(File.IMPEX + File.SEPARATOR +args.statusFileFolder+  File.SEPARATOR + args.statusFileName)),
      csvReader = new CSVStreamReader(ioreader),
      csvLine = csvReader.readNext();

      while (csvLine != null) {

         var order = OrderMgr.getOrder(csvLine[0]);
         if (order != null) {
            var sfOrderStatus = null;
            var sfShippingStatus = null;
            var orderStatusTxt = csvLine[1];
            var orderShippingStatusTxt = csvLine[2];

            //get order status
            if (orderStatusTxt === 'ORDER_STATUS_CANCELLED') {
               sfOrderStatus = Order.ORDER_STATUS_CANCELLED;
            } 
            
            //get shipment status
            if (orderShippingStatusTxt === 'SHIPPING_STATUS_NOTSHIPPED') {
               sfShippingStatus = Order.SHIPPING_STATUS_NOTSHIPPED;
            } else if (orderShippingStatusTxt === 'SHIPPING_STATUS_PARTSHIPPED') {
               sfShippingStatus = Order.SHIPPING_STATUS_PARTSHIPPED;
            } else if (orderShippingStatusTxt === 'SHIPPING_STATUS_SHIPPED') {
               sfShippingStatus = Order.SHIPPING_STATUS_SHIPPED;
            }

            if (sfOrderStatus != null || sfShippingStatus != null) {
                  if (sfOrderStatus != null) {
                     order.setStatus(sfOrderStatus);
                  }
                  if (sfShippingStatus != null) {
                     order.setShippingStatus(sfShippingStatus);
                  }
            }
         }
         csvLine = csvReader.readNext();
     }


   } catch (e) {
       Logger.error('Update order status Job error: ' + e);
       return new Status(Status.ERROR, null, e.message);
   }
   return new Status(Status.OK);
}

exports.execute = execute;
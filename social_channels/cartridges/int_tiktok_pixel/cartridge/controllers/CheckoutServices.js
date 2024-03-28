'use strict';

var server = require('server');

server.extend(module.superModule);


/**
 * append to call the TikTok Pixel tracking
 * 
 */
server.append('PlaceOrder', function (req, res, next) {
  if (session.isTrackingAllowed() && session.custom.enableTracking && session.custom.enableCompletePaymentEvent) {
    var trackingHelper = require('../scripts/trackingHelper');
    trackingHelper.firePixelEvent(trackingHelper.EVENTID.CompletePayment,res.viewData)
  }
  return next();
});

module.exports = server.exports();
'use strict';

var server = require('server');

server.extend(module.superModule);


/**
 * append to call the TikTok Pixel tracking
 * 
 */
server.append('Begin', function (req, res, next) {
  if (session.isTrackingAllowed() && session.custom.enableTracking && session.custom.enableInitiateCheckoutEvent) {
    var trackingHelper = require('../scripts/trackingHelper');
    trackingHelper.firePixelEvent(trackingHelper.EVENTID.InitiateCheckout, res.viewData)
  }
  return next();
});

module.exports = server.exports();
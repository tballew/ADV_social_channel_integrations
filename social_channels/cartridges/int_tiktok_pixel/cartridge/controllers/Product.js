'use strict';

var server = require('server');

server.extend(module.superModule);


/**
 * append to call the TikTok Pixel tracking
 * 
 */
server.append('Show', function (req, res, next) {
  if (session.isTrackingAllowed() && session.custom.enableTracking && session.custom.enableProductShowEvent) {
    var trackingHelper = require('../scripts/trackingHelper');
    trackingHelper.firePixelEvent(trackingHelper.EVENTID.ViewContent,res.viewData,session.custom.trackRT)
  }
  return next();
});

module.exports = server.exports();
'use strict';

var Status = require('dw/system/Status');
var CustomObjectMgr = require ('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger');

/**
 * Read the que
 * @param {Object} args The argument object for the jobs
 * @returns {boolean} - returns execute result
 */
 function batchTikTokEvents(args) {
   try {
    var tiktokService = require('int_tiktok/cartridge/scripts/services/tiktokService');
    var customObjectHelper = require('int_tiktok/cartridge/scripts/customObjectHelper');
    var tikTokSettings = customObjectHelper.getCustomObject();
      var batchData;
      var scvResponse;
      var numRuns = args.runs;
      var totalEvents = 0;
      for (var i = 0; i < numRuns; i++) {
        var deleteCO = [];
        batchData = getEventBatch(args.batchSize,deleteCO);
        if (batchData.length > 0) {
          scvResponse = tiktokService.batchPixelTrack(tikTokSettings,batchData);
          if (scvResponse) {
            deleteCO.forEach(function (coTikTokEvent) {
              CustomObjectMgr.remove(coTikTokEvent);
            });
            totalEvents = totalEvents + batchData.length;
            Logger.info("Batch : " + (i+1) + "   events : " + batchData.length);
          }
          else {
            return new Status(Status.ERROR, null, "Batch API Service call failed");
          }
        }
        else {
          Logger.info("No events to send, total send events : " + totalEvents);
          return new Status(Status.OK);     
        }
      }
   } catch (e) {
       Logger.error('Update order status Job error: ' + e);
       return new Status(Status.ERROR, null, e.message);
   }
   Logger.info("Total Events send = " + totalEvents);
   return new Status(Status.OK);
}


/**
 * @description get batch of queued events to send to TikTok
 */

 function getEventBatch(batchSize, deleteCO) {
  var coTikTokEvents = CustomObjectMgr.queryCustomObjects("TikTokWebEvents", "", "creationDate asc", null);
  var coCounter = 0;
  var batchEvents = [];
  while (coTikTokEvents.hasNext() && coCounter < batchSize) {
    var tikTokEvent = coTikTokEvents.next();
    var jsonEvent = {
      type: "track",
      event: tikTokEvent.custom.event,
      event_id: tikTokEvent.custom.event_id,
      timestamp: tikTokEvent.custom.EventTimestamp.split("_")[0],
      context: {
          ad: {
              callback: ((!!tikTokEvent.custom.ttclid) ? tikTokEvent.custom.ttclid : "")
          },
          page: {
            url: tikTokEvent.custom.url,
            referrer: ((!!tikTokEvent.custom.referrer) ? tikTokEvent.custom.referrer : "")
          },
          user: {
            external_id:((!!tikTokEvent.custom.external_id) ? tikTokEvent.custom.external_id : ""),
            phone_number: ((!!tikTokEvent.custom.phone_number) ? tikTokEvent.custom.phone_number : ""),
            email: ((!!tikTokEvent.custom.email) ? tikTokEvent.custom.email : "")
          },
          user_agent: tikTokEvent.custom.user_agent  
      },
      properties: tikTokEvent.custom.properties
    };
    batchEvents.push(jsonEvent);
    deleteCO.push(tikTokEvent)
    coCounter++;
  }
  
  return batchEvents;
}


exports.batchTikTokEvents = batchTikTokEvents;

/**
 *  check if advance matching is enabled
 * 
 */

'use strict';

var Status = require('dw/system/Status'),
    tiktokService = require('int_tiktok/cartridge/scripts/services/tiktokService');


/**
 * Job to check the advance matching flag in TikTok settinfs
 * @param {Object} args The argument object
 * @returns {boolean} - returns execute result
 */
  function checkAM(args) {
  try {
    var customObjectHelper = require('int_tiktok/cartridge/scripts/customObjectHelper');
    var tikTokSettings = customObjectHelper.getCustomObject(true);
    if (tikTokSettings !=null) {
      // Get the Pixel details of the customer's app
      var getPixelResponse = tiktokService.getPixelDetails(tikTokSettings);
      if (getPixelResponse.error) {
        return new Status(Status.ERROR, null, "Not connected to TikTok yet");
      }
      else {
        var Transaction = require('dw/system/Transaction');
        Transaction.wrap(function () {
          tikTokSettings.custom.enableAdvancedMatchingPhone = getPixelResponse.result.data.pixels[0].advanced_matching_fields.phone_number;
          tikTokSettings.custom.enableAdvancedMatchingEmail = getPixelResponse.result.data.pixels[0].advanced_matching_fields.email;
        });
      }    
    }
    else {
      return new Status(Status.ERROR, null, "Not connected to TikTok yet");
    }
   } catch (e) {
       Logger.error('Update order status Job error: ' + e);
       return new Status(Status.ERROR, null, e.message);
   }
   return new Status(Status.OK);
}

exports.checkAM = checkAM;
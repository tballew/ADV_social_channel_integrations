'use strict';

/**
 * The onSession hook is called for every new session in a site. This hook can be used for initializations,
 * like to prepare promotions or pricebooks based on source codes or affiliate information in
 * the initial URL. For performance reasons the hook function should be kept short.
 *
 */

 var Status = require('dw/system/Status');

/**
 * Gets the TikTok client id if the customer is beeing redirect from TikTok
 * @return {string} The value of ttclid used to match website visitor events with TikTok ads
 */
function getTikTokClientID() {
  var myRequest = request;
  var ttclidParam = request.httpParameterMap.get('ttclid')
  if (!ttclidParam.isEmpty()) {
    return ttclidParam.getStringValue();
  }
  else {
    return null;
  }
}

/**
 * Set TikTok tracking setting into session, to only track the event requested
 */
function setTikTokTrackingSetting () {
  var customObjectHelper = require('int_tiktok/cartridge/scripts/customObjectHelper');
  var tikTokSettings = customObjectHelper.getCustomObject();
  if (tikTokSettings != null && tikTokSettings.custom.enableTracking) {
    session.custom.enableTracking = true;
    session.custom.ttclid = getTikTokClientID();
    session.custom.trackRT = (tikTokSettings.custom.viewContentEventTracking == 2 ) ? false : true;
    session.custom.enableAddToCartEvent = tikTokSettings.custom.enableAddToCartEvent;
    session.custom.enableInitiateCheckoutEvent = tikTokSettings.custom.enableInitiateCheckoutEvent;
    session.custom.enableProductShowEvent = tikTokSettings.custom.enableProductShowEvent;
    session.custom.enableCompletePaymentEvent = tikTokSettings.custom.enableCompletePaymentEvent;
    session.custom.enabledAdvanceMatching = tikTokSettings.custom.enableAdvancedMatchingEmail;
  }
  else {
    session.custom.enableTracking = false;
  }

}

/**
 * The onSession hook function
 *
 * @returns {dw/system/Status} status - return status
 */
 exports.onSession = function () {
  setTikTokTrackingSetting();
  return new Status(Status.OK);
};

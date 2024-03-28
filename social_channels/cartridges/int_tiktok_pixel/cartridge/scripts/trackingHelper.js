'use strict';
var Logger = require('dw/system/Logger');
var CustomObjectMgr = require ('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');

/**
 * @description add event for titktok to queve or send it real time
 * 
 * @param {res} res Response object
 * @returns {eventID} pixel event ID
 */


function firePixelEvent(eventID, viewData, realTime) {
  var reqUrl = request.getHttpURL().toString() ;
  var userAgent = request.httpUserAgent;
  var referrerUrl =  (request.getHttpReferer()) ? request.getHttpReferer() : "" ;
  var tikTokEvent_id = (!!session.custom.tiktokId) ? session.custom.tiktokId : getDwanonymousCookie();
  var ttclid = (!!session.custom.ttclid) ? session.custom.ttclid : "";
  var tikTokUserInfo = (!!session.custom.tiktokUserInfo) ? session.custom.tiktokUserInfo : getLoggedInUserInfo();

  try {
    var lineItemCtnr = null;
    var titokProperties = new Object();
    var contentsList = [] 
    var contentItem;
    var currencyCode;

    if (eventID == this.EVENTID.ViewContent) {
      contentItem = new Object();
      var product = viewData.product;
      contentItem.content_type = "product";
      contentItem.content_id = product.id;
      contentItem.quantity = 1;
      if (product.price.sales != null) {
        contentItem.price =product.price.sales.value;
        currencyCode = product.price.sales.currency;
      }
      else if (product.price.list != null) {
        contentItem.price =product.price.list.value;
        currencyCode = product.price.list.currency;
      }
      contentsList.push(contentItem);
    } 
    else if (eventID != this.EVENTID.CompletePayment) {
      var BasketMgr = require('dw/order/BasketMgr');
      lineItemCtnr = BasketMgr.getCurrentBasket();
    } 
    else {
      var orderID = viewData.orderID;
      if (orderID) {
        var OrderMgr = require('dw/order/OrderMgr');   
        lineItemCtnr = OrderMgr.getOrder(orderID);
        tikTokEvent_id = orderID;
        var orderEmail = lineItemCtnr.getCustomerEmail();
        if (orderEmail != null && session.custom.enabledAdvanceMatching) { 
          tikTokUserInfo = hashOrderEmail(orderEmail,tikTokUserInfo);
        }
      }
    }
    if (lineItemCtnr != null) {
      var plis = lineItemCtnr.getProductLineItems().iterator();
      while (plis.hasNext()) {
        var pli = plis.next();
        if (!pli.isBonusProductLineItem() ) {
          contentItem = new Object();
          contentItem.content_type = "product";
          contentItem.content_id = pli.productID;
          contentItem.quantity = pli.getQuantityValue();
          contentItem.price = pli.getAdjustedPrice().getValue();
          contentsList.push(contentItem);
        }
      }
      titokProperties.contents = contentsList;
      titokProperties.currency = lineItemCtnr.currencyCode;
      titokProperties.value = lineItemCtnr.getAdjustedMerchandizeTotalPrice().getValue();
    }
    else {
      titokProperties.contents = contentsList;
      titokProperties.currency = currencyCode;    
    }
    if (realTime) {
      var customObjectHelper = require('int_tiktok/cartridge/scripts/customObjectHelper');
      var tiktokService = require('int_tiktok/cartridge/scripts/services/tiktokService');
      var tikTokSettings = customObjectHelper.getCustomObject();
      var response = tiktokService.pixelTrack(tikTokSettings,eventID, tikTokEvent_id, reqUrl, referrerUrl, ttclid, titokProperties, userAgent,tikTokUserInfo);
    }
    else {
      queueEvent(tikTokEvent_id, eventID, referrerUrl,ttclid, reqUrl,userAgent, titokProperties,tikTokUserInfo);
    }
  } catch (err) {
    Logger.error("firePixelEvent = " + err);
  }
}
/*
* @Get dwanonymous_ cookie value for user event tracking
* 
*/

function getDwanonymousCookie() {
  var siteCookies= request.getHttpCookies();
  var identifier = null;
  if (siteCookies != null) {
    for (var i = 0 ; i< siteCookies.cookieCount; i++) 
    {
      if (siteCookies[i].getName().includes("dwanonymous_")) {
        identifier = siteCookies[i].getValue();
        session.custom.tiktokId = identifier;
        return identifier;
      }
    }
  }
  if (identifier == null) {
    return session.sessionID;
  }
}

function getLoggedInUserInfo() {
  if (session.customer.profile != null && session.custom.enabledAdvanceMatching) {
    var cusProfile = session.customer.profile
    //customer is authenticated
    var cusEmail = (!!cusProfile.email) ? cusProfile.email : cusProfile.credentials.login;
    var cusPhoneNum = null;
    if (cusProfile.phoneMobile != null && cusProfile.phoneMobile.length > 0) {
      cusPhoneNum = cusProfile.phoneMobile;
    }
    else if (cusProfile.phoneHome != null && cusProfile.phoneHome.length > 0) {
      cusPhoneNum = cusProfile.phoneHome;
    }
    else if (cusProfile.phoneBusiness != null && cusProfile.phoneBusiness > 0) {
      cusPhoneNum = cusProfile.phoneBusiness;
    }   
    
    var customObjectHelper = require('int_tiktok/cartridge/scripts/customObjectHelper');
    var tikTokSettings = customObjectHelper.getCustomObject();
  
    var Mac = require ("dw/crypto/Mac") ;
    var Encoding = require ("dw/crypto/Encoding");
    var encrypt = new Mac(Mac.HMAC_SHA_256);
    
    var hashCusEmail = "";
    var hashCusPhoneNum = "";
    var hashCusExternalID = "";
    if (cusEmail != null) {
      hashCusEmail = Encoding.toHex(encrypt.digest(cusEmail.toLowerCase(), tikTokSettings.custom.pixelCode));
    }
    if (cusPhoneNum != null) {
      hashCusPhoneNum = Encoding.toHex(encrypt.digest(cusPhoneNum.toLowerCase(), tikTokSettings.custom.pixelCode));
    }
    hashCusExternalID = Encoding.toHex(encrypt.digest(session.custom.tiktokId.toLowerCase(), tikTokSettings.custom.pixelCode));
    session.custom.tiktokUserInfo = hashCusEmail+"|"+hashCusPhoneNum+"|"+hashCusExternalID;
    return session.custom.tiktokUserInfo;
  }
  else {
    return null;
  }
}

/**
 * @description hash order email adress
 * 
 */
function hashOrderEmail (orderEmail, tikTokUserInfo) {
  var customObjectHelper = require('int_tiktok/cartridge/scripts/customObjectHelper');
  var tikTokSettings = customObjectHelper.getCustomObject();
  var Mac = require ("dw/crypto/Mac") ;
  var Encoding = require ("dw/crypto/Encoding");
  var encrypt = new Mac(Mac.HMAC_SHA_256);
  var cusEmail = orderEmail;
  var hashCusExternalID = "";
  var hashCusPhoneNum = "";

  if (tikTokUserInfo != null) {
    var userInfo = tikTokUserInfo.split("|");
    hashCusPhoneNum = userInfo[1];
    hashCusExternalID = userInfo[2];
  }
  else {
    hashCusExternalID = Encoding.toHex(encrypt.digest(session.custom.tiktokId.toLowerCase(), tikTokSettings.custom.pixelCode));
  }

  var hashCusEmail = Encoding.toHex(encrypt.digest(cusEmail.toLowerCase(), tikTokSettings.custom.pixelCode));
  session.custom.tiktokUserInfo = hashCusEmail+"|"+hashCusPhoneNum+"|"+hashCusExternalID;
  return session.custom.tiktokUserInfo;
}

/**
 * @description create the event queue in custom object
 * 
 */
function queueEvent (tikTokEvent_id, event, referrerUrl,ttclid, reqUrl,userAgent, titokProperties,tikTokUserInfo ) {
  var StringUtils = require('dw/util/StringUtils');
  var timestamp = StringUtils.formatCalendar(new dw.util.Calendar(),  "yyyy-MM-dd'T'HH:mm:ss'Z'");
  var cusExternalId = "";
  var cusPhoneNumber = "";
  var cusEmail = "";
  if (tikTokUserInfo != null) {
    var userInfo = tikTokUserInfo.split("|");
    cusEmail = userInfo[0];
    cusPhoneNumber = userInfo[1];
    cusExternalId = userInfo[2];
  }
  Transaction.wrap(function () {
      var eventTimeStamp = timestamp + "_" + tikTokEvent_id ;
      var obj = CustomObjectMgr.createCustomObject("TikTokWebEvents", eventTimeStamp);
      obj.custom.event = event;
      obj.custom.event_id = tikTokEvent_id;
      obj.custom.referrer = referrerUrl;
      obj.custom.ttclid = ttclid;
      obj.custom.url = reqUrl;
      obj.custom.external_id=cusExternalId;
      obj.custom.phone_number=cusPhoneNumber;
      obj.custom.email = cusEmail;
      obj.custom.user_agent =userAgent;
      obj.custom.properties=JSON.stringify(titokProperties);
  });
}

module.exports = {
  firePixelEvent: firePixelEvent,
  EVENTID: {
    ViewContent: "ViewContent",
    AddToCart: "AddToCart",
    CompletePayment: "CompletePayment",
    InitiateCheckout: "InitiateCheckout"
  }
};

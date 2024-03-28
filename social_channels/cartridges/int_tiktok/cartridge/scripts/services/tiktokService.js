'use strict';

//https://ads.tiktok.com/marketing_api/docs?id=1710953580908545
var Logger = require('dw/system/Logger').getLogger('TikTok', 'tiktokService');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');

var serviceHelper = require('./serviceHelper');
var constants = require('../TikTokConstants');

var CONTENT_TYPE = 'application/json';
var counter = 0;

/**
 * Get the authorization token from the TikTok REST API
 *
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @param {String} authCode The Auth code from the TikTok authentication flow
 * @returns {Object} an object containing the error if any happened
 */
function getAuthToken(tikTokSettings, authCode) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.BASE);
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.AUTH,
        headers: {
            'Content-Type': CONTENT_TYPE
        },
        body: {
            app_id : tikTokSettings.custom.appId,
            auth_code : authCode,
            secret : tikTokSettings.custom.appSecret
        }
    };
    var result = service.call(params);
    return parseResponse(result, 'oauth.call');
}

/**
 * Get the TikTok Business Profile
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @returns {Object} an object containing the error if any happened
 */
function getBusinessProfile(tikTokSettings) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.BASE);
    var params = {
        method: 'GET',
        path: constants.ENDPOINTS.GET_BUSINESS_PROFILE,
        headers: {
            'Content-Type': CONTENT_TYPE,
            'Access-Token': tikTokSettings.custom.accessToken
        },
        params: {
            external_business_id: tikTokSettings.custom.externalBusinessId,
            business_platform: constants.BUSINESS_PLATFORM
        }
    };
    var result = service.call(params);
    return parseResponse(result, 'get.business.profile.call');
}

/**
 * Create TikTok application on behalf of the customer
 *
 * @param {dw/object/CustomObject} externalBusinessId The TikTok external Business ID
 * @param {String} redirectUrl The redirect URL that will be tied to the application
 * @returns {Object} an object containing the error if any happened
 */
function createApplication(externalBusinessId, redirectUrl) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.BASE);
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.CREATE_APPLICATION,
        headers: {
            'Content-Type': CONTENT_TYPE,
            'Access-Token': constants.STATIC_APP_ACCESS_TOKEN,
            Referer       : service.getURL()
        },
        body: {
            business_platform: constants.BUSINESS_PLATFORM,
            smb_id: externalBusinessId,
            smb_name: externalBusinessId,
            redirect_url: redirectUrl
        }
    };
    var result = service.call(params);
    return parseResponse(result, 'create.application.call');
}

/**
 * Get the TikTok Pixel details
 *
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @returns {Object} an object containing the error if any happened
 */
function getPixelDetails(tikTokSettings) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.BASE);
    var params = {
        method: 'GET',
        path: constants.ENDPOINTS.GET_PIXEL_LIST,
        headers: {
            'Content-Type': CONTENT_TYPE,
            'Access-Token': tikTokSettings.custom.accessToken
        },
        params: {
            advertiser_id: tikTokSettings.custom.advertiserId,
            code: tikTokSettings.custom.pixelCode
        }
    };
    var result = service.call(params);
    return parseResponse(result, 'get.pixel.detail.call');
}

/**
 * Get the TikTok Catalog Overview
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @returns {Object} an object containing the error if any happened
 */
function getCatalogOverview(tikTokSettings) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.BUSINESS_API);
    var params = {
        method: 'GET',
        path: constants.ENDPOINTS.GET_CATALOG_OVERVIEW,
        headers: {
            'Content-Type': CONTENT_TYPE,
            'Access-Token': tikTokSettings.custom.accessToken
        },
        params: {
            bc_id: tikTokSettings.custom.bcId,
            catalog_id: tikTokSettings.custom.catalogId
        }
    };
    var result = service.call(params);
    return parseResponse(result, 'get.catalog.overview.call');
}

/**
 * Disconnect from TikTok
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @returns {Boolean} True if the disconnect process succeed, false othervise
 */
function disconnectFromTikTok(tikTokSettings) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.BASE);
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.DISCONNECT,
        headers: {
            'Content-Type': CONTENT_TYPE,
            'Access-Token': tikTokSettings.custom.accessToken
        },
        body: {
            external_business_id: tikTokSettings.custom.externalBusinessId,
            business_platform: constants.BUSINESS_PLATFORM,
            is_setup_page: 0,
            app_id: tikTokSettings.custom.appId
        }
    };
    var result = service.call(params);
    if (result.error) {
        Logger.error('Error occurred while disconnecting from TikTok: ' + result.error);
        return false;
    }
    return true;
}

/**
 * Upload the given products to TikTok
 *
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @param {String} catalogId The ID of the catalog to store in TikTok
 * @param {Array} products The array of formated products to send to TikTok
 *
 * @returns {Boolean} True if the upload process succeed, false othervise
 */
 function uploadProducts(tikTokSettings, catalogId, products) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.BASE);
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.UPLOAD_PRODUCTS,
        headers: {
            'Content-Type': CONTENT_TYPE,
            'Access-Token': tikTokSettings.custom.accessToken
        },
        body: {
            bc_id: tikTokSettings.custom.bcId,
            catalog_id: catalogId,
            dpa_products: products
        }
    };
    var result = service.call(params);
    Logger.info(counter + ': ' + products.length + ' dpa_products \n');
    var response = parseResponse(result, 'upload.products.call');
    //https://ads.tiktok.com/marketing_api/docs?id=1709207085043713
/*    if (!result.ok && result.error == '307') {
        var serviceRetry = serviceHelper.getService(constants.SERVICES.TIKTOK.BASE);   
        var responseRetry = serviceRetry.call(params);
        response = parseResponse(responseRetry, 'upload.products.call');
    } */
    return response;
}



/**
 * send server side event to TikTok
 *
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @param {String} tEvent TikTok tracking event
 * @param {String} tEventID Any string or hashed ID that can identify a unique event.
 * @param {String} reqUrl The complete URL of the request which was received at the server. 
 * @param {String} referrerUrl The referer URL
 * @param {String} ttclid The value of ttclid used to match website visitor events with TikTok ads
 * @param {Object} titokProperties The Basket/Order content
 *
 * @returns {Boolean} True if the upload process succeed, false othervise
 */
 function pixelTrack(tikTokSettings, tEvent, tEventID, reqUrl, referrerUrl, ttclid, titokProperties,userAgent, tikTokUserInfo) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.TRACKING);
    var userData;
    if (tikTokUserInfo != null) {
      var userInfo = tikTokUserInfo.split("|");
      userData = {
        external_id : userInfo[2],
        phone_number: userInfo[1],
        email: userInfo[0]
      };
    } 
    else {
        userData = {
            external_id : "",
            phone_number: "",
            email: ""
          };
    }  
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.PIXEL_TRACK,
        headers: {
            'Content-Type': CONTENT_TYPE,
            'Access-Token': tikTokSettings.custom.accessToken
        },
        body: {
            pixel_code: tikTokSettings.custom.pixelCode,
            event: tEvent,
            event_id: tEventID,
            context: {
                ad: {
                  callback: ttclid
                },
                page: {
                  url: reqUrl,
                  referrer: referrerUrl
                },
                user: userData,
                user_agent: userAgent  
              },   
              properties: titokProperties
        }
    };

    var result = service.call(params);
    //Logger.info(counter + ': ' + products.length + ' dpa_products \n');
    if (result.error) {
        Logger.error('Error occurred while disconnecting from TikTok: ' + result.error);
        return false;
    }
    return true;    
}



/**
 * send server side batch event to TikTok
 *
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @param {Object} titokProperties The Basket/Order content
 *
 * @returns {Boolean} True if the upload process succeed, false othervise
 */
 function batchPixelTrack(tikTokSettings, batchData) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.TRACKING);
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.PIXEL_TRACK_BATCH,
        headers: {
            'Content-Type': CONTENT_TYPE,
            'Access-Token': tikTokSettings.custom.accessToken
        },
        body: {
            pixel_code: tikTokSettings.custom.pixelCode,
            batch: batchData
        }
    };

    var result = service.call(params);
    Logger.info('params ==> ' + params);
    if (result.ok != true && result.errorMessage != null) {
        Logger.error('Error occurred calling TikTok batch API : ' + result);
        return false;
    }
    return true;    
}

/**
 * Delete the given products from TikTok
 *
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @param {String} catalogId The ID of the catalog to store in TikTok
 * @param {Array} products The array of formated products to send to TikTok
 *
 * @returns {Boolean} True if the upload process succeed, false othervise
 */
function deleteProducts(tikTokSettings, catalogId, products) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.BASE);
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.REMOVE_PRODUCTS,
        headers: {
            'Content-Type': CONTENT_TYPE,
            'Access-Token': tikTokSettings.custom.accessToken
        },
        body: {
            bc_id: tikTokSettings.custom.bcId,
            catalog_id: catalogId,
            sku_ids: products
        }
    };

    var result = service.call(params);
    var response = parseResponse(result, 'delete.products.call');
    return response;
}

/**
 * Parses the response and trigger the given {callback} in case of success or redirect ot the landing page in case of error
 *
 * @param {String} errorCode The error code from the response
 * @param {Object} result The result of the response
 * @returns {Boolean}
 */
function parseResponse(result, errorCode) {
    if (!result.ok && result.error=='307') {
        return {
            error: false,
            result: '307 redirection'
        };
    }
    else if (!result.ok) {
        Logger.error('Error occurred while {0}. Error Message: {1}', errorCode.replace('.', ' ', 'g'), result.errorMessage);
        return {
            error: true,
            errorCode: errorCode
        };
    }

    var resultText = JSON.parse(result.object.text);
    Logger.info(counter++ + ': result: ' + result.object.text + '\n');
    if (resultText.code == 0) {
        return {
            error: false,
            result: resultText
        };
    } else {
        Logger.error('Error occurred while {0}. Error Message: {1}', errorCode.replace('.', ' ', 'g'), resultText.message);
        return {
            error: true,
            errorCode: errorCode
        };
    }
}

module.exports = {
    getAuthToken: getAuthToken,
    getBusinessProfile: getBusinessProfile,
    getPixelDetails: getPixelDetails,
    getCatalogOverview: getCatalogOverview,
    disconnectFromTikTok: disconnectFromTikTok,
    createApplication: createApplication,
    deleteProducts: deleteProducts,
    uploadProducts: uploadProducts,
    pixelTrack: pixelTrack,
    batchPixelTrack: batchPixelTrack
};

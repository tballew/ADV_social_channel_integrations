'use strict';

var Logger = require('dw/system/Logger').getLogger('TikTok', 'einsteinService');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');

var serviceHelper = require('./serviceHelper');
var constants = require('../TikTokConstants');

/**
 * Get the Account Manager access token based on the given {tikTokSettings} object
 *
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @returns {Object} The parsed response containing the access token
 */
function getAMAccessToken(tikTokSettings) {
    var accountManagerService = serviceHelper.getService(constants.SERVICES.ACCOUNT_MANAGER);
    var params = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization' :'Basic ' + StringUtils.encodeBase64(tikTokSettings.custom.shopperClientId + ':' + tikTokSettings.custom.shopperClientSecret)
        },
        params: {
            grant_type: 'client_credentials'
        }
    };
    var result = accountManagerService.call(params);
    if (result.error) {
        Logger.error('Error occurred while getting AM access token: ' + result.error, 'Einstein-SendPixelId');
        return undefined;
    }
    return JSON.parse(result.object.text);
}

/**
 * Sends the Pixel ID to Einstein based on the given {tikTokSettings} object
 *
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @returns {Object} An object containing the error code if anything failed
 */
function sendPixelIdToEinstein(tikTokSettings) {
    // get account manager access token
    var amResponse = getAMAccessToken(tikTokSettings);
    if (!amResponse) {
        return {
            error: true,
            errorCode: 'account.manager'
        };
    }

    var integration = {
        thirdParty: constants.EINSTEIN_THIRD_PARTY_ID,
        pixelId: tikTokSettings.custom.pixelCode,
        accessToken: tikTokSettings.custom.accessToken,
        metadata: {
            advanced_metrics: tikTokSettings.custom.enableAdvancedMatchingEmail
        }
    }
    var payload = {
        integrations: [integration]
    }
    var einsteinService = serviceHelper.getService(constants.SERVICES.EINSTEIN);
    // einsteinSiteId is a combination for realm and siteid. In case a realm is changed/updated, we need to send the pixel Id again to Einstein
    einsteinService.setURL(einsteinService.getURL() + '/' + Site.getCurrent().getEinsteinSiteID() + '/integrations');

    var params = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-cq-client-id': tikTokSettings.custom.shopperClientId,
            'Authorization': amResponse.token_type + ' ' +  amResponse.access_token
        },
        body: payload
    };

    var result = einsteinService.call(params);
    if (result.error) {
        if(result.error === 403) {
            Logger.error('Error occurred while connecting to Einstein: AM Token is not valid : ' + result.error, 'Einstein-SendPixelId');
        } else if (result.error === 400) {
            Logger.error('Error occurred while connecting to Einstein: Request validation failed : ' + result.error, 'Einstein-SendPixelId');
        } else {
            Logger.error('Some error occurred while connecting to Einstein: ' + result.error, 'Einstein-SendPixelId');
        }
        return {
            error: true,
            errorCode: 'einstein'
        };
    }

    return {
        error: false
    };
}

/**
 * Deletes the Pixel ID from Einstein based on the given {tikTokSettings} object
 *
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @returns {Boolean} True if the API call succeed, false otherwise
 */
function deletePixelIdFromEinstein(tikTokSettings) {
    // get account manager access token
    var amResponse = getAMAccessToken(tikTokSettings);
    if (!amResponse) {
        return {
            error: true,
            errorCode: 'account.manager'
        };
    }

    var einsteinService = serviceHelper.getService(constants.SERVICES.EINSTEIN);
    einsteinService.setURL(einsteinService.getURL() + '/' + Site.getCurrent().getEinsteinSiteID() + '/integrations/' + constants.EINSTEIN_THIRD_PARTY_ID + '/' + tikTokSettings.custom.pixelCode);
    var params = {
        method: 'DELETE',
        headers: {
            'x-cq-client-id': tikTokSettings.custom.shopperClientId,
            'Authorization': amResponse.token_type + ' ' +  amResponse.access_token
        }
    };
    var result = einsteinService.call(params);
    if (result.error) {
        if (result.error === 403) {
            Logger.error('Error occurred while deleting PixeldId from Einstein: Token is not valid : ' + result.error, 'BM_TikTok-Diconnect');
        } else if (result.error === 404) {
            Logger.error('Error occurred while connecting to Einstein: Integration does not exists : ' + result.error, 'BM_TikTok-Diconnect');
        } else {
            Logger.error('Some error occurred while connecting to Einstein: ' + result.error, 'BM_TikTok-Diconnect');
        }

        return {
            error: true,
            errorCode: 'disconnect.einstein'
        };
    }

    return {
        error: false
    };
}

module.exports = {
    sendPixelIdToEinstein: sendPixelIdToEinstein,
    deletePixelIdFromEinstein: deletePixelIdFromEinstein
};

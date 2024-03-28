'use strict';

var Logger = require('dw/system/Logger').getLogger('Snapchat', 'einsteinService');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');

var serviceHelper = require('./serviceHelper');
var constants = require('../SnapchatConstants');

/**
 * Get the Account Manager access token based on the given {snapChatSettings} object
 *
 * @param {dw/object/CustomObject} snapChatSettings The Snapchat settings custom object instance
 * @returns {Object} The parsed response containing the access token
 */
function getAMAccessToken(snapChatSettings) {
    var accountManagerService = serviceHelper.getService(constants.SERVICES.ACCOUNT_MANAGER);
    var params = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization' :'Basic ' + StringUtils.encodeBase64(accountManagerService.configuration.credential.user + ':' + accountManagerService.configuration.credential.password)
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
 * Sends the Pixel ID to Einstein based on the given {snapChatSettings} object
 *
 * @param {dw/object/CustomObject} snapChatSettings The Snapchat settings custom object instance
 * @returns {Object} An object containing the error code if anything failed
 */
function sendPixelIdToEinstein(snapChatSettings) {
    // get account manager access token
    var amResponse = getAMAccessToken(snapChatSettings);
    if (!amResponse) {
        return {
            error: true,
            errorCode: 'account.manager'
        };
    }

    var integration = {
        thirdParty: constants.EINSTEIN_THIRD_PARTY_ID,
        pixelId: snapChatSettings.custom.pixelCode,
        accessToken: request.session.privacy.accessToken,
        metadata: {
            advanced_metrics: snapChatSettings.custom.enableAdvancedMatchingEmail
        }
    }
    var payload = {
        integrations: [integration]
    }
    var einsteinService = serviceHelper.getService(constants.SERVICES.EINSTEIN_STAGING);
    // einsteinSiteId is a combination for realm and siteid. In case a realm is changed/updated, we need to send the pixel Id again to Einstein
    einsteinService.setURL(einsteinService.getURL() + '/v3/deployment/' + Site.getCurrent().getEinsteinSiteID() + '/integrations');

    var params = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-cq-client-id': serviceHelper.getService(constants.SERVICES.ACCOUNT_MANAGER).configuration.credential.user,
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
 * Deletes the Pixel ID from Einstein based on the given {snapChatSettings} object
 *
 * @param {dw/object/CustomObject} snapChatSettings The Snapchat settings custom object instance
 * @returns {Boolean} True if the API call succeed, false otherwise
 */
function deletePixelIdFromEinstein(snapChatSettings) {
    // get account manager access token
    var amResponse = getAMAccessToken(snapChatSettings);
    if (!amResponse) {
        return {
            error: true,
            errorCode: 'account.manager'
        };
    }

    var einsteinService = serviceHelper.getService(constants.SERVICES.EINSTEIN_STAGING);
    einsteinService.setURL(einsteinService.getURL() + '/' + Site.getCurrent().getEinsteinSiteID() + '/integrations/' + constants.EINSTEIN_THIRD_PARTY_ID + '/' + snapChatSettings.custom.pixelCode);
    var params = {
        method: 'DELETE',
        headers: {
            'x-cq-client-id': snapChatSettings.custom.shopperClientId,
            'Authorization': amResponse.token_type + ' ' +  amResponse.access_token
        }
    };
    var result = einsteinService.call(params);
    if (result.error) {
        if (result.error === 403) {
            Logger.error('Error occurred while deleting PixeldId from Einstein: Token is not valid : ' + result.error, 'BM_Snapchat-Diconnect');
        } else if (result.error === 404) {
            Logger.error('Error occurred while connecting to Einstein: Integration does not exists : ' + result.error, 'BM_Snapchat-Diconnect');
        } else {
            Logger.error('Some error occurred while connecting to Einstein: ' + result.error, 'BM_Snapchat-Diconnect');
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

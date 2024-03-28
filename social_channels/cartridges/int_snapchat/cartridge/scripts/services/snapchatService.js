'use strict';

var Logger = require('dw/system/Logger').getLogger('Snapchat', 'snapchatService');
var Transaction = require('dw/system/Transaction');

var serviceHelper = require('./serviceHelper');
var constants = require('../SnapchatConstants');
var counter = 0;

/**
 * Get the authorization token from the Snapchat REST API
 *
 * @param {ServiceCredential} ServiceCredential The Snapchat ServiceCredential
 * @param {String} authCode The Auth code from the Snapchat authentication flow
 * @returns {Object} an object containing the error if any happened
 */
 function getRefreshToken(serviceCredential) {
    var service = serviceHelper.getService(constants.SERVICES.SNAPCHAT_TOKEN);
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.REFRESH,
        params: {
            client_id: serviceCredential.user,
            client_secret: serviceCredential.password,
            refresh_token: request.session.privacy.refreshToken,
            grant_type: 'refresh_token'
        }
    };
    var result = service.call(params);
    return parseResponse(result, 'oauth.refresh_token.call');
}

/**
 * Get the authorization token from the Snapchat REST API
 *
 * @param {ServiceCredential} ServiceCredential The Snapchat ServiceCredential
 * @param {String} authCode The Auth code from the Snapchat authentication flow
 * @returns {Object} an object containing the error if any happened
 */
function getAuthToken(serviceCredential, authCode) {
    if ('accessToken' in request.session.privacy && !empty(request.session.privacy.accessToken))
        return parseResponse(request.session.privacy.accessToken, 'oauth.access_token.call');
    else {
        var service = serviceHelper.getService(constants.SERVICES.SNAPCHAT_TOKEN);
        var params = {
            method: 'POST',
            path: constants.ENDPOINTS.AUTH,
            params: {
                client_id: serviceCredential.user,
                client_secret: serviceCredential.password,
                code: authCode,
                grant_type: 'authorization_code',
                redirect_uri: dw.web.URLUtils.https('BM_Snapchat-Callback').toString()
            }
        };
        var result = service.call(params);
        return parseResponse(result, 'oauth.access_token.call');
    }
}

/**
 * Get the Snapchat Business Profile
 * @param {dw/object/CustomObject} snapchatSettings The Snapchat settings custom object instance
 * @returns {Object} an object containing the error if any happened
 */
function getBusinessProfile(snapchatSettings) {
    var service = serviceHelper.getService(constants.SERVICES.SNAPCHAT_ADS);
    var params = {
        method: 'GET',
        path: constants.ENDPOINTS.GET_BUSINESS_PROFILE,
        headers: {
            'Content-Type': constants.CONTENT_TYPE_JSON,
            'Authorization': 'Bearer ' + request.session.privacy.accessToken
        }
    };

    var result = service.call(params);
    var response = parseResponse(result, 'get.business.profile.call');
    if (response.error && response.errorCode == 'retry') {
        var serviceRetry = serviceHelper.getService(constants.SERVICES.SNAPCHAT_ADS);
        var paramsRetry = {
            method: 'GET',
            path: constants.ENDPOINTS.GET_BUSINESS_PROFILE,
            headers: {
                'Content-Type': constants.CONTENT_TYPE_JSON,
                'Authorization': 'Bearer ' + request.session.privacy.accessToken
            }
        };
        var responseRetry = serviceRetry.call(paramsRetry);
        response = parseResponse(responseRetry, 'get.business.profile.call');
    }
    if (!response.error && 'me' in response.result && !empty(response.result.me)) {
        if (response.result.me.organization_id && response.result.me.organization_id !== snapchatSettings.custom.externalBusinessId) {
            Transaction.wrap(function () {
                snapchatSettings.custom.externalBusinessId = response.result.me.organization_id;
            });
        }
    }
    return response;
}

/**
 * Get the info for organization
 * @param {dw/object/CustomObject} snapchatSettings The Snapchat settings custom object instance
 * @returns {Object} an object containing the error if any happened
 */
 function getOrgInfo(snapchatSettings) {
    var service = serviceHelper.getService(constants.SERVICES.SNAPCHAT_ADS);
    var params = {
        method: 'GET',
        path: constants.ENDPOINTS.GET_ORG_DETAILS + snapchatSettings.custom.externalBusinessId,
        params: {
            organization_id: snapchatSettings.custom.externalBusinessId
        },
        headers: {
            'Content-Type': constants.CONTENT_TYPE_JSON,
            'Authorization': 'Bearer ' + request.session.privacy.accessToken
        }
    };

    var result = service.call(params);
    var response = parseResponse(result, 'get.org.info.call');
    if (response.error && response.errorCode == 'retry') {
        var serviceRetry = serviceHelper.getService(constants.SERVICES.SNAPCHAT_ADS);
        var paramsRetry = {
            method: 'GET',
            path: constants.ENDPOINTS.GET_ORG_DETAILS + snapchatSettings.custom.externalBusinessId,
            params: {
                organization_id: snapchatSettings.custom.externalBusinessId
            },
            headers: {
                'Content-Type': constants.CONTENT_TYPE_JSON,
                'Authorization': 'Bearer ' + request.session.privacy.accessToken
            }
        };
        var responseRetry = serviceRetry.call(paramsRetry);
        response = parseResponse(responseRetry, 'get.add.accounts.call');
    }
    if (!response.error) {
        var text = 'text' in result.object && !empty(result.object.text) ? result.object.text : responseRetry.object.text;
        var parsedText = JSON.parse(text);
        if ('organizations' in parsedText && !empty(parsedText.organizations[0]) && parsedText.organizations[0].organization.name !== snapchatSettings.custom.bcId) {
            Transaction.wrap(function () {
                snapchatSettings.custom.bcId = parsedText.organizations[0].organization.name;
            });
        }
    }
    return response;
}

/**
 * Get the Ad Accounts for organization
 * @param {dw/object/CustomObject} snapchatSettings The Snapchat settings custom object instance
 * @returns {Object} an object containing the error if any happened
 */
 function getAdAccounts(snapchatSettings) {
    var service = serviceHelper.getService(constants.SERVICES.SNAPCHAT_ADS);
    var params = {
        method: 'GET',
        path: constants.ENDPOINTS.GET_ADD_ACCOUNTS + snapchatSettings.custom.externalBusinessId + '/adaccounts',
        params: {
            organization_id: snapchatSettings.custom.externalBusinessId
        },
        headers: {
            'Content-Type': constants.CONTENT_TYPE_JSON,
            'Authorization': 'Bearer ' + request.session.privacy.accessToken
        }
    };

    var result = service.call(params);
    var response = parseResponse(result, 'get.add.accounts.call');
    if (response.error && response.errorCode == 'retry') {
        var serviceRetry = serviceHelper.getService(constants.SERVICES.SNAPCHAT_ADS);
        var paramsRetry = {
            method: 'GET',
            path: constants.ENDPOINTS.GET_ADD_ACCOUNTS + snapchatSettings.custom.externalBusinessId + '/adaccounts',
            params: {
                organization_id: snapchatSettings.custom.externalBusinessId
            },
            headers: {
                'Content-Type': constants.CONTENT_TYPE_JSON,
                'Authorization': 'Bearer ' + request.session.privacy.accessToken
            }
        };
        var responseRetry = serviceRetry.call(paramsRetry);
        response = parseResponse(responseRetry, 'get.add.accounts.call');
    }
    if (!response.error) {
        var text = 'text' in result.object && !empty(result.object.text) ? result.object.text : responseRetry.object.text;
        var parsedText = JSON.parse(text);
        if ('adaccounts' in parsedText) {
            var adactiveaccounts = parsedText.adaccounts.filter(function (item) {
                return item.adaccount.status == 'ACTIVE'
            });
            if (!empty(adactiveaccounts[0]) && adactiveaccounts[0].adaccount.id !== snapchatSettings.custom.advertiserId) {
                Transaction.wrap(function () {
                    snapchatSettings.custom.advertiserId = adactiveaccounts[0].adaccount.id;
                    snapchatSettings.custom.advertiserAccount = adactiveaccounts[0].adaccount.name;
                });
            }
        }
    }
    return response;
}

/**
 * Get the PixelId for the Ad Account
 * @param {dw/object/CustomObject} snapchatSettings The Snapchat settings custom object instance
 * @returns {Object} an object containing the error if any happened
 */
 function getPixelFromAdAccount(snapchatSettings) {
    var service = serviceHelper.getService(constants.SERVICES.SNAPCHAT_ADS);
    var params = {
        method: 'GET',
        path: constants.ENDPOINTS.GET_PIXEL_FROM_ADD_ACCOUNT + snapchatSettings.custom.advertiserId + '/pixels',
        params: {
            ad_account_id: snapchatSettings.custom.advertiserId
        },
        headers: {
            'Content-Type': constants.CONTENT_TYPE_JSON,
            'Authorization': 'Bearer ' + request.session.privacy.accessToken
        }
    };

    var result = service.call(params);
    var response = parseResponse(result, 'get.pixel.adaccount.call');
    if (response.error && response.errorCode == 'retry') {
        var serviceRetry = serviceHelper.getService(constants.SERVICES.SNAPCHAT_ADS);
        var paramsRetry = {
            method: 'GET',
            path: constants.ENDPOINTS.GET_PIXEL_FROM_ADD_ACCOUNT + snapchatSettings.custom.advertiserId + '/pixels',
            params: {
                ad_account_id: snapchatSettings.custom.advertiserId
            },
            headers: {
                'Content-Type': constants.CONTENT_TYPE_JSON,
                'Authorization': 'Bearer ' + request.session.privacy.accessToken
            }
        };
        var responseRetry = serviceRetry.call(paramsRetry);
        response = parseResponse(responseRetry, 'get.pixel.adaccount.call');
    }
    if (!response.error) {
        if ('pixels' in response.result && !empty(response.result.pixels) && response.result.pixels[0].pixel.id !== snapchatSettings.custom.pixelCode) {
            Transaction.wrap(function () {
                snapchatSettings.custom.pixelCode = response.result.pixels[0].pixel.id;
            });
        }
    }
    return response;
}

/**
 * Disconnect from Snapchat
 * @param {dw/object/CustomObject} snapchatSettings The Snapchat settings custom object instance
 * @returns {Boolean} True if the disconnect process succeed, false othervise
 */
function disconnectFromSnapchat(serviceCredential) {
    var StringUtils = require('dw/util/StringUtils');
    var credentials = getConnectedAppCreds();
    var service = serviceHelper.getService(constants.SERVICES.SNAPCHAT_TOKEN); //client_id=CLIENT_ID&token=REFRESH_TOKEN
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.DISCONNECT + '?client_id='+ credentials.user + '&token=' + request.session.privacy.refreshToken,
        headers: {
            'Content-Type': constants.CONTENT_TYPE_URLENCODED,
            'Authorization': 'Basic ' + StringUtils.encodeBase64(credentials.user+':'+credentials.password)
        }
    };
    var result = service.call(params);
    if (result.error) {
        Logger.error('Error occurred while disconnecting from Snapchat: ' + result.error);
        return false;
    }
    return true;
}

/**
 * Get Connected App Credentials
 * @returns {ServiceCredential} Service Credentials
 */
 function getConnectedAppCreds() {
    var service = serviceHelper.getService(constants.SERVICES.SNAPCHAT_OAUTH);
    return service.configuration.credential;
}

/**
 * Parses the response and trigger the given {callback} in case of success or redirect ot the landing page in case of error
 *
 * @param {ServiceCredential} serviceCredential The Snapchat ServiceCredential
 * @param {Object} result The result of the response
 * @param {String} errorCode The error code from the response
 * @returns {Boolean}
 */
function parseResponse(result, errorCode) {
    var credentials = getConnectedAppCreds();
    var snapchatSettings = require('int_snapchat/cartridge/scripts/customObjectHelper').getCustomObject();
    if (!result.ok && result.error == '401') {
        var snapchatService = require('int_snapchat/cartridge/scripts/services/snapchatService');
        var refreshTokenResponse = getRefreshToken(credentials);
        return {
            error: true,
            errorCode: 'retry'
        };
    } else if (!result.ok &&
        (
        !('accessToken' in request.session.privacy) || 'accessToken' in request.session.privacy && empty(request.session.privacy.accessToken)
        ||
        !('refreshToken' in request.session.privacy) || 'refreshToken' in request.session.privacy && empty(request.session.privacy.refreshToken)
        )) {
            Logger.warn('request.session.privacy.accessToken = {0} request.session.privacy.refreshToken = {1}', errorCode, result.errorMessage);
            var form = session.forms.snapchat;
            form.clearFormElement();

            form.appid.value = !empty(credentials.user) ? credentials.user : '';
            form.appsecret.value = !empty(credentials.password) ? credentials.password : '';

            // Render the landing page so that the customer can authenticate through Snapchat
            ISML.renderTemplate('snapchat/start', {
                acceptTerms: snapchatSettings.custom.acceptTerms,
                success: request.httpParameterMap.success.stringValue
            });
            return;
    } else if (!result.ok && result.error !== '401') {
        Logger.error('Error occurred while {0}. Error Message: {1}', errorCode, result.errorMessage);
        return {
            error: true,
            errorCode: errorCode
        };
    }
    var resultText = JSON.parse(result.object.text);
    Logger.info(counter++ + ': result: ' + result.object.text + '\n');
    if (result.ok && !empty(resultText) ) {
        if (resultText.access_token && resultText.refresh_token &&
            (resultText.access_token !== request.session.privacy.accessToken || resultText.refresh_token !== request.session.privacy.refreshToken) ) {
            request.session.privacy.accessToken = resultText.access_token;
            request.session.privacy.refreshToken = resultText.refresh_token;
        }
        return {
            error: false,
            result: resultText
        };
    } else {
        Logger.error('Error occurred while {0}. Error Message: {1}', errorCode, 'error');
        return {
            error: true,
            errorCode: errorCode
        };
    }
}

module.exports = {
    getAuthToken: getAuthToken,
    getBusinessProfile: getBusinessProfile,
    getAdAccounts: getAdAccounts,
    getPixelFromAdAccount: getPixelFromAdAccount,
    getOrgInfo: getOrgInfo,
    getConnectedAppCreds: getConnectedAppCreds,
    disconnectFromSnapchat: disconnectFromSnapchat
};

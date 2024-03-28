'use strict';
/**
 * All the nodes for Snapchat BM extension
 * @module controllers/BM_Snapchat
 */
var ISML = require('dw/template/ISML');
var Logger = require('dw/system/Logger').getLogger('Snapchat', 'BM_Snapchat');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var customObjectHelper = require('int_snapchat/cartridge/scripts/customObjectHelper');
var snapchatService = require('int_snapchat/cartridge/scripts/services/snapchatService');
var credentials = snapchatService.getConnectedAppCreds();
var einsteinService = require('int_snapchat/cartridge/scripts/services/einsteinService');

/**
 * Landing page for Snapchat
 */
function start() {
    var snapchatSettings = customObjectHelper.getCustomObject();

    // If the OAuthApp already configured we can send BM user to manage Snapchat account area
    if (!empty(snapchatSettings) && 'user' in credentials && !empty(credentials.user) && 'password' in credentials && !empty(credentials.password)
            && 'accessToken' in request.session.privacy && !empty(request.session.privacy.accessToken)
            && 'refreshToken' in request.session.privacy && !empty(request.session.privacy.refreshToken)
            && snapchatSettings.custom.acceptTerms) {

        initCall(snapchatSettings);
        return;
    }

    var oauthflow = request.httpParameterMap.oauth.booleanValue;
    if (!oauthflow) {
        // Clear form
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
    }

    launch();
}

/**
 * Accept terms for Snapchat and save the flag in custom object
 */
function acceptTerms() {
    var snapchatSettings = customObjectHelper.getCustomObject();
    Transaction.wrap(function () {
        snapchatSettings.custom.acceptTerms = true;
    });

    response.redirect(require('dw/web/URLUtils').https('BM_Snapchat-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue));
}

/**
 * Launch Snapchat and start Snapchat OAuth flow
 */
 function launch() {
    var siteID = Site.getCurrent().ID;
    var client_id = session.forms.snapchat.appid.value;
    var CSRFProtection = require('dw/web/CSRFProtection');
    var csrfToken = CSRFProtection.generateToken();
    var state = csrfToken.replace(/=/g, '');
    var redirect_uri = URLUtils.https('BM_Snapchat-Callback').toString();
    request.session.privacy.siteID = siteID;
    request.session.privacy.state = state;
    response.redirect('https://accounts.snapchat.com/login/oauth2/authorize?client_id='
        +client_id+'&redirect_uri='+redirect_uri+'&response_type=code&scope=snapchat-marketing-api&state='+state);
}

/**
 * Callback URL for Snapchat.
 */
function callback() {
    var snapchatSettings = customObjectHelper.getCustomObject();
    var authCode = request.httpParameterMap.code.value;
    var state = request.httpParameterMap.state.value;
    var errorMessage = request.httpParameterMap.error.value;
    var escapedState = (state ? state.replace(/=/g, '') : null);

    if (errorMessage || !authCode || !state || escapedState !== request.session.privacy.state || Site.getCurrent().ID !== request.session.privacy.siteID) {
        request.session.privacy.state = '';
        customObjectHelper.clearValues(snapchatSettings);
        ISML.renderTemplate('start', {
            error: accessTokenResponse.errorCode,
            acceptTerms: snapchatSettings.custom.acceptTerms
        });
        return;
    }
    // Authenticating against the Snapchat API
    var accessTokenResponse = snapchatService.getAuthToken(credentials, authCode);
    if (accessTokenResponse.error) {
        ISML.renderTemplate('snapchat/start', {
            error: accessTokenResponse.errorCode,
            acceptTerms: snapchatSettings.custom.acceptTerms
        });
        return;
    }

    initCall(snapchatSettings);

}

function initCall(snapchatSettings) {
    var errorcode = '';
    //var bpResponse = !empty(snapchatSettings.custom.externalBusinessId) ? '' : snapchatService.getOrgInfo(snapchatSettings);
    var bpResponse = snapchatService.getBusinessProfile(snapchatSettings);
    if (!empty(bpResponse) && bpResponse.error) {
        errorcode = bpResponse.errorCode;
    }
    //var orgInfoResponse = snapchatService.getOrgInfo(snapchatSettings);
    var orgInfoResponse = !empty(snapchatSettings.custom.bcId) ? '' : snapchatService.getOrgInfo(snapchatSettings);
    if (!empty(orgInfoResponse) && orgInfoResponse.error) {
        errorcode = errorcode + ' ' + orgInfoResponse.errorCode;
    }
    //var adAccResponse = snapchatService.getAdAccounts(snapchatSettings);
    var adAccResponse = !empty(snapchatSettings.custom.advertiserId) ? '' : snapchatService.getAdAccounts(snapchatSettings);
    if (!empty(adAccResponse) && adAccResponse.error) {
        errorcode = errorcode + ' ' + adAccResponse.errorCode;
    }
    //var pixelResponse = snapchatService.getPixelFromAdAccount(snapchatSettings);
    var pixelResponse = !empty(snapchatSettings.custom.pixelCode) ? '' : snapchatService.getPixelFromAdAccount(snapchatSettings);
    if (!empty(pixelResponse) && pixelResponse.error) {
        errorcode = errorcode + ' ' + pixelResponse.errorCode;
    }

    if (empty(errorcode)) {
        ISML.renderTemplate('snapchat/setup', {
            snapchatSettings: snapchatSettings,
            orgId: snapchatSettings.custom.bcId,
            advertiserId: snapchatSettings.custom.advertiserId,
            advertiserAccount: snapchatSettings.custom.advertiserAccount,
            pixelCode: snapchatSettings.custom.pixelCode,
            me: bpResponse.result.me,
            error: request.httpParameterMap.error.stringValue
        });
        return;
    } else {
        ISML.renderTemplate('snapchat/start', {
            error: !empty(errorcode) ? errorcode : 'init.call',
            acceptTerms: snapchatSettings.custom.acceptTerms
        });
        return;
    }
}

/**
 * Manage Snapchat Business Account page
 */
 function manage() {
    var snapchatSettings = customObjectHelper.getCustomObject();
    response.redirect('https://business.snapchat.com/'+snapchatSettings.custom.externalBusinessId+'/settings/business-details');

}

/**
 * Disconnect from Snapchat + delete Pixel from Einstein + Remove custom object holding settings
 */
function disconnect() {
    var snapchatSettings = customObjectHelper.getCustomObject();
//    if (empty(snapchatSettings.custom.pixelIdSentToEinstein) || (snapchatSettings.custom.pixelIdSentToEinstein === true && einsteinService.deletePixelIdFromEinstein(snapchatSettings).error === false)) {
        if (snapchatService.disconnectFromSnapchat(snapchatSettings)) {
            if ('accessToken' in request.session.privacy && !empty(request.session.privacy.accessToken)) request.session.privacy.accessToken = '';
            if ('refreshToken' in request.session.privacy && !empty(request.session.privacy.refreshToken)) request.session.privacy.refreshToken = '';
            customObjectHelper.removeCustomObject(snapchatSettings);
            response.redirect(require('dw/web/URLUtils').https('BM_Snapchat-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue));
            return;
        } else {
            ISML.renderTemplate('snapchat/setup', {
                error: 'disconnect',
                snapchatSettings: snapchatSettings
            });
            return;
        }
//    }
    ISML.renderTemplate('snapchat/setup', {
        error: 'disconnect',
        snapchatSettings: snapchatSettings
    });
}

/**
 * Endpoint to submit pixelId to Einstein
 */
 function enableShopperActivities() {
    var snapchatSettings = customObjectHelper.getCustomObject();
//    var snapchatSettings = require('int_snapchat/cartridge/scripts/customObjectHelper').getCustomObject();

    // Don't submit multiple times
    if (snapchatSettings.custom.pixelIdSentToEinstein === true) {
        response.redirect(require('dw/web/URLUtils').https('BM_Snapchat-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue));
        return;
    }

    var enableEinsteinResponse = require('int_snapchat/cartridge/scripts/services/einsteinService').sendPixelIdToEinstein(snapchatSettings);
    if (enableEinsteinResponse.error) {
        response.redirect(require('dw/web/URLUtils').https('BM_Snapchat-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue, 'error', enableEinsteinResponse.errorCode));
        return;
    } else {
        require('dw/system/Transaction').wrap(function () {
        snapchatSettings.custom.pixelIdSentToEinstein = true;
        });
    }

    response.redirect(require('dw/web/URLUtils').https('BM_Snapchat-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue, 'success', 'einstein.success'));
}

/**
 * Endpoint to disable pixelId from Einstein
 */
 function disableShopperActivities() {
    var snapchatSettings = customObjectHelper.getCustomObject();
//    var snapchatSettings = require('int_snapchat/cartridge/scripts/customObjectHelper').getCustomObject();

    // Don't submit multiple times
    if (snapchatSettings.custom.pixelIdSentToEinstein === false) {
        response.redirect(require('dw/web/URLUtils').https('BM_Snapchat-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue));
        return;
    }

    var disableEinsteinResponse = require('int_snapchat/cartridge/scripts/services/einsteinService').deletePixelIdFromEinstein(snapchatSettings);
    if (disableEinsteinResponse.error) {
        response.redirect(require('dw/web/URLUtils').https('BM_Snapchat-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue, 'error', disableEinsteinResponse.errorCode));
        return;
    }

    require('dw/system/Transaction').wrap(function () {
        snapchatSettings.custom.pixelIdSentToEinstein = false;
    });

    response.redirect(require('dw/web/URLUtils').https('BM_Snapchat-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue, 'success', 'einstein.success'));
}


/**
 * Endpoints
 */
module.exports.Start = start;
module.exports.Start.public = true;
module.exports.AcceptTerms = acceptTerms;
module.exports.AcceptTerms.public = true;
module.exports.Callback = callback;
module.exports.Callback.public = true;
module.exports.Manage = manage;
module.exports.Manage.public = true;
module.exports.Disconnect = disconnect;
module.exports.Disconnect.public = true;
module.exports.EnableShopperActivities = enableShopperActivities;
module.exports.EnableShopperActivities.public = true;
module.exports.DisableShopperActivities = disableShopperActivities;
module.exports.DisableShopperActivities.public = true;

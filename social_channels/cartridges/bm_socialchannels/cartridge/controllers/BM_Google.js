'use strict';
/**
 * All the nodes for Google BM extension
 * @module controllers/BM_Google
 */

var ISML = require('dw/template/ISML');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var constants = require('int_google/cartridge/scripts/GoogleConstants');
var customObjectHelper = require('int_google/cartridge/scripts/customObjectHelper');
var googleService = require('int_google/cartridge/scripts/services/googleService');

/**
 * Landing page for google
 */
function start() {
    var googleSettings = customObjectHelper.getCustomObject();

    // If the customer already authenticated, we know the gmcid, we can directly render the 'Manage' page
    if (!empty(googleSettings.custom.appId)) {
        var response = googleService.getConnection(googleSettings.custom.appId);
        if (!response.error && response.result && response.result.state === constants.STATES.LIVE) {
            ISML.renderTemplate('google/manage', {
                googleSettings: googleSettings,
                error: request.httpParameterMap.error.stringValue
            });
            return;
        } else if(!response.error) {
            ISML.renderTemplate('google/setup', {
                googleSettings: googleSettings,
                error: request.httpParameterMap.error.stringValue
            });
            return;
        }
        
        if( response.error ) {
            if(response.errorCode === '404') {
                Logger.error('Google Connection not found for appid:' + googleSettings.custom.appId);
            }
            Logger.error('Unexpected error in get connection. Reseting the connection');
            disconnect();
        }
    }

    var formSubmitted = request.httpParameterMap.launch.booleanValue;
    if (!formSubmitted) {
        // Clear form
        var form = session.forms.google;
        form.clearFormElement();
        form.name.value = '';
        form.email.value = '';
        form.phone.value = '';
        form.webdavusername.value = '';
        form.webdavaccesskey.value = '';
        form.gmcid.value = '';
        form.orgid.value = '';

        // Render the landing page so that the customer can authenticate through google
        ISML.renderTemplate('google/start', {
            acceptTerms: googleSettings.custom.acceptTerms,
            success: request.httpParameterMap.success.stringValue
        });
        return;
    }

    launch();
}

/**
 * Accept terms for google and save the flag in custom object
 */
function acceptTerms() {
    var googleSettings = customObjectHelper.getCustomObject();
    Transaction.wrap(function () {
        googleSettings.custom.acceptTerms = true;
    });

    response.redirect(require('dw/web/URLUtils').https('BM_Google-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue));
}

/**
 * Launch google and show the manage page
 */
function launch() {
    var SEPARATOR = ':';

    var form = session.forms.google;
    var googleSettings = customObjectHelper.getCustomObject();
    var siteId = Site.getCurrent().ID;
    var orgId = form.orgid.value;
    var realmId = orgId.substr(7, 4);
    
    var instanceType = orgId.substring(12);
    if (['prd','stg'].indexOf(instanceType) === -1) {
        instanceType = 'dev';
    }

    var appId = realmId + SEPARATOR + instanceType + SEPARATOR + siteId;

    // Create the connection and save the app details within the form so that it gets saved in the custom object afterward
    var response = googleService.createConnection(appId, form);
    if (response.error) {
        ISML.renderTemplate('google/start', {
            error: response.errorCode,
            acceptTerms: googleSettings.custom.acceptTerms
        });
        return;
    } else {
        var external_data = {
            "webdav": form.webdavusername.value,
            "accesskey": form.webdavaccesskey.value,
            "orgId": form.orgid.value,
            "email": form.email.value
        };

        Transaction.wrap(function () {
            googleSettings.custom.externalData = JSON.stringify(external_data);
            googleSettings.custom.appId = appId;
            googleSettings.custom.gmcid = form.gmcid.value;
        });
    }

    ISML.renderTemplate('google/setup', {
        "googleSettings": googleSettings
    });
    return;
}

function disconnect() {
    var googleSettings = customObjectHelper.getCustomObject();
    customObjectHelper.removeCustomObject(googleSettings);
    response.redirect(require('dw/web/URLUtils').https('BM_Google-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue));
}

/**
 * Endpoints
 */
module.exports.Start = start;
module.exports.Start.public = true;
module.exports.AcceptTerms = acceptTerms;
module.exports.AcceptTerms.public = true;
module.exports.Disconnect = disconnect;
module.exports.Disconnect.public = true;
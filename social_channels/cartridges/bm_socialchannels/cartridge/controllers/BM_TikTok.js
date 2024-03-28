'use strict';
/**
 * All the nodes for TikTok BM extension
 * @module controllers/BM_TikTok
 */

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Encoding = require('dw/crypto/Encoding');
var ISML = require('dw/template/ISML');
var Logger = require('dw/system/Logger');
var Mac = require('dw/crypto/Mac');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var constants = require('int_tiktok/cartridge/scripts/TikTokConstants');
var customObjectHelper = require('int_tiktok/cartridge/scripts/customObjectHelper');
var tiktokService = require('int_tiktok/cartridge/scripts/services/tiktokService');
var einsteinService = require('int_tiktok/cartridge/scripts/services/einsteinService');

/**
 * Landing page for TikTok
 */
function start() {
    var tikTokSettings = customObjectHelper.getCustomObject();

    // If the customer already authenticated, we know the pixelCode, we can directly render the 'Manage' page
    if (!empty(tikTokSettings.custom.pixelCode)) {
        ISML.renderTemplate('tiktok/setup', {
            tikTokSettings: tikTokSettings,
            error: request.httpParameterMap.error.stringValue
        });
        return;
    }

    var showSDK = request.httpParameterMap.showsdk.booleanValue;
    if (!showSDK) {
        // Clear form
        var form = session.forms.tiktok;
        form.clearFormElement();
        form.tenantid.value = require('dw/util/UUIDUtils').createUUID();
        form.orgid.value = '';
        form.amclientid.value = '';
        form.amclientsecret.value = '';
        form.shopperclientid.value = '';
        form.shopperclientsecret.value = '';
        form.industryid.value = '';
        form.countrycode.value = '';
        form.countrycallingcode.value = '';
        form.phone.value = '';
        form.email.value = '';
        form.website.value = '';
        form.tiktokappid.value = '';
        form.tiktokappsecret.value = '';
        form.tiktokexternaldatakey.value = '';

        // Render the landing page so that the customer can authenticate through TikTok
        ISML.renderTemplate('tiktok/start', {
            acceptTerms: tikTokSettings.custom.acceptTerms,
            success: request.httpParameterMap.success.stringValue
        });
        return;
    }

    launch();
}

/**
 * Accept terms for TikTok and save the flag in custom object
 */
function acceptTerms() {
    var tikTokSettings = customObjectHelper.getCustomObject();
    Transaction.wrap(function () {
        tikTokSettings.custom.acceptTerms = true;
    });

    response.redirect(require('dw/web/URLUtils').https('BM_TikTok-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue));
}

/**
 * Launch TikTok and get auth token
 */
 function launch() {
    var site = Site.getCurrent();
    var form = session.forms.tiktok;
    var tikTokSettings = customObjectHelper.getCustomObject();
    var redirect_uri = URLUtils.https('BM_TikTok-Callback').toString();

    // Create the application and save the app details within the form so that it gets saved in the custom object afterward
    var createAppResponse = tiktokService.createApplication(form.tenantid.value, redirect_uri);
    if (createAppResponse.error) {
        ISML.renderTemplate('tiktok/start', {
            error: createAppResponse.errorCode,
            acceptTerms: tikTokSettings.custom.acceptTerms
        });
        return;
    } else {
        form.tiktokappid.value = createAppResponse.result.data.app_id;
        form.tiktokappsecret.value = createAppResponse.result.data.app_secret;
        form.tiktokexternaldatakey.value = createAppResponse.result.data.external_data_key;
    }

    var external_data = {
        version: constants.EXTERNAL_DATA_VERSION,
        business_platform: constants.BUSINESS_PLATFORM,
        external_business_id: form.tenantid.value,
        app_id: form.tiktokappid.value,
        extra: {
            organization_id: form.orgid.value,
            sfcc_api_client_id: form.amclientid.value,
            sfcc_api_client_secret: form.amclientsecret.value,
            shopper_api_client_id: form.shopperclientid.value,
            shopper_api_client_secret: form.shopperclientsecret.value
        },
        industry_id: form.industryid.value,
        timezone: site.getTimezone(),
        country_region: form.countrycode.value,
        store_name: site.getID(),
        phone_number: form.countrycallingcode.value + form.phone.value,
        email: form.email.value,
        currency: site.getDefaultCurrency(),
        locale: site.getDefaultLocale().split('_')[0],
        website_url: form.website.value,
        domain: form.website.value ? form.website.value.replace('https://', '').replace('https://', '') : '',
        redirect_uri: redirect_uri,
        close_method: 'redirect_inside_tiktok',
    };

    Transaction.wrap(function () {
        tikTokSettings.custom.appId = form.tiktokappid.value;
        tikTokSettings.custom.appSecret = form.tiktokappsecret.value;
        tikTokSettings.custom.externalDataKey = form.tiktokexternaldatakey.value;
        tikTokSettings.custom.externalBusinessId = form.tenantid.value;
        tikTokSettings.custom.shopperClientId = form.shopperclientid.value;
        tikTokSettings.custom.shopperClientSecret = form.shopperclientsecret.value;
        tikTokSettings.custom.externalData = JSON.stringify(external_data);
    });

    renderSDK(tikTokSettings, external_data, false);
}

/**
 * Callback URL for tiktok.
 */
function callback() {
    var Bytes = require('dw/util/Bytes');
    var MessageDigest = require('dw/crypto/MessageDigest');
    var tikTokSettings = customObjectHelper.getCustomObject();
    var authCode = request.httpParameterMap.auth_code.value;

    // Authenticating against the TikTok API
    var accessTokenResponse = tiktokService.getAuthToken(tikTokSettings, authCode);
    if (accessTokenResponse.error) {
        customObjectHelper.clearValues(tikTokSettings);
        ISML.renderTemplate('tiktok/start', {
            error: accessTokenResponse.errorCode,
            acceptTerms: tikTokSettings.custom.acceptTerms
        });
        return;
    } else {
        Transaction.wrap(function () {
            tikTokSettings.custom.accessToken = accessTokenResponse.result.data.access_token;
        });
    }

    // Get the Business Profile of the customer
    var getProfileResponse = tiktokService.getBusinessProfile(tikTokSettings);
    if (getProfileResponse.error) {
        customObjectHelper.clearValues(tikTokSettings);
        ISML.renderTemplate('tiktok/start', {
            error: getProfileResponse.errorCode,
            acceptTerms: tikTokSettings.custom.acceptTerms
        });
        return;
    } else {
        Transaction.wrap(function () {
            tikTokSettings.custom.pixelCode = getProfileResponse.result.data.pixel_code;
            tikTokSettings.custom.bcId = getProfileResponse.result.data.bc_id;
            tikTokSettings.custom.advertiserId = getProfileResponse.result.data.adv_id;
            tikTokSettings.custom.catalogId = getProfileResponse.result.data.catalog_id;
        });
    }

    // Get the Pixel details of the customer's app
    var getPixelResponse = tiktokService.getPixelDetails(tikTokSettings);
    if (getPixelResponse.error) {
        customObjectHelper.clearValues(tikTokSettings);
        ISML.renderTemplate('tiktok/start', {
            error: getPixelResponse.errorCode,
            acceptTerms: tikTokSettings.custom.acceptTerms
        });
        return;
    } else {
        Transaction.wrap(function () {
            tikTokSettings.custom.enableAdvancedMatchingPhone = getPixelResponse.result.data.pixels[0].advanced_matching_fields.phone_number;
            tikTokSettings.custom.enableAdvancedMatchingEmail = getPixelResponse.result.data.pixels[0].advanced_matching_fields.email;
        });
    }

    // Get the catalog overview
    var getCatalogOverview = tiktokService.getCatalogOverview(tikTokSettings);
    if (getCatalogOverview.error) {
        customObjectHelper.clearValues(tikTokSettings);
        ISML.renderTemplate('tiktok/start', {
            error: getCatalogOverview.errorCode,
            acceptTerms: tikTokSettings.custom.acceptTerms
        });
        return;
    } else {
        Transaction.wrap(function () {
            tikTokSettings.custom.catalogOverview = JSON.stringify(getCatalogOverview.result.data);
        });
    }

    // added redirect cuz reload window.opener.location.href not working for some browsers
    response.redirect(URLUtils.https('BM_TikTok-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue, 'success', 'setup').toString());

    /*
    // Reload the opener page
    var digest = new MessageDigest(MessageDigest.DIGEST_SHA_512);
    ISML.renderTemplate('tiktok/reload', {
        cspNonce: digest.digest(new Bytes(require('dw/util/UUIDUtils').createUUID())),
        url: URLUtils.https('BM_TikTok-Start', 'success', 'setup').toString()
    });
    */
}

/**
 * Disconnect from TikTok + delete Pixel from Einstein + Remove custom object holding settings
 */
function disconnect() {
    var tikTokSettings = customObjectHelper.getCustomObject();
//    if (empty(tikTokSettings.custom.pixelIdSentToEinstein) || (tikTokSettings.custom.pixelIdSentToEinstein === true && einsteinService.deletePixelIdFromEinstein(tikTokSettings).error === false)) {
        if (tiktokService.disconnectFromTikTok(tikTokSettings)) {
            customObjectHelper.removeCustomObject(tikTokSettings);
            response.redirect(require('dw/web/URLUtils').https('BM_TikTok-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue));
            return;
        } else {
            ISML.renderTemplate('tiktok/setup', {
                error: 'disconnect',
                tikTokSettings: tikTokSettings
            });
            return;
        }
//    }

    ISML.renderTemplate('tiktok/setup', {
        error: 'disconnect.einstein',
        tikTokSettings: tikTokSettings
    });
}

/**
 * Manage tiktok page
 */
 function manage() {
    var tikTokSettings = customObjectHelper.getCustomObject();
    // Refresh the catalog overview
    var getCatalogOverview = tiktokService.getCatalogOverview(tikTokSettings);
    if (getCatalogOverview.error) {
        customObjectHelper.clearValues(tikTokSettings);
        ISML.renderTemplate('tiktok/start', {
            error: getCatalogOverview.errorCode,
            acceptTerms: tikTokSettings.custom.acceptTerms
        });
        return;
    } else {
        Transaction.wrap(function () {
            tikTokSettings.custom.catalogOverview = JSON.stringify(getCatalogOverview.result.data);
        });
    }
    renderSDK(tikTokSettings, JSON.parse(tikTokSettings.custom.externalData), true);
}

function renderSDK(tikTokSettings, external_data, isConnected) {
    var site = Site.getCurrent();
    var timestamp = new Date().getTime();
    external_data.timestamp = timestamp;
    var hmacString = [
        'version=' + constants.EXTERNAL_DATA_VERSION,
        'timestamp=' + timestamp,
        'locale=' + site.getDefaultLocale().split('_')[0],
        'business_platform=' + constants.BUSINESS_PLATFORM,
        'external_business_id=' + tikTokSettings.custom.externalBusinessId
    ].join('&');
    var hmac = Encoding.toHex(new Mac(constants.EXTERNAL_DATA_HMAC_VERSION).digest(hmacString, tikTokSettings.custom.externalDataKey));
    external_data.hmac = hmac;

    var base64 = StringUtils.encodeBase64(JSON.stringify(external_data));
    var approved = '';
    var processing = '';
    var rejected = '';
    if (!empty(tikTokSettings.custom.catalogOverview)) {
        var catalogOverview = JSON.parse(tikTokSettings.custom.catalogOverview);
        if(!empty(catalogOverview) && catalogOverview != 'undefined') {
            approved = catalogOverview.approved;
            processing = catalogOverview.processing;
            rejected = catalogOverview.rejected;
        }
    }
    ISML.renderTemplate('tiktok/tiktoksdk', {
        isConnected: isConnected,
        base64: base64,
        tikTokSettings: {
            externalBusinessId: tikTokSettings.custom.externalBusinessId || '',
            bcId: tikTokSettings.custom.bcId || '',
            advertiserId: tikTokSettings.custom.advertiserId || '',
            pixelCode: tikTokSettings.custom.pixelCode || '',
            enableAdvancedMatchingEmail: tikTokSettings.custom.enableAdvancedMatchingEmail || '',
            enableAdvancedMatchingPhone: tikTokSettings.custom.enableAdvancedMatchingPhone || '',
            catalogId: tikTokSettings.custom.catalogId || '',
            catalogOverview: {
                approved: approved,
                processing: processing,
                rejected: rejected
            }
        }
    });
}

/**
 * Endpoint to submit pixelId to Einstein
 */
 function enableShopperActivities() {
    var tikTokSettings = customObjectHelper.getCustomObject();
//    var tikTokSettings = require('int_tiktok/cartridge/scripts/customObjectHelper').getCustomObject();

    // Don't submit multiple times
    if (tikTokSettings.custom.pixelIdSentToEinstein === true) {
        response.redirect(require('dw/web/URLUtils').https('BM_TikTok-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue));
        return;
    }

    var enableEinsteinReponse = require('int_tiktok/cartridge/scripts/services/einsteinService').sendPixelIdToEinstein(tikTokSettings);
    if (enableEinsteinReponse.error) {
        response.redirect(require('dw/web/URLUtils').https('BM_TikTok-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue, 'error', enableEinsteinReponse.errorCode));
        return;
    }

    require('dw/system/Transaction').wrap(function () {
        tikTokSettings.custom.pixelIdSentToEinstein = true;
    });

    response.redirect(require('dw/web/URLUtils').https('BM_TikTok-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue, 'success', 'einstein.success'));
}

/**
 * Endpoint to disable pixelId from Einstein
 */
 function disableShopperActivities() {
    var tikTokSettings = customObjectHelper.getCustomObject();
//    var tikTokSettings = require('int_tiktok/cartridge/scripts/customObjectHelper').getCustomObject();

    // Don't submit multiple times
    if (tikTokSettings.custom.pixelIdSentToEinstein === false) {
        response.redirect(require('dw/web/URLUtils').https('BM_TikTok-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue));
        return;
    }

    var disableEinsteinReponse = require('int_tiktok/cartridge/scripts/services/einsteinService').deletePixelIdFromEinstein(tikTokSettings);
    if (disableEinsteinReponse.error) {
        response.redirect(require('dw/web/URLUtils').https('BM_TikTok-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue, 'error', disableEinsteinReponse.errorCode));
        return;
    }

    require('dw/system/Transaction').wrap(function () {
        tikTokSettings.custom.pixelIdSentToEinstein = false;
    });

    response.redirect(require('dw/web/URLUtils').https('BM_TikTok-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue, 'success', 'einstein.success'));
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
module.exports.Disconnect = disconnect;
module.exports.Disconnect.public = true;
module.exports.Manage = manage;
module.exports.Manage.public = true;
module.exports.EnableShopperActivities = enableShopperActivities;
module.exports.EnableShopperActivities.public = true;
module.exports.DisableShopperActivities = disableShopperActivities;
module.exports.DisableShopperActivities.public = true;

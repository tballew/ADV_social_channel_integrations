'use strict';

var Logger = require('dw/system/Logger').getLogger('googleService');
var Transaction = require('dw/system/Transaction');

var serviceHelper = require('./serviceHelper');
var constants = require('../GoogleConstants');

var CONTENT_TYPE = 'application/json';

/**
 * Get the authorization key from the Google REST API
 *
 * @returns {Object} an object containing the error if any happened
 */
function getAuthKey() {
    return constants.STATIC_APP_ACCESS_KEY; //return static key for initial launch
}

/**
 * Create google merchant connection on behalf of the customer
 *
 * @param {String} appId Unique Salesforce app id
 * @param {Object} form The form submitted by the merchant
 * @returns {Object} an object containing the error if any happened
 */
function createConnection(appId, form) {
    var basePathImpex = require('dw/util/StringUtils').format(
        '{0}://{1}{2}',
        request.httpProtocol,
        request.httpHost,
        constants.IMPEX_DEFAULT_PATH
    );
    var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
    var inventoryIntegrationMode = ProductInventoryMgr.getInventoryIntegrationMode();
    
    var inventoryPath = inventoryIntegrationMode === ProductInventoryMgr.INTEGRATIONMODE_B2C ? basePathImpex + constants.FEED_PATHS.NATIVE_INVENTORY : basePathImpex + constants.FEED_PATHS.OCI;

    var service = serviceHelper.getService(constants.SERVICES.GOOGLE.CREATE_MERCHANT);
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.CREATE_MERCHANT,
        headers: {
            'Content-Type': CONTENT_TYPE
        },
        params: {
            'merchant_id': appId,
            'key': getAuthKey()
        },
        body: {
            'name': constants.MERCHANT_NAME_PREFIX + appId,
            'merchant_settings': {
                'mc_id': form.gmcid.value,
                'feed_info': {
                    'feed_username': form.webdavusername.value,
                    'feed_access_key': form.webdavaccesskey.value,
                    'feed_paths': {
                        'store_path': basePathImpex + constants.FEED_PATHS.STORES,
                        'inventory_path': inventoryPath,
                        'product_path': basePathImpex + constants.FEED_PATHS.PRODUCT,
                        'price_path': basePathImpex + constants.FEED_PATHS.PRICE
                    }
                }
            },
            'contact_info': {
                'contact': form.name.value,
                'email': form.email.value,
                'phoneNumber': form.countrycallingcode.value + form.phone.value
            }
        }
    };

    var result = service.call(params);
    return parseResponse(result, 'create.merchant.call');
}

/**
 * Get google merchant connection details
 * 
 * @param {String} appId Unique Salesforce app id
 * @returns {Object} an object containing the error if any happened
 */
function getConnection(appId) {
    var service = serviceHelper.getService(constants.SERVICES.GOOGLE.GET_MERCHANT);
    var params = {
        method: 'GET',
        path: constants.ENDPOINTS.GET_MERCHANT + appId,
        headers: {
            'Content-Type': CONTENT_TYPE
        },
        params: {
            'key': getAuthKey()
        }
    };
    var result = service.call(params);
    return parseResponse(result, 'create.merchant.get');
}

/**
 * Parses the response and trigger the given {callback} in case of success or redirect ot the landing page in case of error
 *
 * @param {String} errorCode The error code from the response
 * @param {Object} result The result of the response
 * @returns {Boolean}
 */
 function parseResponse(result, errorCode) {
    if (!result.ok && (result.error =='502' || result.error =='400')) {
        return {
            error: false,
            result: '502 - Temp Error'
        };
    } else if (!result.ok) {
        Logger.error('Error occurred while {0}. Error Message: {1}', errorCode.replace('.', ' ', 'g'), result.errorMessage);
        return {
            error: true,
            errorCode: errorCode
        };
    }

    var resultText = JSON.parse(result.object.text);
    Logger.info('result: ' + result.object.text + '\n');
    return {
        error: false,
        result: resultText
    };
}

module.exports = {
    createConnection: createConnection,
    getConnection: getConnection
};
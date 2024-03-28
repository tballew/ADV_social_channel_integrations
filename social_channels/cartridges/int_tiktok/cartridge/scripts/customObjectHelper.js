'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var constants = require('int_tiktok/cartridge/scripts/TikTokConstants');

/**
 * Returns the TikTok settings custom object, if it exists.
 * If it does not exist, then it creates a new custom object instance and return it
 *
 * @returns {dw/object/CustomObject}
 */
function getCustomObject(isStorefrontRequest) {
    var co = CustomObjectMgr.getCustomObject(constants.SOCIAL_CHANNEL_CUSTOM_OBJECT_DEFINITION, constants.TIKTOK_CUSTOM_OBJECT_ID);
    if (co) {
        return co;
    }
    else if (isStorefrontRequest) {
        var Logger = require('dw/system/Logger');
        Logger.warn("Missing Custom Object definition");
        return null;
    }

    return Transaction.wrap(function () {
        return CustomObjectMgr.createCustomObject(constants.SOCIAL_CHANNEL_CUSTOM_OBJECT_DEFINITION, constants.TIKTOK_CUSTOM_OBJECT_ID);
    });
}

/**
 * Clears the TikTok values from the custom object so that we can start again the process
 *
 * @param {dw/object/CustomObject} tikTokSettings The custom object to clear
 */
function clearValues(tikTokSettings) {
    Transaction.wrap(function () {
        tikTokSettings.custom.appId = '';
        tikTokSettings.custom.appSecret = '';
        tikTokSettings.custom.externalDataKey = '';
        tikTokSettings.custom.externalBusinessId = '';
        tikTokSettings.custom.shopperClientId = '';
        tikTokSettings.custom.shopperClientSecret = '';
        tikTokSettings.custom.externalData = '';
        tikTokSettings.custom.accessToken = '';
        tikTokSettings.custom.refreshToken = '';
        tikTokSettings.custom.pixelCode = '';
        tikTokSettings.custom.bcId = '';
        tikTokSettings.custom.advertiserId = '';
        tikTokSettings.custom.catalogId = '';
        tikTokSettings.custom.enableAdvancedMatchingPhone = false;
        tikTokSettings.custom.enableAdvancedMatchingEmail = false;
        tikTokSettings.custom.catalogOverview = '';
    });
}

/**
 * Removes the given custom object
 *
 * @param {dw/object/CustomObject} tikTokSettings The custom object to remove
 */
function removeCustomObject(tikTokSettings) {
    Transaction.wrap(function () {
        CustomObjectMgr.remove(tikTokSettings);
    });
}

module.exports = {
    getCustomObject: getCustomObject,
    removeCustomObject: removeCustomObject,
    clearValues: clearValues
};

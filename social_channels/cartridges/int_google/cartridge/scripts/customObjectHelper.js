'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var constants = require('int_google/cartridge/scripts/GoogleConstants');

/**
 * Returns the Google settings custom object, if it exists.
 * If it does not exist, then it creates a new custom object instance and return it
 *
 * @returns {dw/object/CustomObject}
 */
function getCustomObject() {
    var co = CustomObjectMgr.getCustomObject(constants.SOCIAL_CHANNEL_CUSTOM_OBJECT_DEFINITION, constants.GOOGLE_CUSTOM_OBJECT_ID);
    if (co) {
        return co;
    }

    return Transaction.wrap(function () {
        return CustomObjectMgr.createCustomObject(constants.SOCIAL_CHANNEL_CUSTOM_OBJECT_DEFINITION, constants.GOOGLE_CUSTOM_OBJECT_ID);
    });
}

/**
 * Clears the Google values from the custom object so that we can start again the process
 *
 * @param {dw/object/CustomObject} googleSettings The custom object to clear
 */
function clearValues(googleSettings) {
    Transaction.wrap(function () {
        googleSettings.custom.appId = '';
        googleSettings.custom.appSecret = '';
        googleSettings.custom.externalDataKey = '';
        googleSettings.custom.externalBusinessId = '';
        googleSettings.custom.shopperClientId = '';
        googleSettings.custom.shopperClientSecret = '';
        googleSettings.custom.externalData = '';
        googleSettings.custom.accessToken = '';
        googleSettings.custom.refreshToken = '';
        googleSettings.custom.pixelCode = '';
        googleSettings.custom.bcId = '';
        googleSettings.custom.advertiserId = '';
        googleSettings.custom.catalogId = '';
        googleSettings.custom.enableAdvancedMatchingPhone = false;
        googleSettings.custom.enableAdvancedMatchingEmail = false;
        googleSettings.custom.catalogOverview = '';
    });
}

/**
 * Removes the given custom object
 *
 * @param {dw/object/CustomObject} googleSettings The custom object to remove
 */
function removeCustomObject(googleSettings) {
    Transaction.wrap(function () {
        CustomObjectMgr.remove(googleSettings);
    });
}

module.exports = {
    getCustomObject: getCustomObject,
    removeCustomObject: removeCustomObject,
    clearValues: clearValues
};

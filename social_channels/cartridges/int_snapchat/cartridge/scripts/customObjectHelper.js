'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var constants = require('int_snapchat/cartridge/scripts/SnapchatConstants');

/**
 * Returns the Snapchat settings custom object, if it exists.
 * If it does not exist, then it creates a new custom object instance and return it
 *
 * @returns {dw/object/CustomObject}
 */
function getCustomObject() {
    var co = CustomObjectMgr.getCustomObject(constants.SOCIAL_CHANNEL_CUSTOM_OBJECT_DEFINITION, constants.SNAPCHAT_CUSTOM_OBJECT_ID);
    if (co) {
        return co;
    }

    return Transaction.wrap(function () {
        return CustomObjectMgr.createCustomObject(constants.SOCIAL_CHANNEL_CUSTOM_OBJECT_DEFINITION, constants.SNAPCHAT_CUSTOM_OBJECT_ID);
    });
}

/**
 * Clears the Snapchat values from the custom object so that we can start again the process
 *
 * @param {dw/object/CustomObject} snapchatSettings The custom object to clear
 */
function clearValues(snapchatSettings) {
    Transaction.wrap(function () {
        snapchatSettings.custom.appId = '';
        snapchatSettings.custom.appSecret = '';
        snapchatSettings.custom.externalDataKey = '';
        snapchatSettings.custom.externalBusinessId = '';
        snapchatSettings.custom.shopperClientId = '';
        snapchatSettings.custom.shopperClientSecret = '';
        snapchatSettings.custom.externalData = '';
        snapchatSettings.custom.accessToken = '';
        snapchatSettings.custom.refreshToken = '';
        snapchatSettings.custom.pixelCode = '';
        snapchatSettings.custom.bcId = '';
        snapchatSettings.custom.advertiserId = '';
        snapchatSettings.custom.catalogId = '';
        snapchatSettings.custom.enableAdvancedMatchingPhone = false;
        snapchatSettings.custom.enableAdvancedMatchingEmail = false;
        snapchatSettings.custom.catalogOverview = '';
        snapchatSettings.custom.acceptTerms = false;
    });
}

/**
 * Removes the given custom object
 *
 * @param {dw/object/CustomObject} snapchatSettings The custom object to remove
 */
function removeCustomObject(snapchatSettings) {
    Transaction.wrap(function () {
        CustomObjectMgr.remove(snapchatSettings);
    });
}

module.exports = {
    getCustomObject: getCustomObject,
    removeCustomObject: removeCustomObject,
    clearValues: clearValues
};

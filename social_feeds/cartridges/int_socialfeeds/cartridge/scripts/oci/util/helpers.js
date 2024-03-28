'use strict';

/**
 * @module util/helpers
 */

var Logger = require('dw/system/Logger').getLogger('bm_socialfeeds', 'OCI:util/helpers');
var config = require('../oci.config');

/**
 * @description Expands a JSON String into an object.  Takes a JSON string and attempts
 * to deserialize it.  A default value can be applied in the event that deserialization fails.
 *
 * @param {string} jsonString Represents the JSON String being expanded and deserialized.
 * @param {*} defaultValue Represents the default value to be applied to the variable if the JSON
 * string could not be expanded / deserialized.
 * @returns {*} Returns undefined if empty string or exception encountered
 */
function expandJSON(jsonString, defaultValue) {
    var output = defaultValue;
    try {
        output = jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (e) {
        Logger.error('Error parsing JSON: {0}', e);
    }
    return output;
}

/**
 * @description Returns an access token
 * @param {Object} param service parameter
 * @returns {*} Returns undefined if empty string or exception encountered
 */
function getAccessToken(param) {
    var svc = require('*/cartridge/scripts/oci/services/ServiceMgr').getAuthService();
    var result = svc.call(param);
    if (result.status === 'OK' && !empty(result.object)) {
        // In case the auth token has been retrieved, then return it
        return result.object.access_token;
    }
    return undefined;
}

/**
 * @description Returns the org id saved in the custom object.
 * @param {Object} co custom object
 * @return {string} Org id
 */
function getOrgId(co) {
    return !empty(co) && !empty(co.custom.OrgId) ? co.custom.OrgId.substr(7) : null;
}

/**
 * @description Returns configuration custom object
 * @param {string} customObjectId custom object id
 * @return {Object|undefined} custom object
 */
function getConfigCO(customObjectId) {
    var iter;
    var co;
    try {
        iter = require('dw/object/CustomObjectMgr').getAllCustomObjects(config.customObject.extendedExportList);

        while (iter.hasNext()) {
            co = iter.next();
            if (co.custom.ID.equals(customObjectId)) {
                break;
            }
        }
    } catch (e) {
        Logger.error('Error retrieving the location group information from the custom object.');
        return co;
    } finally {
        if (iter) {
            iter.close();
        }
    }
    return co;
}

module.exports = {
    expandJSON: expandJSON,
    getAccessToken: getAccessToken,
    getOrgId: getOrgId,
    getConfigCO: getConfigCO
};

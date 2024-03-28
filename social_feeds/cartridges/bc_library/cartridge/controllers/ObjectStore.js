'use strict';

/**
 * @module controllers/ObjectStore
 */

/* Script Modules */

var boguard = require('~/cartridge/scripts/boguard');

/* API Includes */
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');

/**
 * get the object helper object
 *
 * @private
 *
 * @param  {Object} requestHeaders request headers
 * @return {Object} ObjectHelper
 */
function getObjectHelperObj(requestHeaders) {
    var isSystem = (requestHeaders.system === 'true');

    var config = null;

    if (requestHeaders.config !== 'undefined') {
        config = JSON.parse(requestHeaders.config);
    }
    var ObjectHelper;

    if (!empty(config) && config.helperClassPath) {
        ObjectHelper = require(config.helperClassPath).ObjectHelper;
    } else {
        ObjectHelper = require('bc_library/cartridge/scripts/customobject/ObjectHelper').ObjectHelper;
    }

    var objectHelper = new ObjectHelper(requestHeaders.type, isSystem, config);

    return objectHelper;
}

/**
 * @function
 * @description Reads the objects from the Object Store.
 */
function readObjects() {
    var Response = require('~/cartridge/scripts/util/Response');
    var params = request.httpParameterMap;
    var headers = request.httpHeaders;

    request.locale = (empty(Site.getCurrent().defaultLocale) ? 'default' : Site.getCurrent().defaultLocale);
    var objectHelper = getObjectHelperObj(headers);

    var responseObj = objectHelper.getResultList(params);

    Response.renderJSON(responseObj);
}

/**
 * @function
 * @description Saves the to the Object Store.
 */
function saveObject() {
    var Response = require('~/cartridge/scripts/util/Response');
    var params = request.httpParameterMap;
    var headers = request.httpHeaders;

    var objectHelper = getObjectHelperObj(headers);

    var responseObj = Transaction.wrap(function () {
        return objectHelper.saveObject(params.requestBodyAsString);
    });

    Response.renderJSON(
        { success: responseObj }
    );
}

/**
 * @function
 * @description Creates the to the Object Store.
 */
function createObject() {
    var Response = require('~/cartridge/scripts/util/Response');
    var params = request.httpParameterMap;
    var headers = request.httpHeaders;

    var objectHelper = getObjectHelperObj(headers);

    var responseObj = Transaction.wrap(function () {
        return objectHelper.createObject(params.requestBodyAsString);
    });

    Response.renderJSON(
        { success: responseObj }
    );
}

/**
 * @function
 * @description Deletes the to the Object Store.
 */
function deleteObject() {
    var Response = require('~/cartridge/scripts/util/Response');
    var params = request.httpParameterMap;
    var headers = request.httpHeaders;

    var objectHelper = getObjectHelperObj(headers);

    var responseObj = Transaction.wrap(function () {
        return objectHelper.deleteObject(params.requestBodyAsString);
    });

    Response.renderJSON(
        { success: responseObj }
    );
}

/**
 * @function
 * @description Gets the definition of the Object Store.
 */
function getDefinition() {
    var Response = require('~/cartridge/scripts/util/Response');
    var headers = request.httpHeaders;

    var objectHelper = getObjectHelperObj(headers);

    Response.renderJSON(
        { customObjectDefinition: objectHelper.getObjectDefinition() }
    );
}

/**
 * @see module:controllers/ObjectStore~ReadObjects */
exports.ReadObjects = boguard.ensure(['https'], readObjects);
/**
 * @see module:controllers/ObjectStore~SaveObject */
exports.SaveObject = boguard.ensure(['https'], saveObject);
/**
 * @see module:controllers/ObjectStore~CreateObject */
exports.CreateObject = boguard.ensure(['https'], createObject);
/**
 * @see module:controllers/ObjectStore~DeleteObject */
exports.DeleteObject = boguard.ensure(['https'], deleteObject);
/**
 * @see module:controllers/ObjectStore~GetDefinition */
exports.GetDefinition = boguard.ensure(['https'], getDefinition);

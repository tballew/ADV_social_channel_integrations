/**
 * Service Helper for TikTok and Einstein  services.
 */

'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

/**
 * Use this method to get countryCode from Current Locale
 *
 * @return {String} The country code found in the request, if any exists
 */
function getCountryCodeFromCurrentLocale() {
    if (empty(request.locale)) {
        return '';
    }

    var currentLocaleParsed = request.locale.split('_');
    return currentLocaleParsed[currentLocaleParsed.length > 1 ? 1 : 0];
}

/**
 * Get existing (configured in BM) service ID according to current Site and Country
 *
 * @param  {String} name The ID of the service to use while fetching the services
 * @param  {dw.svc.serviceCallback} serviceCallback The serviceCallback to use to create the service
 *
 * @return {String} The service ID configured, or undefined if no service has been found
 */
function getServiceID(name, serviceCallback) {
    var Logger = require('dw/system/Logger').getLogger('TikTokServiceHelper', 'getServiceID');
    var siteID = require('dw/system/Site').getCurrent().getID().toLowerCase();
    var countryID = getCountryCodeFromCurrentLocale().toLowerCase();
    serviceCallback = serviceCallback || {};
    var possibleIDs = [
        name + '.' + siteID + '.' + countryID,
        name + '.' + siteID,
        name + '.' + countryID,
        name,
    ];

    var existingIDs = possibleIDs.filter(function (id) {
        try {
            return !empty(LocalServiceRegistry.createService(id, serviceCallback));
        } catch (e) {
            Logger.debug('Requested Service is not configured: {0}. {1}', id, e);
            return false;
        }
    });

    return !empty(existingIDs) ? existingIDs[0] : undefined;
}

var serviceCallback = {
    createRequest: function (service, params) {
        service.setRequestMethod(params.method);
        if (params.path) {
            service.setURL(service.getURL() + params.path);
        }

        if (params.headers) {
            Object.keys(params.headers).forEach(function (key) {
                service.addHeader(key, params.headers[key]);
            });
        }
        if (params.params) {
            Object.keys(params.params).forEach(function (key) {
                service.addParam(key, params.params[key]);
            });
        }

        // Need to check for object because stringify will escape quotes and invalidate login request
        var payload = params.body === null || params.body === '' || typeof(params.body) === 'string' ? params.body : JSON.stringify(params.body);
        return payload;
    },
    parseResponse: function (service, response) {
        return response;
    },
    getRequestLogMessage: function (request) {
        require('dw/system/Logger').getLogger('TikTok', 'serviceHelper').debug(JSON.stringify(request));
    },
    getResponseLogMessage: function (response) {
        require('dw/system/Logger').getLogger('TikTok', 'serviceHelper').debug(JSON.stringify(response.getText()));
    }
};

/**
 * Returns a LocalServiceRegistry for passed service name.
 * @param {String} serviceName
 * @returns LocalServiceRegistry
 */
function getService(serviceName) {
    return LocalServiceRegistry.createService(getServiceID(serviceName, serviceCallback), serviceCallback);
}

module.exports = {
    getService : getService
};

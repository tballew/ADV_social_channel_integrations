'use strict';

/**
 * @module services/ServiceMgr
 */

/**
 * @type {dw/system/Log}
 */
var LOGGER = require('dw/system/Logger').getLogger('bm_socialfeeds', 'OCI:ServiceMgr');
var config = require('../oci.config');
var serviceHelpers = require('*/cartridge/scripts/social/helpers/serviceHelpers');

/**
 * @description Returns the service related to the given {serviceId} initialized with the given {definition}.
 *
 * @param {string} serviceId The id of the service
 * @param {Object} definition The definition to use while initializing the service
 * @return {dw/svc/Service} A new service instance
 */
function getService(serviceId, definition) {
    return require('dw/svc/LocalServiceRegistry')
        .createService(
            serviceId,
            definition
        );
}

/**
 * Get Service Timeout
 * @param {dw/svc/Service} svc Log Message
 * @return {number} Response Log Message
 */
function getServiceTimeout(svc) {
    if (svc && svc.configuration && svc.configuration.profile && svc.configuration.profile.timeoutMillis) {
        return svc.configuration.profile.timeoutMillis;
    }
    throw new Error(require('dw/util/StringUtils').format('Please set a timeout for service {0}', svc.configuration.ID));
}

module.exports = {
    /**
     * @description Returns a new instance of the OCI Auth Service
     *
     * @returns {dw/svc/Service} Returns the service definition that will be used to interact
     * with the Salesforce Platform and facilitate access token retrival
     */
    getAuthService: function () {
        return getService(config.services.auth, {

            /**
             * @description Create the request for service authentication
             *
             * @param {dw/svc/HTTPService} svc Represents the service to be configured
             * @param {Object} param Contains service parameter like OrgId
             * @throws {Error} Throws error when service credentials are missing
             */
            createRequest: function (svc, param) {
                var svcCredential = svc.getConfiguration().getCredential();
                if (!svcCredential || !svcCredential.getUser() || !svcCredential.getPassword()) {
                    throw new Error('Auth service, service configuration requires valid username and password');
                }
                if (!param.OrgId) {
                    throw new Error('Auth service, service configuration requires OrgId');
                }
                var orgId = 'SALESFORCE_COMMERCE_API:' + param.OrgId;
                svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');
                svc.setRequestMethod('POST');
                svc.addParam('grant_type', 'client_credentials');
                svc.addParam('scope', orgId + ' sfcc.inventory.impex-event-log sfcc.inventory.impex-graphs sfcc.inventory.impex-graphs.rw sfcc.inventory.impex-inventory.rw sfcc.inventory.impex-inventory sfcc.inventory.availability sfcc.inventory.availability.rw sfcc.inventory.reservations sfcc.inventory.reservations.rw sfcc.inventory.admin.rw');
            },

            /**
             * @typedef {Object} responseObj Represents the Salesforce Platform http:// response object
             * @property {String} access_token Represents the accessToken provided by the Salesforce Platform
             * when authentication / authorization is successful.
             */

            /**
             * @description Parse the serviceResponse for the authToken and other relevant details
             *
             * @param {dw/svc/HTTPService} svc Represents the service being interacted with
             * @param {dw/net/HTTPClient} client Represents the httpClient containing the service response
             * @returns {Object} Returns a responseObject driven by the httpClient
             */
            parseResponse: function (svc, client) {
                var responseObj = require('*/cartridge/scripts/oci/util/helpers').expandJSON(client.text, client.text);
                if (responseObj && responseObj.access_token) {
                    LOGGER.debug('Auth service, access token successfully retrieved: {0}', responseObj.access_token);
                }

                return responseObj;
            },
            mockFull: function () {
                return require('*/cartridge/scripts/oci/services/mocks/auth');
            },
            filterLogMessage: function (data) {
                try {
                    var logObj = JSON.parse(data);
                    var result = serviceHelpers.iterate(logObj);
                    return result ? JSON.stringify(result) : data;
                } catch (ex) {
                    return serviceHelpers.prepareFormLogData(data);
                }
            }
        });
    },

    /**
     * @description triggers export of OCI inventory
     * @returns {dw/svc/Service} Returns the service definition that will be used to interact
     * with the Salesforce Core Platform and trigger OCI inventory export
     */
    getFullExportService: function () {
        return getService(config.services.export, {
            /**
             * @description Create the request for service authentication
             * @param {dw.svc.HTTPService} svc service
             * @param {Object} options options
             * @returns {string} request body
             */
            createRequest: function (svc, options) {
                var svcCredential = svc.getConfiguration().getCredential();
                if (!svcCredential || !svcCredential.getUser()) {
                    throw new Error('Trigger Export service, service configuration requires valid tenant group id');
                }
                var url = svcCredential.URL + config.endpoints.export.full;
                svc.setURL(url.replace('tenant_group_id', svcCredential.getUser()));
                svc.addHeader('Content-Type', 'application/json');
                svc.setRequestMethod('POST');
                svc.addHeader('Authorization', 'Bearer ' + options.token);
                return JSON.stringify(options.body);
            },

            /**
             * @description Parse the serviceResponse for the authToken and other relevant details
             * @param {dw.svc.HTTPService} svc Represents the service being interacted with
             * @param {dw.net.HTTPClient} client Represents the httpClient containing the service response
             * @returns {Object} Returns a responseObject driven by the httpClient
             */
            parseResponse: function (svc, client) {
                var responseObj = require('*/cartridge/scripts/oci/util/helpers').expandJSON(client.text, client.text);
                return responseObj;
            },
            mockFull: function () {
                return require('*/cartridge/scripts/oci/services/mocks/fullExportTrigger');
            },
            filterLogMessage: function (data) {
                try {
                    var logObj = JSON.parse(data);
                    var result = serviceHelpers.iterate(logObj);
                    return result ? JSON.stringify(result) : data;
                } catch (ex) {
                    return serviceHelpers.prepareFormLogData(data);
                }
            }
        });
    },

    /**
     * @description triggers export of OCI inventory
     * @returns {dw/svc/Service} Returns the service definition that will be used to interact
     * with the Salesforce Core Platform and trigger OCI inventory export
     */
    getDownloadService: function () {
        return getService(config.services.download, {
            /**
             * @description Create the request for service authentication
             * @param {dw.svc.HTTPService} svc Represents the service to be configured
             * @param {Object} options options
             * @returns {*} request
             */
            createRequest: function (svc, options) {
                svc.setRequestMethod('GET');
                return options;
            },

            /**
             * @description Parse the serviceResponse for the authToken and other relevant details
             *
             * @param {dw/svc/HTTPService} svc Represents the service being interacted with
             * @param {dw/net/HTTPClient} client Represents the httpClient containing the service response
             * @returns {Object} Returns a responseObject driven by the httpClient
             */
            parseResponse: function (svc, client) {
                var responseObj = require('*/cartridge/scripts/oci/util/helpers').expandJSON(client.text, client.text);
                return responseObj;
            },

            /**
             * @description Parse the serviceResponse for the authToken and other relevant details
             *
             * @param {dw/svc/HTTPService} svc Represents the service being interacted with
             * @param {Object} options options
             * @returns {dw/net/HTTPClient} Represents the httpClient containing the service response
             */
            execute: function (svc, options) {
                var svcCredential = svc.getConfiguration().getCredential();
                var url = svcCredential.URL + options.path;
                svc.setRequestMethod('GET');
                svc.client.setTimeout(getServiceTimeout(svc));
                svc.client.setRequestHeader('Authorization', 'Bearer ' + options.token);

                if (options.file) {
                    svc.client.setRequestHeader('Content-Type', 'application/octet-stream');
                    svc.client.open('GET', url);
                    svc.client.sendAndReceiveToFile(options.file);
                } else {
                    svc.client.setRequestHeader('Content-Type', 'application/json');
                    svc.client.open('GET', url);
                    svc.client.send();
                }

                return svc.client;
            },
            executeOverride: true,

            mockFull: function () {
                return require('*/cartridge/scripts/oci/services/mocks/download');
            },
            filterLogMessage: function (data) {
                try {
                    var logObj = JSON.parse(data);
                    var result = serviceHelpers.iterate(logObj);
                    return result ? JSON.stringify(result) : data;
                } catch (ex) {
                    return serviceHelpers.prepareFormLogData(data);
                }
            }
        });
    },

    /**
     * @description triggers export of OCI inventory
     * @returns {dw/svc/Service} Returns the service definition that will be used to interact
     * with the Salesforce Core Platform and trigger OCI inventory export
     */
    getDeltaService: function () {
        return getService(config.services.delta, {
            /**
             * @description Create the request for service authentication
             * @param {dw/svc/HTTPService} svc Represents the service being interacted with
             * @param {Object} options options
             * @returns {Error} Throws error when service credentials are missing
             */
            createRequest: function (svc, options) {
                var svcCredential = svc.getConfiguration().getCredential();
                if (!svcCredential || !svcCredential.getUser()) {
                    throw new Error('Trigger Export service, service configuration requires valid tenant group id');
                }
                var url = svcCredential.URL + config.endpoints.export.delta;
                svc.setURL(url.replace('tenant_group_id', svcCredential.getUser()));
                svc.addHeader('Content-Type', 'application/json');
                svc.setRequestMethod('POST');
                svc.addHeader('Authorization', 'Bearer ' + options.token);
                return JSON.stringify(options.body);
            },

            /**
             * @description Parse the serviceResponse for the authToken and other relevant details
             *
             * @param {dw/svc/HTTPService} svc Represents the service being interacted with
             * @param {dw/net/HTTPClient} client Represents the httpClient containing the service response
             * @returns {Object} Returns a responseObject driven by the httpClient
             */
            parseResponse: function (svc, client) {
                var responseObj = require('*/cartridge/scripts/oci/util/helpers').expandJSON(client.text, client.text);
                return responseObj;
            },

            mockFull: function () {
                return require('*/cartridge/scripts/oci/services/mocks/delta');
            },
            filterLogMessage: function (data) {
                try {
                    var logObj = JSON.parse(data);
                    var result = serviceHelpers.iterate(logObj);
                    return result ? JSON.stringify(result) : data;
                } catch (ex) {
                    return serviceHelpers.prepareFormLogData(data);
                }
            }
        });
    }
};

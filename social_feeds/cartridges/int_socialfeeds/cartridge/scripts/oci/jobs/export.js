'use strict';

var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger').getLogger('bm_socialfeeds', 'OCI:export');
var FileWriter = require('dw/io/FileWriter');
var config = require('../oci.config');
var ServiceMgr = require('../services/ServiceMgr');
var Helper = require('../util/helpers');
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');
var FileHelper = require('int_socialfeeds/cartridge/scripts/helpers/FileHelper.js');

/**
 * Calls OCI API to save the full export feed as file
 * @param {string} token Access token
 * @param {string} exportStatusLink Export link to the running export job
 * @param {dw.io.File} file file to save the inventory
 * @returns {Object} returns true or false based on download operation was successful or not
 */
function downloadInventory(token, exportStatusLink, file) {
    var downloadService;
    var result;
    var fileLink;
    var response;

    downloadService = ServiceMgr.getDownloadService();
    result = downloadService.call({
        token: token,
        path: exportStatusLink
    });
    if (result.status === 'OK' && !empty(result.object)) {
        switch (result.object.status) {
            case 'COMPLETED':
                fileLink = result.object.download.downloadLink;
                response = downloadService.call({
                    token: token,
                    path: fileLink,
                    file: file
                });
                if (response.status === 'OK') {
                    return { success: true };
                }
                break;
            case 'RUNNING':
                Logger.info('Inventory Export has not finished. The retry download job will be triggered on the next execution.');
                return { success: true, retryDownload: true };
            default:
                Logger.info('Error downloading the inventory file. Export is still running');
                return { success: false };
        }
    }
    Logger.error('Error downloading the inventory file. Export is still running');
    return false;
}

/**
 * Retrieve the Delta Token
 * @param {dw.io.File} file file to retrieve the deltaToken
 * @returns {string|undefined} return deltaToken if operation is success otherwise undefined
 */
function retriveDeltaToken(file) {
    var FileReader;
    var reader;
    var lastLine;
    var nextLine;
    var deltaToken;

    FileReader = require('dw/io/FileReader');
    reader = new FileReader(file);
    // eslint-disable-next-line no-cond-assign
    while (!empty(nextLine = reader.readLine())) {
        lastLine = nextLine;
    }
    reader.close();

    deltaToken = lastLine && JSON.parse(lastLine).deltaToken;

    if (deltaToken) {
        Logger.info('deltaToken retrieved - ' + deltaToken);
        return deltaToken;
    }

    return null;
}

/**
 * Execute the download of the inventory file
 * @param {dw.util.HashMap} args arguments
 * @param {Object} stepExecution Represents an execution of a step that belongs to a job.
 * @returns {dw.system.Status} status object
 */
function executeDownload(args, stepExecution) {
    var token;
    var result;
    var locationCache;
    var groupCache;
    var file;
    var co;
    var deltaTokenLocations;
    var deltaTokenGroups;
    var dataJSON;
    try {
        co = Helper.getConfigCO(args.OCICustomObjectId);
        dataJSON = JSON.parse(co.custom.dataJSON);

        // get the export status links from the custom Object

        if (!(empty(dataJSON)
            || dataJSON.exportResult.locations
            || dataJSON.exportResult.locationGroups)) { // if there is no running export job, error out
            Logger.error('No OCI export is running. Please initiate an export first.');
            return new Status(Status.ERROR, 'ERROR', 'No Inventory Available to Download');
        }

        locationCache = dataJSON.exportResult.locations;
        groupCache = dataJSON.exportResult.locationGroups;

        try {
            var orgId = Helper.getOrgId(co);
            if (!empty(orgId)) {
                token = Helper.getAccessToken({
                    OrgId: orgId
                });
            }
        } catch (e) {
            Logger.error('Error retriving the access token:' + e);
            return new Status(Status.ERROR, 'ERROR', 'Access Token Error');
        }

        if (!token) {
            return new Status(Status.ERROR, 'ERROR', 'Access Token Error');
        }

        var siteId = Site.getCurrent().getID();

        if (locationCache && locationCache.exportStatusLink) {
            file = FileHelper.createFile(args.FolderPath, config.filenames.locations, siteId);
            result = downloadInventory(token, locationCache.exportStatusLink, file);
            if (result.success && !result.retryDownload) {
                // Adding the file path to the job context so that it can be copied to other directories
                // in subsequent step jobs if necessary.
                stepExecution.getJobExecution().context.put('locationsFile', file.getFullPath());

                deltaTokenLocations = retriveDeltaToken(file);
            }
        }

        if (groupCache && groupCache.exportStatusLink) {
            file = FileHelper.createFile(args.FolderPath, config.filenames.groups, siteId);
            result = downloadInventory(token, groupCache.exportStatusLink, file);
            if (result.success && !result.retryDownload) {
                // Adding the file path to the job context so that it can be copied to other directories
                // in subsequent step jobs if necessary.
                stepExecution.getJobExecution().context.put('groupsFile', file.getFullPath());

                deltaTokenGroups = retriveDeltaToken(file);
            }
        }
    } catch (e) {
        Logger.error('Error downloading the inventory file:' + e);
        return new Status(Status.ERROR, 'ERROR', 'Inventory Download Error');
    }

    if (!result.success) {
        return new Status(Status.ERROR, 'ERROR', 'Exception in Inventory Download');
    }

    if (result.retryDownload) {
        Transaction.wrap(function () {
            co.custom.retryDownload = true;
        });
        return new Status(Status.OK, 'WARN', 'Inventory Export has not finished. The retry download job will be triggered on the next execution.');
    }

    dataJSON.deltaTokenLocations = deltaTokenLocations;
    dataJSON.deltaTokenGroups = deltaTokenGroups;

    Transaction.wrap(function () {
        co.custom.dataJSON = JSON.stringify(dataJSON);
        if (co.custom.retryDownload) {
            co.custom.retryDownload = false;
        }
    });

    return new Status(Status.OK, 'OK', 'File(s) downloaded and saved');
}

/**
 * Saves Delta Feed into Impex and returns the next deltaToken
 * @param {string} folderPath folderpath for the delta file
 * @param {string} filename filename
 * @param {string} authToken Auth token for the delta service call
 * @param {string} deltaToken delta token which tracks the delta stream
 * @param {string} type type of the delta feed
 * @param {Object} stepExecution Represents an execution of a step that belongs to a job.
 * @returns {string|undefined} return new deltaToken
 */
function saveDeltaFeed(folderPath, filename, authToken, deltaToken, type, stepExecution) {
    var queryAgain;
    var file;
    var result;
    var deltaService;
    var writer;
    var newDeltaToken;

    queryAgain = false;

    try {
        var siteId = Site.getCurrent().getID();
        file = FileHelper.createFile(folderPath, filename, siteId);
        deltaService = ServiceMgr.getDeltaService();
        do {
            result = deltaService.call({
                token: authToken,
                body: {
                    deltaToken: deltaToken
                }
            });
            if (result.status === 'OK' && !empty(result.object)) {
                if (result.object.shouldQueryAgain) {
                    queryAgain = result.object.shouldQueryAgain;
                    deltaToken = result.object.nextDeltaToken; // eslint-disable-line no-param-reassign
                } else {
                    newDeltaToken = result.object.nextDeltaToken;
                    Logger.info(' new deltaToken ' + newDeltaToken);
                }

                if (result.object.records && result.object.records.length > 0) {
                    writer = new FileWriter(file, true);
                    // eslint-disable-next-line no-loop-func
                    result.object.records.forEach(function (record) {
                        writer.writeLine(JSON.stringify(record));
                    });

                    // Adding the file path to the job context so that it can be copied to other directories
                    // in subsequent step jobs if necessary.
                    stepExecution.getJobExecution().context.put(type, file.getFullPath());
                }
            }
        } while (queryAgain);
    } catch (e) {
        Logger.error('Error downloading the delta inventory file:' + e);
        return false;
    } finally {
        if (writer) {
            writer.close();
        }
    }

    return newDeltaToken;
}

/**
 * Downloads OCI delta Inventory Export using the token stored in the CacheMgr
 * @param {Array} args job arguments
 * @param {string} args.FolderPath folder path
 * @param {Object} stepExecution Represents an execution of a step that belongs to a job.
 * @returns {dw.system.Status} Exit status for a job run
 */
exports.delta = function (args, stepExecution) {
    var deltaTokenLocations;
    var deltaTokenGroups;
    var token;
    var co;
    var dataJSON;

    co = Helper.getConfigCO(args.OCICustomObjectId);
    dataJSON = JSON.parse(co.custom.dataJSON);

    if (!dataJSON && !dataJSON.deltaTokenLocations && !dataJSON.deltaTokenGroups) {
        Logger.error('Delta Tokens not available in the custom object');
        return new Status(Status.ERROR, 'ERROR', 'Inventory Download Error');
    }
    deltaTokenLocations = dataJSON.deltaTokenLocations;
    deltaTokenGroups = dataJSON.deltaTokenGroups;

    try {
        var orgId = Helper.getOrgId(co);
        if (!empty(orgId)) {
            token = Helper.getAccessToken({
                OrgId: orgId
            });
        }
    } catch (e) {
        Logger.error('Error retriving the access token:' + e);
        return new Status(Status.ERROR, 'ERROR', 'Access Token Error');
    }

    if (!token) {
        return new Status(Status.ERROR, 'ERROR', 'Access Token Error');
    }

    if (deltaTokenLocations) {
        dataJSON.deltaTokenLocations = saveDeltaFeed(args.FolderPath, config.filenames.deltaLocations, token, deltaTokenLocations, 'locationsFile', stepExecution);
    }

    if (deltaTokenGroups) {
        dataJSON.deltaTokenGroups = saveDeltaFeed(args.FolderPath, config.filenames.deltaGroups, token, deltaTokenGroups, 'groupsFile', stepExecution);
    }

    if (!dataJSON.deltaTokenLocations && !dataJSON.deltaTokenGroups) {
        return new Status(Status.ERROR, 'ERROR', 'Exception in Inventory Download');
    }

    Transaction.wrap(function () {
        co.custom.dataJSON = JSON.stringify(dataJSON);
    });

    return new Status(Status.OK, 'OK', 'File(s) downloaded and saved');
};

/**
 * This job is responsible for copying files from OCI to another desired folder.
 * The communication between the step jobs regarding which file should be copied is done through the execution context variables of the job (stepExecution.context).
 * When a path is assigned within the context, containing an ID that is present in the typeFilesToCopy array, it will be copied.
 * @param {Array} args job arguments
 * @param {string} args.destinationPath folder path to copy the files
 * @param {Object} stepExecution Represents an execution of a step that belongs to a job.
 * @returns {dw.system.Status} Exit status for a job run
 */
exports.copyOCIFiles = function (args, stepExecution) {
    var File = require('dw/io/File');

    var jobContext = stepExecution.getJobExecution().getContext();

    // Name of keys IDs for accepted values to be copied
    const typeFilesToCopy = ['locationsFile', 'groupsFile'];

    const pathFilesToCopy = [];

    typeFilesToCopy.forEach(function (type) {
        var path = jobContext.get(type);

        if (path) {
            pathFilesToCopy.push(path);
        }
    });

    if (pathFilesToCopy.length === 0) {
        return new Status(Status.OK, 'OK', ' No file(s) to copy');
    }

    var destinationPath;
    if (!empty(args.destinationPath)) {
        if (args.destinationPath[0] !== File.SEPARATOR) {
            destinationPath = File.SEPARATOR + args.destinationPath;
        } else {
            destinationPath = args.destinationPath;
        }
    }

    var destinationFolder = new File(File.IMPEX + File.SEPARATOR + 'src' + destinationPath);

    pathFilesToCopy.forEach(function (nameFile) {
        var originalFile = new File(nameFile);
        FileHelper.copyFile(originalFile, destinationFolder);
    });

    return new Status(Status.OK, 'OK', 'File(s) copied successfully');
};

/**
 * Downloads OCI Inventory Export after it has been triggered
 * @param {Array} args job arguments
 * @param {string} args.FolderPath folder path
 * @param {Object} stepExecution Represents an execution of a step that belongs to a job.
 * @returns {dw.system.Status} Exit status for a job run
 */
exports.download = function (args, stepExecution) {
    return executeDownload(args, stepExecution);
};

/**
 * New attempt to download OCI Inventory Export after it has been triggered
 * @param {Array} args job arguments
 * @param {string} args.FolderPath folder path
 * @param {Object} stepExecution Represents an execution of a step that belongs to a job.
 * @returns {dw.system.Status} Exit status for a job run
 */
exports.retryDownload = function (args, stepExecution) {
    const co = Helper.getConfigCO(args.OCICustomObjectId);
    if (co.custom.retryDownload) {
        return executeDownload(args, stepExecution);
    }
    return new Status(Status.OK, 'OK', 'A new download attempt was not requested');
};

/**
 * Initiates OCI Inventory Export
 * @param {Array} args job arguments
 * @returns {dw.system.Status} Exit status for a job run
 */
exports.trigger = function (args) {
    var token;
    var locIds;
    var locGroupIds;
    var fullExportService;
    var payload;
    var result;
    var co;
    var dataJSON;

    co = Helper.getConfigCO(args.OCICustomObjectId);

    if (!(co.custom.LocationIds || co.custom.LocationGroupIds)) {
        Logger.error("Both LocationIds and LocationGraphIds can't be empty");
        return new Status(Status.ERROR, 'ERROR', 'Input Error');
    }
    try {
        var orgId = Helper.getOrgId(co);
        if (!empty(orgId)) {
            token = Helper.getAccessToken({
                OrgId: orgId
            });
        }
    } catch (e) {
        Logger.error('Error retriving the access token:' + e);
        return new Status(Status.ERROR, 'ERROR', 'Access Token Error');
    }

    if (!token) {
        return new Status(Status.ERROR, 'ERROR', 'Access Token Error');
    }

    locIds = co.custom.LocationIds && co.custom.LocationIds.split(',');
    locGroupIds = co.custom.LocationGroupIds && co.custom.LocationGroupIds.split(',');
    fullExportService = ServiceMgr.getFullExportService();

    // reset the dataJSON
    dataJSON = config.customObject.defaultDataJSON;

    try {
        if (locIds && locIds.length > 0) {
            payload = {
                objects: {
                    locations: locIds
                }
            };
            result = fullExportService.call({
                token: token,
                body: payload
            });
            if (result.status === 'OK' && !empty(result.object)) {
                // save the response in custom object
                dataJSON.exportResult.locations = result.object;
            }
        }
        if (locGroupIds && locGroupIds.length > 0) {
            payload = {
                objects: {
                    groups: locGroupIds
                }
            };
            result = fullExportService.call({
                token: token,
                body: payload
            });
            if (result.status === 'OK' && !empty(result.object)) {
                // save the response in custom cache
                dataJSON.exportResult.locationGroups = result.object;
            } else {
                Logger.error('Error triggerring the export');
                return new Status(Status.ERROR, 'ERROR', 'Exception in Export Trigger Service');
            }
        }
    } catch (e) {
        Logger.error('Error triggerring the export:' + e);
        return new Status(Status.ERROR, 'ERROR', 'Exception in Export Trigger');
    }
    Transaction.wrap(function () {
        co.custom.dataJSON = JSON.stringify(dataJSON);
    });
    return new Status(Status.OK, 'OK', 'Export Triggered');
};

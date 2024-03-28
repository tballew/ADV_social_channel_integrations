'use strict';

// standard API
var File = require('dw/io/File');
var Status = require('dw/system/Status');
var FileHelper = require('int_socialfeeds/cartridge/scripts/helpers/FileHelper.js');

// initialize logger
var Logger = require('dw/system/Logger').getLogger('CopyFiles');

/**
 * It takes a relative path to the impex directory and returns a string with the absolute path.
 * @param {string} path file path
 * @returns {string} file path relative to IMPEX
 */
function getPathRelativeToImpex(path) {
    if (empty(path)) {
        return null;
    }

    var pathRelative;
    if (path[0] !== File.SEPARATOR) {
        pathRelative = File.IMPEX + File.SEPARATOR + path;
    } else {
        pathRelative = File.IMPEX + path;
    }
    return pathRelative;
}

/**
 * It scans the provided directory, searches for and returns the last modified file.
 * @param {dw.File} directory file directory
 * @returns {dw.File} file
 */
function getLastestModifiedFileFromDirectory(directory) {
    var filesList = directory.listFiles().toArray().filter(function (file) { return file.isFile(); });
    if (filesList.length >= 1) { // the folder must have at least one file
        filesList = filesList.sort(function (a, b) {
            const lastModifiedA = a.lastModified();
            const lastModifiedB = b.lastModified();

            if (lastModifiedA < lastModifiedB) {
                return -1;
            }
            if (lastModifiedA > lastModifiedB) {
                return 1;
            }
            return 0;
        }).reverse();
        return filesList[0];
    }
    Logger.error('There is no file to copy.');
    return null;
}

/**
 * Copy Files By Export Social Channels Feeds to another folder
 *
 * @param {dw.util.HashMap} args job arguments
 * @param {Object} stepExecution Represents an execution of a step that belongs to a job.
 * @returns {dw.system.Status} status object
 */
exports.customFeedsCopy = function (args, stepExecution) {
    var jobContext = stepExecution.getJobExecution().getContext();

    var qtyFilesToCopy = jobContext.get('qtyFilesToCopy');
    if (!qtyFilesToCopy) {
        return new Status(Status.OK, 'OK', ' No file(s) to copy');
    }

    const pathFilesToCopy = [];
    for (var i = 0; i < qtyFilesToCopy; i++) {
        pathFilesToCopy.push(jobContext.get('copyFile' + i));
    }

    var destinationDir = new File(getPathRelativeToImpex(args.destinationPath));
    if (!destinationDir) {
        return new Status(Status.ERROR, 'ERROR', 'Empty/Invalid destinationPath input...');
    }

    pathFilesToCopy.forEach(function (nameFile) {
        var originalFile = new File(nameFile);
        FileHelper.copyFile(originalFile, destinationDir);
    });

    return new Status(Status.OK, 'OK', 'File(s) copied successfully');
};

/**
 * Copy the latest modified file in a folder to another desired folder
 * @param {dw.util.HashMap} args job arguments
 * @returns {dw.system.Status} status
 */
exports.copyLastestModifiedFile = function (args) {
    var originDir = new File(getPathRelativeToImpex(args.originPath));
    if (!originDir) {
        return new Status(Status.ERROR, 'ERROR', 'Empty/Invalid originPath input...');
    }

    if (!originDir.exists() && !originDir.mkdirs()) {
        Logger.error('Directory not exists.');
        return new Status(Status.ERROR, 'ERROR', 'Directory not exists...');
    }

    var lastModifiedFile = getLastestModifiedFileFromDirectory(originDir);
    if (!lastModifiedFile) {
        return new Status(Status.ERROR, 'ERROR', 'There is no file to copy...');
    }

    var destinationDir = new File(getPathRelativeToImpex(args.destinationPath));
    if (!destinationDir) {
        return new Status(Status.ERROR, 'ERROR', 'Empty/Invalid destinationPath input...');
    }

    FileHelper.copyFile(lastModifiedFile, destinationDir);

    return new Status(Status.OK, 'OK', 'File(s) copied successfully');
};

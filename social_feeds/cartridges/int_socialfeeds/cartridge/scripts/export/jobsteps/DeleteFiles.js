'use strict';

// standard API
var File = require('dw/io/File');
var Status = require('dw/system/Status');

// initialize logger
var dvLogger = require('dw/system/Logger').getLogger('DeleteFiles');

/**
 * Helper function which delete files
 * @param {string} extension file extension
 * @param {number} olderThanDays older then days number
 * @param {string} loggingComponent logging component
 * @param {dw.io.File} file file
 * @param {boolean} deleteFilesInSubFolders delete files in subdirectories?
 * @returns {void}
 */
var deleteFiles = function (extension, olderThanDays, loggingComponent, file, deleteFilesInSubFolders) {
    var minDate = new Date();
    minDate.setHours(0, 0, 0);
    minDate.setDate(minDate.getDate() - olderThanDays);

    if (file.isDirectory()) {
        var fileList = file.listFiles().toArray();
        var regex = new RegExp('.' + extension);

        for (let index = 0; index < fileList.length; index++) {
            file = fileList[index]; // eslint-disable-line no-param-reassign
            if (deleteFilesInSubFolders && file.isDirectory()) {
                deleteFiles(extension, olderThanDays, loggingComponent, file, deleteFilesInSubFolders);
            } else if (file.isFile() && file.lastModified() < minDate.valueOf()) {
                var remove = extension === 'all' || regex.test(file.getName()) ? file.remove() : false;
                // Logger
                if (!remove && loggingComponent) {
                    loggingComponent.addMessage('The file ' + file.getName() + ' cannot be deleted.', 'ERROR');
                } else if (loggingComponent) {
                    loggingComponent.addMessage('Delete file ' + file.getName(), 'INFO');
                }
            }
        }
    } else {
        throw new Error('Path is not a directory.');
    }
};

/**
 * Triggers the delete files by days
 *
 * @param {dw.util.HashMap} args job arguments
 * @returns {dw.system.Status} status
 */
exports.execute = function (args) {
    var path = File.IMPEX;
    var initialFile;
    var olderThanDays = args.OlderThanDays;
    var extension = args.FileExtension;
    var deleteFilesInSubFolders = args.DeleteFileInSubfolders;
    /** OlderThanDays needs to be bigger than zero */
    if (empty(olderThanDays) && olderThanDays <= 0) {
        throw new Error('OlderThanDays cannot be null, less or equals zero.');
    }

    if (!empty(args.FolderPath)) {
        if (args.FolderPath[0] !== File.SEPARATOR) {
            args.FolderPath = File.SEPARATOR + args.FolderPath;
        }
        path += args.FolderPath;
    }

    initialFile = new File(path);

    /** Validate extension */
    if (empty(extension)) {
        throw new Error('File extension cannot be null.');
    }

    // initialize a fake logger component
    var loggingComponent = {
        addMessage: function (msg) {
            if (msg) {
                dvLogger.info(msg);
            }
        }
    };

    deleteFiles(extension, olderThanDays, loggingComponent, initialFile, deleteFilesInSubFolders);

    return new Status(Status.OK, 'OK');
};

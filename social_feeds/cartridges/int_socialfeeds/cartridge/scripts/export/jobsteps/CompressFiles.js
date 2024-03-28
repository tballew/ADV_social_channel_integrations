'use strict';

var File = require('dw/io/File');
var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger').getLogger('CompressFiles');
var countCompressFiles = 0;

/**
 * Determines whether a string ends with the characters of suffix
 * @param {string} value string value
 * @param {string} suffix string suffix
 * @returns {boolean} validation
 */
function endsWith(value, suffix) {
    return value.indexOf(suffix, value.length - suffix.length) !== -1;
}

/**
 * Validate file extension
 * @param {string} fileName file name
 * @param {string} fileExtension file extension
 * @returns {boolean} file extension is valid
 */
function validateFileExtension(fileName, fileExtension) {
    var fileNameLower = fileName.toLowerCase();
    if (fileExtension === 'all') {
        return endsWith(fileNameLower, '.csv')
            || endsWith(fileNameLower, '.xml')
            || endsWith(fileNameLower, '.tsv')
            || endsWith(fileNameLower, '.txt');
    }
    return endsWith(fileNameLower, '.' + fileExtension);
}

/**
 * Helper function which compress files
 * @param {dw.io.File} file file
 * @param {string} fileExtension file extension
 * @param {string} compressExtension compress extension
 * @param {boolean} compressFileInSubfolders compress files in subdirectories?
 * @param {boolean} removeUncompressedFiles remove uncompressed files?
 * @returns {void}
 */
function compressFiles(file, fileExtension, compressExtension, compressFileInSubfolders, removeUncompressedFiles) {
    if (file.isDirectory()) {
        var fileList = file.listFiles().toArray();

        try {
            for (let index = 0; index < fileList.length; index++) {
                file = fileList[index]; // eslint-disable-line no-param-reassign
                if (compressFileInSubfolders && file.isDirectory()) {
                    compressFiles(file, fileExtension, compressExtension, compressFileInSubfolders, removeUncompressedFiles);
                } else if (file.isFile() && validateFileExtension(file.getName(), fileExtension)) {
                    var compressedFile = new File(file.fullPath.concat('.', compressExtension));

                    if (compressExtension === 'zip') {
                        file.zip(compressedFile);
                    } else {
                        file.gzip(compressedFile);
                    }
                    Logger.info('Compressed files: {0}', compressedFile);
                    // remove original file
                    if (removeUncompressedFiles && !file.remove()) {
                        Logger.warn('Error deleting file: {0}', file.name);
                    }
                    countCompressFiles++;
                }
            }
        } catch (err) {
            Logger.warn('Error compressing file: {0}', err.message);
        }
    } else {
        throw new Error('Path is not a directory.');
    }
}

/**
 * Triggers the compress files
 * @param {dw.util.HashMap} args arguments
 * @returns {dw.system.Status} status
 */
exports.execute = function (args) {
    var path = File.IMPEX;
    var initialFile;

    if (!empty(args.FolderPath)) {
        if (args.FolderPath[0] !== File.SEPARATOR) {
            args.FolderPath = File.SEPARATOR + args.FolderPath;
        }
        path += args.FolderPath;
    }
    initialFile = new File(path);

    compressFiles(initialFile, args.FileExtension, args.CompressExtension, args.CompressFileInSubfolders, args.RemoveUncompressedFiles);
    if (countCompressFiles > 0) {
        Logger.info('Number of compressed files: {0}', countCompressFiles);
    } else {
        Logger.info('No files were compressed.');
    }
    return new Status(Status.OK, 'OK');
};

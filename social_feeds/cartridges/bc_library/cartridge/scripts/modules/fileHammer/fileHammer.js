/* global require:true, exports */

/**
 * fileHammer module. Easiest and safest way to interact with files and streams
 * @module fileHammer
 */

var Status = require('dw/system/Status');
var File = require('dw/io/File');

function extend(target, source) {
    target = target || {};

    for (let prop in source) {
        target[prop] = source[prop];
    }

    return target;
}

function formatError(code, message, error) {
    error = error || { message: '', stack: '' };
    require('dw/system/Logger').getLogger('fileHammer').error(message + error.message + '\n' + error.stack);

    return new Status(Status.ERROR, code, message);
}
/**
 * @type {String}
 */
exports.IMPEX = File.IMPEX;
/**
 * @type {String}
 */
exports.TEMP = File.TEMP;
/**
 * @type {String}
 */
exports.STATIC = File.STATIC;
/**
 * @type {String}
 */
exports.LIBRARIES = File.LIBRARIES;
/**
 * @type {String}
 */
exports.CATALOGS = File.CATALOGS;
/**
 * @type {String}
 */
exports.SEPARATOR = File.SEPARATOR;

/**
 * Callback used by getFile
 * @callback fileCallback
 * @param {dw.io.File} file
 * @return {undefined}
 */

/**
 * Open file with filename and options
 * and if success then run callback with file as first argument
 *
 * @param  {string}  filename path and filename to file relatively to IMPEX by default
 * @param  {Object}  [options] configuration
 * @param  {boolean} [options.createFile=false] create file
 * @param  {string}  [options.rootDir=IMPEX] root directory for filenames
 * @param  {fileCallback} callback
 * @return {dw.system.Status} Status
 */
exports.getFile = function getFile(filename, options, callback) {
    var defaults = {
        createFile: false,
        rootDir: File.IMPEX
    };
    var file;

    if (filename) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        filename = filename.replace(/\{timestamp\}/ig, Date.now());
        filename = filename.replace(/\{date\}/ig, (new Date()).toISOString().split('T')[0]);
        filename = filename.replace(/\{siteID\}/ig, require('dw/system/Site').getCurrent().getID());

        options = extend(defaults, options);

        filename = options.rootDir + File.SEPARATOR + filename;

        file = new File(filename);

        if (options.createFile) {
            (new File(file.fullPath.substr(0, file.fullPath.lastIndexOf(File.SEPARATOR)))).mkdirs();

            if (!file.createNewFile()) {
                return formatError('003', 'The file "' + filename + '" already exists (method getFile)');
            }
        }

        if (file.exists() && file.isFile()) {
            try {
                callback(file);
            } catch (e) {
                return formatError('004',
                    'Error occurred in callback function (method getFile): ',
                    e);
            }

            return new Status(Status.OK);
        }
        return formatError('002', 'The file "' + filename + '" is not a file (method getFile)');
    }
    return formatError('001', 'Missing file name (method getFile)');
};
/**
 * Callback used by getFileReader
 *
 * @callback fileReaderCallback
 * @param {dw.io.FileReader} fileReader instance of FileReader
 *    (fileReader will be closed after callback is done)
 * @param {dw.io.File} file
 * @return {undefined}
 */

/**
 * Open file in read mode
 * and if success then run callback with fileReader as first argument
 *
 * @param  {string}  name path and filename to file relatively to IMPEX by default
 * @param  {Object}  [options] configuration
 * @param  {boolean} [options.createFile=false] create file
 * @param  {string}  [options.encoding='UTF-8'] encoding of file
 * @param  {string}  [options.rootDir=IMPEX] root directory for filenames
 * @param  {fileReaderCallback} callback
 * @return {dw.system.Status} Status
 */
exports.getFileReader = function getFileReader(name, options, callback) {
    var defaults = {
        encoding: 'UTF-8',
        createFile: false
    };
    var status;
    var intStatus;

    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    options = extend(defaults, options);
    status = exports.getFile(name, options, function (file) {
        var FileReader = require('dw/io/FileReader');
        var fileReader = new FileReader(file, options.encoding);

        try {
            callback(fileReader, file);
        } catch (e) {
            intStatus = formatError('005',
                'Error occurred in callback function (method getFileReader). Error: ',
                e);
        }
        fileReader.close();
    });

    return intStatus || status;
};

/**
 * Callback used by getFileWriter
 * @callback fileWriterCallback
 * @param {dw.io.FileWriter} fileWriter instance of fileWriter
 *    (fileWriter will be closed after run callback)
 * @param {dw.io.File} file
 * @return {undefined}
 */

/**
 * Open file in write mode
 * and if success then run callback with fileWriter as first argument
 *
 * @param  {string}  name path and filename to file relatively to IMPEX by default
 * @param  {Object}  [options] configuration
 * @param  {boolean} [options.createFile=true] create file
 * @param  {string}  [options.encoding='UTF-8'] encoding of file
 * @param  {boolean} [options.append=false] append data to end of file
 * @param  {string}  [options.rootDir=IMPEX] root directory for filenames
 * @param  {fileReaderCallback} callback
 * @return {dw.system.Status} Status
 */
exports.getFileWriter = function getFileWriter(name, options, callback) {
    var defaults = {
        append: false,
        encoding: 'UTF-8',
        createFile: true
    };
    var status;
    var intStatus;

    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    options = extend(defaults, options);

    status = exports.getFile(name, options, function (file) {
        var FileWriter = require('dw/io/FileWriter');
        var fileWriter = new FileWriter(file, options.encoding, options.append);

        try {
            callback(fileWriter, file);
        } catch (e) {
            intStatus = formatError('007',
                'Error occurred in callback function (method getFileWriter). Error: ',
                e);
        }
        fileWriter.close();
    });

    return intStatus || status;
};
/**
 * Callback used by getCSVStreamReader
 *
 * @callback CSVStreamReaderCallback
 * @param {dw.io.CSVStreamReader} csvStreamReader instance of CSVStreamReader
 *    (csvStreamReader will be closed after callback is done)
 * @param {dw.io.FileReader} fileReader instance of FileReader
 *    (fileReader will be closed after callback is done)
 * @param {dw.io.File} file
 * @return {undefined}
 */

/**
 * Open csv file as stream in read mode
 * and if success then run callback with csvStreamReader as first argument
 *
 * @param  {string}  name path and filename to file relatively to IMPEX by default
 * @param  {Object}  [options] configuration
 * @param  {boolean} [options.createFile=false] create file
 * @param  {string}  [options.encoding='UTF-8'] encoding of file
 * @param  {boolean} [options.append=false] append data to end of file
 * @param  {string}  [options.rootDir=IMPEX] root directory for filenames
 * @param  {string}  [options.separator=','] separator of columns in file
 * @param  {string}  [options.quote='"'] represent quotes in rows
 * @param  {number}  [options.skip=0] represend how many line should be skipped
 * @param  {CSVStreamReaderCallback} callback
 * @return {dw.system.Status} Status
 */
exports.getCSVStreamReader = function getCSVStreamReader(name, options, callback) {
    var defaults = {
        separator: ',',
        quote: '"',
        skip: 0
    };
    var status;
    var intStatus;

    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    options = extend(defaults, options);
    status = exports.getFileReader(name, options, function (fileReader, file) {
        var CSVStreamReader = require('dw/io/CSVStreamReader');
        var streamReader = new CSVStreamReader(fileReader, options.separator, options.quote, options.skip);

        try {
            callback(streamReader, fileReader, file);
        } catch (e) {
            intStatus = formatError('008',
                'Error occurred in callback function (method getCSVStreamReader). Error: ',
                e);
        }
        streamReader.close();
    });

    return intStatus || status;
};
/**
 * Callback used by getCSVStreamWriter
 *
 * @callback CSVStreamWriterCallback
 * @param {dw.io.CSVStreamWriter} csvStreamReader instance of CSVStreamWriter
 *    (csvStreamReader will be closed after callback is done)
 * @param {dw.io.FileWriter} fileWriter instance of FileWriter
 *    (fileReader will be closed after callback is done)
 * @param {dw.io.File} file
 * @return {undefined}
 */

/**
 * Open csv file as stream in write mode
 * and if success then run callback with csvStreamWriter as first argument
 *
 * @param  {string}  name path and filename to file relatively to IMPEX by default
 * @param  {Object}  [options] configuration
 * @param  {boolean}  [options.createFile=true] create file
 * @param  {string}   [options.encoding='UTF-8'] encoding of file
 * @param  {boolean}  [options.append=false] append data to end of file
 * @param  {string}   [options.rootDir=IMPEX] root directory for filenames
 * @param  {string}   [options.separator=','] separator of columns in file
 * @param  {string}   [options.quote='"'] represent quotes in rows
 * @param  {CSVStreamWriterCallback} callback
 * @return {dw.system.Status} Status
 */
exports.getCSVStreamWriter = function getCSVStreamWriter(name, options, callback) {
    var defaults = {
        separator: ',',
        quote: '"'
    };
    var status;
    var intStatus;

    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    options = extend(defaults, options);
    status = exports.getFileWriter(name, options, function (fileWriter, file) {
        var CSVStreamWriter = require('dw/io/CSVStreamWriter');
        var streamWriter = new CSVStreamWriter(fileWriter, options.separator, options.quote);

        try {
            callback(streamWriter, fileWriter, file);
        } catch (e) {
            intStatus = formatError('006',
                'Error occurred in callback function (method getCSVStreamWriter). Error: ',
                e);
        }
        streamWriter.close();
    });

    return intStatus || status;
};
/**
 * Callback used by getXMLStreamReader
 *
 * @callback XMLStreamReaderCallback
 * @param {dw.io.XMLStreamReader} xmlStreamReader instance of XMLStreamReader
 *    (csvStreamReader will be closed after callback is done)
 * @param {dw.io.FileReader} fileReader instance of FileReader
 *    (fileReader will be closed after callback is done)
 * @param {dw.io.File} file
 * @return {undefined}
 */

/**
 * Open xml file as stream in read mode
 * and if success then run callback with csvStreamReader as first argument
 *
 * @param  {String}  name path and filename to file relatively to IMPEX by default
 * @param  {Object}  [options] configuration
 * @param  {Boolean} [options.createFile=false] create file
 * @param  {String}  [options.encoding='UTF-8'] encoding of file
 * @param  {Boolean} [options.append=false] append data to end of file
 * @param  {String}  [options.rootDir=IMPEX] root directory for filenames
 * @param  {XMLStreamReaderCallback} callback
 * @return {dw.system.Status} Status
 */

exports.getXMLStreamReader = function getXMLStreamReader(name, options, callback) {
    var status;
    var intStatus;
    var defaults = {};

    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    options = extend(defaults, options);
    status = exports.getFileReader(name, options, function (fileWriter, file) {
        var XMLStreamReader = require('dw/io/XMLStreamReader');
        var streamReader = new XMLStreamReader(fileWriter);

        try {
            callback(streamReader, fileWriter, file);
        } catch (e) {
            intStatus = formatError('009',
                'Error occurred in callback function (method getXMLStreamReader). Error: ',
                e);
        }
        streamReader.close();
    });

    return intStatus || status;
};

/**
 * Callback used by getXMLStreamWriter
 *
 * @callback XMLStreamWriterCallback
 * @param {dw.io.XMLStreamWriter} xmlStreamWriter instance of XMLStreamWriter
 *    (xmlStreamReader will be closed after callback is done)
 * @param {dw.io.FileWriter} fileWriter instance of FileWriter
 *    (fileReader will be closed after callback is done)
 * @param {dw.io.File} file
 * @return {undefined}
 */

/**
 * Open xml file as stream in write mode
 * and if success then run callback with xmlStreamWriter as first argument
 *
 * @param  {string}  name path and filename to file relatively to IMPEX by default
 * @param  {Object}  [options] configuration
 * @param  {boolean}  [options.createFile=true] create file
 * @param  {string}   [options.encoding='UTF-8'] encoding of file
 * @param  {boolean}  [options.append=false] append data to end of file
 * @param  {string}   [options.rootDir=IMPEX] root directory for filenames
 * @param  {XMLStreamWriterCallback} callback
 * @return {dw.system.Status} Status
 */
exports.getXMLStreamWriter = function getXMLStreamWriter(name, options, callback) {
    var status;
    var intStatus;
    var defaults = {};

    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    options = extend(defaults, options);
    status = exports.getFileWriter(name, options, function (fileWriter, file) {
        var XMLStreamWriter = require('dw/io/XMLStreamWriter');
        var streamWriter = new XMLStreamWriter(fileWriter);

        try {
            callback(streamWriter, fileWriter, file);
        } catch (e) {
            intStatus = formatError('010',
                'Error occurred in callback function (method getXMLStreamWriter). Error: ',
                e);
        }
        streamWriter.close();
    });

    return intStatus || status;
};

exports.mockEntry = function (name, newValue) {
    switch (name) {
        case 'require':
            require = newValue;
            break;

        case 'File':
            File = newValue;
            break;

        case 'Status':
            Status = newValue;
            break;
    }
};

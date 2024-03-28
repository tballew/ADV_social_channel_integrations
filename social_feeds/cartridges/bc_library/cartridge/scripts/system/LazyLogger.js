'use strict';

/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */

var Logger = require('dw/system/Logger');
var LazyLog = require('/bc_library/cartridge/scripts/system/LazyLog.ds').LazyLog;

/**
 * @constructor LazyLogger
 *
 * @author Robert Pemsel
 *
 * An Adapter for the dw.sytem.Logger class which implements all methods provided by the dw.system.Logger class.
 * It enhances the original class with methods which can be used to log erros caught in a try catch
 * block. Each error is logged with its accompanied message, stack and the name of the file in which the error was caught.
 */

var LazyLogger = function () {
};

/**
 * @function debugException
 * @memberof LazyLogger
 *
 * Logs an error caught in a try catch block inclusive the error message, stacktrace and file in which the error occured plus
 * a custom message
 *
 * @param {!string} msg Message to be logged
 * @param {Error=} error error caught in a try catch block
 * @returns {void}
 */
LazyLogger.debugException = function (msg, error) {
    var args = Array.prototype.slice.call(arguments, 2);
    var debugMessage = msg;

    if (!empty(error)) {
        debugMessage += error.fileName + ': ' + debugMessage + ' ' + error.message + '\n' + error.stack;
    }

    return Logger.debug(debugMessage, args);
};

/**
 * @function infoException
 * @memberof LazyLogger
 *
 * Logs an error caught in a try catch block inclusive the error message, stacktrace and file in which the error occured plus
 * a custom message
 *
 * @param {!string} msg Message to be logged
 * @param {Error=} error error caught in a try catch block
 * @returns {void}
 */
LazyLogger.infoException = function (msg, error) {
    var args = Array.prototype.slice.call(arguments, 2);
    var infoMessage = msg;

    if (!empty(error)) {
        infoMessage += error.fileName + ': ' + infoMessage + ' ' + error.message + '\n' + error.stack;
    }

    return Logger.info(infoMessage, args);
};

/**
 * @function warnException
 * @memberof LazyLogger
 *
 * Logs an error caught in a try catch block inclusive the error message, stacktrace and file in which the error occured plus
 * a custom message
 *
 * @param {!string} msg Message to be logged
 * @param {Error=} error error caught in a try catch block
 * @returns {void}
 */
LazyLogger.warnException = function (msg, error) {
    var args = Array.prototype.slice.call(arguments, 2);
    var warnMessage = msg;

    if (!empty(error)) {
        warnMessage += error.fileName + ': ' + warnMessage + ' ' + error.message + '\n' + error.stack;
    }

    return Logger.warn(warnMessage, args);
};

/**
 * @function errorException
 * @memberof LazyLogger
 *
 * Logs an error caught in a try catch block inclusive the error message, stacktrace and file in which the error occured plus
 * a custom message
 *
 * @param {!string} msg Message to be logged
 * @param {Error=} error error caught in a try catch block
 * @returns {void}
 */
LazyLogger.errorException = function (msg, error) {
    var args = Array.prototype.slice.call(arguments, 2);
    var errorMessage = msg;

    if (!empty(error)) {
        errorMessage = error.fileName + ': ' + errorMessage + ' ' + error.message + '\n' + error.stack;
    }

    return Logger.error(errorMessage, args);
};

/**
 * @function fatalException
 * @memberof LazyLogger
 *
 * Logs an error caught in a try catch block inclusive the error message, stacktrace and file in which the error occured plus
 * a custom message
 *
 * @param {!string} msg Message to be logged
 * @param {Error=} error error caught in a try catch block
 * @returns {void}
 */
LazyLogger.fatalException = function (msg, error) {
    var args = Array.prototype.slice.call(arguments, 2);
    var errorMessage = msg;

    if (!empty(error)) {
        errorMessage += error.fileName + ': ' + errorMessage + ' ' + error.message + '\n' + error.stack;
    }

    return Logger.fatal(errorMessage, args);
};

var _lazyPropDefiner = {
    get debugEnabled() {
        return Logger.debugEnabled;
    },

    get errorEnabled() {
        return Logger.errorEnabled;
    },

    get infoEnabled() {
        return Logger.infoEnabled;
    },

    get rootLogger() {
        return Logger.rootLogger;
    },

    get warnEnabled() {
        return Logger.warnEnabled;
    }
};

LazyLogger.debugEnabled = _lazyPropDefiner.debugEnabled;
LazyLogger.errorEnabled = _lazyPropDefiner.errorEnabled;
LazyLogger.infoEnabled = _lazyPropDefiner.infoEnabled;
LazyLogger.rootLogger = _lazyPropDefiner.rootLogger;
LazyLogger.warnEnabled = _lazyPropDefiner.warnEnabled;

LazyLogger.debug = function (msg) {
    var args = Array.prototype.slice.call(arguments, 1);

    return Logger.debug(msg, args);
};

LazyLogger.error = function (msg) {
    var args = Array.prototype.slice.call(arguments, 1);

    return Logger.error(msg, args);
};

LazyLogger.fatal = function (msg) {
    var args = Array.prototype.slice.call(arguments, 1);

    return Logger.fatal(msg, args);
};

LazyLogger.info = function (msg) {
    var args = Array.prototype.slice.call(arguments, 1);

    return Logger.info(msg, args);
};

LazyLogger.isDebugEnabled = function () {
    return Logger.isDebugEnabled();
};

LazyLogger.isErrorEnabled = function () {
    return Logger.isErrorEnabled();
};

LazyLogger.isInfoEnabled = function () {
    return Logger.isInfoEnabled();
};

LazyLogger.isWarnEnabled = function () {
    return Logger.isWarnEnabled();
};

LazyLogger.warn = function (msg) {
    var args = Array.prototype.slice.call(arguments, 1);

    return Logger.warn(msg, args);
};

LazyLogger.getRootLogger = function () {
    return new LazyLog(Logger.getRootLogger());
};

LazyLogger.getLogger = function () {
    return new LazyLog(Logger.getLogger(arguments));
};

if (typeof (exports) !== 'undefined') {
    exports.LazyLogger = LazyLogger;
}

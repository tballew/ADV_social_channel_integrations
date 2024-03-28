'use strict';

/* global Log */

/**
* @constructor LazyLog
*
* @author Robert Pemsel
*
* An Adapter for the dw.sytem.Log class which implements all methods provided by the dw.system.Log class.
* It enhances the original class with methods which can be used to log erros caught in a try catch
* block. Each error is logged with its accompanied message, stack and the name of the file in which the error was caught.
*/

var LazyLog = function (log) {
    this.log = log;
    this.debugEnabled = this.log.debugEnabled;
    this.errorEnabled = this.log.errorEnabled;
    this.infoEnabled = this.log.infoEnabled;
    this.NDC = this.log.NDC;
    this.warnEnabled = this.log.warnEnabled;
};

/**
 * @function debugException
 * @memberof LazyLog
 *
 * Logs an error caught in a try catch block inclusive the error message, stacktrace and file in which the error occured plus
 * a custom message
 *
 * @param {!string} msg Message to be logged
 * @param {Error=} error error caught in a try catch block
 * @returns {void}
*/
LazyLog.prototype.debugException = function (msg, error) {
    var args = Array.prototype.slice.call(arguments, 2);
    var debugMessage = msg;

    if (!empty(error)) {
        debugMessage += error.fileName + ': ' + debugMessage + ' ' + error.message + '\n' + error.stack;
    }

    return this.log.debug(debugMessage, args);
};

/**
 * @function infoException
 * @memberof LazyLog
 *
 * Logs an error caught in a try catch block inclusive the error message, stacktrace and file in which the error occured plus
 * a custom message
 *
 * @param {!string} msg Message to be logged
 * @param {Error=} error error caught in a try catch block
 * @returns {void}
*/
LazyLog.prototype.infoException = function (msg, error) {
    var args = Array.prototype.slice.call(arguments, 2);
    var infoMessage = msg;

    if (!empty(error)) {
        infoMessage += error.fileName + ': ' + infoMessage + ' ' + error.message + '\n' + error.stack;
    }

    return this.log.info(infoMessage, args);
};

/**
 * @function warnException
 * @memberof LazyLog
 *
 * Logs an error caught in a try catch block inclusive the error message, stacktrace and file in which the error occured plus
 * a custom message
 *
 * @param {!string} msg Message to be logged
 * @param {Error=} error error caught in a try catch block
 * @returns {void}
 */
LazyLog.prototype.warnException = function (msg, error) {
    var args = Array.prototype.slice.call(arguments, 2);
    var warnMessage = msg;

    if (!empty(error)) {
        warnMessage += error.fileName + ': ' + warnMessage + ' ' + error.message + '\n' + error.stack;
    }

    return this.log.warn(warnMessage, args);
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
LazyLog.prototype.errorException = function (msg, error) {
    var args = Array.prototype.slice.call(arguments, 2);
    var errorMessage = msg;

    if (!empty(error)) {
        errorMessage = error.fileName + ': ' + errorMessage + ' ' + error.message + '\n' + error.stack;
    }

    return this.log.error(errorMessage, args);
};

/**
 * @function fatalException
 * @memberof LazyLog
 *
 * Logs an error caught in a try catch block inclusive the error message, stacktrace and file in which the error occured plus
 * a custom message
 *
 * @param {!string} msg Message to be logged
 * @param {Error=} error error caught in a try catch block
 * @returns {void}
*/
LazyLog.prototype.fatalException = function (msg, error) {
    var args = Array.prototype.slice.call(arguments, 2);
    var errorMessage = msg;

    if (!empty(error)) {
        errorMessage += error.fileName + ': ' + errorMessage + ' ' + error.message + '\n' + error.stack;
    }

    return this.log.fatal(errorMessage, args);
};

LazyLog.prototype.getNDC = function () {
    return Log.getNDC();
};

LazyLog.prototype.debug = function (msg) {
    var args = Array.prototype.slice.call(arguments, 1);

    this.log.debug(msg, args);
};

LazyLog.prototype.error = function (msg) {
    var args = Array.prototype.slice.call(arguments, 1);

    this.log.error(msg, args);
};

LazyLog.prototype.fatal = function (msg) {
    var args = Array.prototype.slice.call(arguments, 1);

    this.log.fatal(msg, args);
};

LazyLog.prototype.info = function (msg) {
    var args = Array.prototype.slice.call(arguments, 1);

    this.log.info(msg, args);
};

LazyLog.prototype.warn = function (msg) {
    var args = Array.prototype.slice.call(arguments, 1);

    this.log.warn(msg, args);
};

LazyLog.prototype.isDebugEnabled = function () {
    return this.log.isDebugEnabled();
};

LazyLog.prototype.isErrorEnabled = function () {
    return this.log.isErrorEnabled();
};

LazyLog.prototype.isInfoEnabled = function () {
    return this.log.isInfoEnabled();
};

LazyLog.prototype.isWarnEnabled = function () {
    return this.log.isInfoEnabled();
};

if (typeof (exports) !== 'undefined') {
    exports.LazyLog = LazyLog;
}

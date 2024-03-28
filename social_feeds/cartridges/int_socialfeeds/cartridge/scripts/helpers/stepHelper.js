'use strict';

/**
 * @description Returns true if the given {parameters} object contains a isDisabled
 * property as true. This will allow us to disable a step without removing it from
 * the configuration of the job
 *
 * @param {Object} parameters The parameters from the job configuration.
 * @param {boolean} parameters.IsDisabled Describes if the jobStep should be disabled
 * @returns {boolean} Returns true if the jobStep is enabled; false if disabled
 */
module.exports.isDisabled = function (parameters) {
    if (!parameters) {
        return false;
    }
    return ['true', true].indexOf(parameters.IsDisabled) > -1;
};

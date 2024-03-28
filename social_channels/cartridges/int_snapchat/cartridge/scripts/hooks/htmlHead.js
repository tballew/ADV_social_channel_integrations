'use strict';

/**
 * Render the pixel code from Snapchat
 *
 * @param {Object} pdict The pdict coming from the htmlHead template
 *
 * @returns {String} The rendered template that shows the pixel if the pixel code is already setup
 */
module.exports.htmlHead = function (pdict) {
    var HashMap = require('dw/util/HashMap');
    var Template = require('dw/util/Template');
    var customObjectHelper = require('~/cartridge/scripts/customObjectHelper');
    var snapchatSettings = customObjectHelper.getCustomObject();

    if (empty(snapchatSettings.custom.pixelCode)) {
        return '';
    }

    var model = new HashMap();
    !empty(pdict.CurrentCustomer) && pdict.CurrentCustomer.authenticated ? model.put('email', pdict.CurrentCustomer.profile.email) : model.put('email', '');
    model.put('pixelCode', snapchatSettings.custom.pixelCode);
    return new Template('/snapchatPixel').render(model).text;
};

'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Currency = require('dw/util/Currency');
var Site = require('dw/system/Site');

/**
 * @function
 * @description Gets the social categories and the feed objects for the given social feed.
 * @param {Object} dataSocialFeed - The social feed configuration object
 * @returns {Object} - The social categories and the feed objects
 */
function getSocialCategoryFeed(dataSocialFeed) {
    var customFeedObjectIdList = [];
    var socialCategories = [];

    if (dataSocialFeed.CustomObjectIds) {
        customFeedObjectIdList = dataSocialFeed.CustomObjectIds.split(',');
    }

    for (var idx = 0; idx < customFeedObjectIdList.length; idx++) {
        var co = CustomObjectMgr.getCustomObject('SalesChannelFeedConfig', customFeedObjectIdList[idx]);
        var socialCategory = co != null && co.custom.socialCategory ? co.custom.socialCategory : null;

        if (socialCategory && Object.hasOwnProperty.call(socialCategory, 'value') && socialCategory.value) {
            socialCategories.push(socialCategory.value);
        } else if (socialCategory) {
            socialCategories.push(socialCategory);
        }
    }

    return socialCategories;
}

/**
 * @function
 * @description Gets the locales for the given social category.
 * @param {Object} data - The social feed configuration object
 * @returns {Object} - The locales for the given social category
 */
function getLocalesForSocialCategory(data) {
    var socialCategory = getSocialCategoryFeed(data);

    if (socialCategory.indexOf('SocialChannelGoogle') > -1) {
        return Site.getCurrent().getAllowedLocales();
    }
    return null;
}

/**
 * @function
 * @description Gets the currency for the given locale.
 * @param {string} localeId - The locale id
 * @returns {Object} - The currency for the given locale
 */
function getCurrencyFromLocale(localeId) {
    var countries = require('*/cartridge/config/countries.json');
    var currency = null;

    if (localeId === 'default') {
        return Currency.getCurrency(Site.getCurrent().getDefaultCurrency());
    }

    for (var idx = 0; idx < countries.length; idx++) {
        if (countries[idx].id === localeId) {
            currency = Currency.getCurrency(countries[idx].currencyCode);
            break;
        }
    }

    return currency;
}

/**
 * @function
 * @description Sets the session for the given locale.
 * @param {string} localeId - The locale id
 * @returns {boolean} - The result of the session setting
 */
function setSessionForLocale(localeId) {
    if (!localeId) return false;
    var currency = getCurrencyFromLocale(localeId);
    if (request.setLocale(localeId) && currency) {
        request.session.setCurrency(currency);
        return true;
    }
    return false;
}

module.exports = {
    getLocalesForSocialCategory: getLocalesForSocialCategory,
    setSessionForLocale: setSessionForLocale
};

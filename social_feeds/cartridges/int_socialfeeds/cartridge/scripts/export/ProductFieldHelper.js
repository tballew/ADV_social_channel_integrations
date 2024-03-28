'use strict';

const CATEGORY_ATTRIBUTE = {
    ID: 'ID',
    NAME: 'displayName'
};

// object for storing data about excluded categories;
// tip: this object can be used for DEBUG
// let excludedCategoriesCache = {};
// const jsObjectSizeQuotaLimit = 1500;

/**
 * Helper function for getting category path as an array.
 *
 * @param {dw.catalog.Category} category Category to get parents from.
 * @param {string} categoryAttribute Attribute which will be collected.
 * @param {boolean} keepOrder Whether to keep categories order.
 * @param {string} locale current locale
 * @param {string} pid product id
 * @returns {array} Categories path as an array.
 */
function getCategoryPath(
    category,
    categoryAttribute,
    keepOrder,
    locale,
    pid
) {
    let categories = [];
    const attribute = categoryAttribute || CATEGORY_ATTRIBUTE.NAME;

    if (!category.root && category.isOnline()) {
        categories.push(category[attribute]);

        if (category.parent) {
            categories = categories.concat(getCategoryPath(category.parent, attribute, true, locale, pid));
        }
    }

    return keepOrder ? categories : categories.reverse();
}

/**
 * Helper function for getting category path as an array.
 *
 * @param {dw.catalog.Product} product Product to get categories from.
 * @param {string} categoryAttribute Attribute which will be collected.
 * @param {string} separator to join the categories.
 * @param {string} locale current locale
 * @returns {array} Categories paths as an array.
 */
function getCategoriesAttribute(
    product,
    categoryAttribute,
    separator,
    locale
) {
    const masterProduct = product.isMaster() ? product : product.getVariationModel().getMaster();
    const categoryPaths = (masterProduct || product).getOnlineCategories().toArray().reduce(function (paths, category) {
        const categoryPath = getCategoryPath(
            category,
            categoryAttribute,
            false,
            locale,
            (masterProduct || product).ID
        ).join(separator);

        if (categoryPath) {
            paths.push(categoryPath);
        }

        return paths;
    }, []);

    return categoryPaths;
}

/**
 * Helper function for getting SEO URL.
 *
 * @param {dw.catalog.Product} product Product to get categories from.
 * @param {string} locale current locale
 * @returns {string} SEO URL.
 */
function getURLSEO(product, locale) {
    const Site = require('dw/system/Site');
    const URLAction = require('dw/web/URLAction');
    const URLUtils = require('dw/web/URLUtils');
    const URLParameter = require('dw/web/URLParameter');
    const currentSiteID = Site.getCurrent().getID();
    // const locale = this.currentFeedLocale ? dw.util.Locale.getLocale(this.currentFeedLocale) : dw.util.Locale.getLocale(dw.system.Site.getCurrent().defaultLocale);
    const action = new URLAction('Product-Show', currentSiteID, locale.ID);

    let url = '';
    let colorValue = '';
    let colorAttributeHtmlName = '';
    let sizeValue = '';
    let sizeAttributeHtmlName = '';

    const variationModel = product.getVariationModel();
    const masterProduct = product.isMaster ? product : variationModel.getMaster();
    const colorAttribute = variationModel.getProductVariationAttribute('color');
    const sizeAttribute = variationModel.getProductVariationAttribute('size');

    if (!empty(colorAttribute)) {
        let color = variationModel.getSelectedValue(colorAttribute);
        colorAttributeHtmlName = variationModel.getHtmlName(colorAttribute);
        if (!empty(color)) {
            colorValue = color.getValue();
        }
    }
    if (!empty(sizeAttribute)) {
        let size = variationModel.getSelectedValue(sizeAttribute);
        sizeAttributeHtmlName = variationModel.getHtmlName(sizeAttribute);
        if (!empty(size)) {
            sizeValue = size.getValue();
        }
    }

    if (!empty(colorValue) && !empty(sizeValue)) {
        url = URLUtils.https(
            action,
            new URLParameter('pid', masterProduct.ID),
            new URLParameter(colorAttributeHtmlName, colorValue),
            new URLParameter(sizeAttributeHtmlName, sizeValue)
        );
    } else if (!empty(colorValue)) {
        url = URLUtils.https(
            action,
            new URLParameter('pid', masterProduct.ID),
            new URLParameter(colorAttributeHtmlName, colorValue)
        );
    } else if (!empty(sizeValue)) {
        url = URLUtils.https(
            action,
            new URLParameter('pid', masterProduct.ID),
            new URLParameter(sizeAttributeHtmlName, sizeValue)
        );
    } else {
        url = URLUtils.https(
            action,
            new URLParameter('pid', masterProduct.ID)
        );
    }
    // TO-DO: Localization
    // const DomainCountriesType = 'DomainCountries';
    // const DomainCountryCO = CustomObjectMgr.getCustomObject(DomainCountriesType, locale.country);
    // let host = DomainCountryCO.custom.hostname;
    let host = 'refarch.com';
    url = url.host(host);

    return url.toString();
}

module.exports = {
    getCategoryPath: getCategoryPath,
    getCategoriesAttribute: getCategoriesAttribute,
    getURLSEO: getURLSEO
};

'use strict';

/**
 * @module controllers/BMCustomFeeds
 */

var boguard = require('bc_library/cartridge/scripts/boguard');
var ISML = require('dw/template/ISML');

/**
 * render product feed main page
 */
function start() {
    ISML.renderTemplate('feeds/productFeedMain.isml');
}

/**
 * render preview for specified object id (pid) and template id (feed)
 */
function preview() {
    var Site = require('dw/system/Site');
    request.setLocale(Site.getCurrent().defaultLocale);
    var feedPreview = require('~/cartridge/scripts/customobject/FeedPreviews');
    ISML.renderTemplate('data/preview.isml', { Preview: feedPreview.GeneratePreview() });
}

/**
 * render data for all sites
 */
function getAllSites() {
    var Site = require('dw/system/Site');
    var Response = require('bc_library/cartridge/scripts/util/Response');

    var allSites = Site.getAllSites();
    var sites = [];
    for (let i = 0; i < allSites.length; i++) {
        var availableSite = allSites[i];
        var site = {};
        site.id = availableSite.ID;
        site.name = availableSite.name;
        sites.push(site);
    }
    Response.renderJSON(sites);
}

/**
 * Redirect users to the product edit screen
 * @returns {string} An url redirect value
 */
function productDeeplink() {
    var CSRFProtection = require('dw/web/CSRFProtection');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');
    var csrfToken = CSRFProtection.generateToken();

    if (Site.getCurrent() == null || Site.getCurrent().ID === 'Sites-Site') {
        return response.redirect(URLUtils.url('ViewApplication-SelectSite', 'csrf_token', csrfToken).toString());
    }

    var pid = request.httpParameterMap.pid.stringValue;
    var product = !empty(pid) ? ProductMgr.getProduct(pid) : null;

    if (!empty(product)) {
        return response.redirect(URLUtils.url('ViewProduct_52-Edit', 'ProductID', product.UUID, 'csrf_token', csrfToken).toString());
    }

    return response.redirect(URLUtils.url('ViewProductList_52-List', 'csrf_token', csrfToken).toString());
}

exports.Start = boguard.ensure(['https', 'get'], start);
exports.Preview = boguard.ensure(['https', 'get'], preview);
exports.GetAllSites = boguard.ensure(['https', 'get'], getAllSites);
exports.ProductDeeplink = boguard.ensure(['https', 'get'], productDeeplink);

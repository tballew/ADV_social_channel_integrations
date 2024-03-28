'use strict';

var Status = require('dw/system/Status');

/**
 * Generate Category/Subcategory List for file
 * @param {CategoryId} categoryId to get list of subcategories
 * @returns {CategoriesList} categoy subcategory list.
 */
function writeCSV(categoryId) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var ArrayList = require('dw/util/ArrayList');
    var categoriesList = new ArrayList();
    var category = CatalogMgr.getCategory(categoryId);
    if (empty(category)) {
        return categoriesList;
    }
    categoriesList.add(category);
    if (category.hasOnlineSubCategories()) {
        categoriesList.addAll(category.getOnlineSubCategories());
    }
    for (var i = 0, ilen = categoriesList.length; i < ilen; i++) {
        if (categoriesList[i].hasOnlineSubCategories()) {
            if (categoriesList[i] !== category) {
                categoriesList.addAll(categoriesList[i].getOnlineSubCategories());
            }
        }
    }
    return categoriesList;
}

/**
 * @param {Object} params Job execution arguments (defined paramenters for job component).
 * @returns {Status} File is successfully generated.
 * Generate Category/Subcategory URL Generation Feed Text File
*/
function generateFile(params) {
    var FileWriter = require('dw/io/FileWriter');
    var StringUtils = require('dw/util/StringUtils');
    var Site = require('dw/system/Site');
    var Calendar = require('dw/util/Calendar');
    var File = require('dw/io/File');
    var URLUtils = require('dw/web/URLUtils');
    var CSVStreamWriter = require('dw/io/CSVStreamWriter');
    var currentSiteID = Site.getCurrent().getID();
    var URLAction = require('dw/web/URLAction');
    var URLParameter = require('dw/web/URLParameter');
    var exportFileWriter;
    try {
        var fileName = StringUtils.formatCalendar(new Calendar(new Date()), 'YYYYMMDD');
        fileName = fileName + '_' + currentSiteID + '_Exported_Category_URLs.csv';
        var IMPEX_FEEDS_PATH = params.impexPath;
        if (empty(IMPEX_FEEDS_PATH)) {
            IMPEX_FEEDS_PATH = File.SEPARATOR + 'src' + File.SEPARATOR + 'feeds' + File.SEPARATOR + 'custom' + File.SEPARATOR + 'category';
        }
        // Make sure our directory exist in the import/export root directory.
        (new File(File.IMPEX + IMPEX_FEEDS_PATH)).mkdirs();
        var file = new File(File.IMPEX + IMPEX_FEEDS_PATH + fileName);
        var writer = new FileWriter(file);
        exportFileWriter = new CSVStreamWriter(writer);
        var headers = 'Catgory_URLs';
        exportFileWriter.writeNext(headers);
        var locales = params.siteLocale;
        locales = locales.split(',');
        var locale = '';
        var action = '';
        var categoryIds = null;
        var currentSite = require('dw/system/Site').getCurrent();
        var categoryIdsRaw = currentSite.getCustomPreferenceValue('categoryIDsToExport');
        if (!empty(categoryIdsRaw)) {
            categoryIds = categoryIdsRaw.split(',');
        }
        if (categoryIds !== null) {
            for (var j = 0, jlen = categoryIds.length; j < jlen; j++) {
                var categoriesList = writeCSV(categoryIds[j]);
                for (var l = 0, leng = locales.length; l < leng; l++) {
                    locale = locales[l];
                    action = new URLAction('Search-Show', currentSiteID, locale);
                    for (var k = 0, klen = categoriesList.length; k < klen; k++) {
                        exportFileWriter.writeNext(URLUtils.abs(action, new URLParameter('cgid', categoriesList[k].ID)));
                    }
                }
            }
        }
    } catch (e) {
        var Logger = require('dw/system/Logger').getLogger('GlobalFeedExport');
        Logger.error('categoryURLExport.js: ' + e.message);
        return new Status(Status.ERROR, 'Failed to export category URLs data.');
    } finally {
        if (exportFileWriter) {
            exportFileWriter.close();
        }
    }
    return new Status(Status.OK, 'Successfully export Category URLs data.');
}

module.exports = {
    generateFile: generateFile
};

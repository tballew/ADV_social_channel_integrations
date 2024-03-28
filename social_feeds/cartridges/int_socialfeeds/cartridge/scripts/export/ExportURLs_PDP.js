'use strict';

/**
 * @returns {result} The SitePreference value.
 * @param {string} key Job execution arguments (defined paramenters for job component).
 */
function getSitePreference(key) {
    let result = null;
    const Site = require('dw/system/Site');
    result = Site.getCurrent().getCustomPreferenceValue(key);
    if (empty(result)) {
        result = '';
    }
    return result;
}

/**
 * @param {Object} params Job execution arguments (defined paramenters for job component).
 * @returns {SitePreference} The SitePreference.
 * Generate PDP URL Generation Feed Text File
*/
function generateFile(params) {
    let exportFileWriter;
    const FileWriter = require('dw/io/FileWriter');
    const Status = require('dw/system/Status');
    const StringUtils = require('dw/util/StringUtils');
    const Site = require('dw/system/Site');
    const Calendar = require('dw/util/Calendar');
    const Logger = require('dw/system/Logger');
    const File = require('dw/io/File');
    const URLAction = require('dw/web/URLAction');
    const URLUtils = require('dw/web/URLUtils');
    const CSVStreamWriter = require('dw/io/CSVStreamWriter');
    const URLParameter = require('dw/web/URLParameter');
    const currentSiteID = Site.getCurrent().getID();
    try {
        let fileName = StringUtils.formatCalendar(new Calendar(new Date()), 'YYYYMMDD');
        fileName = fileName + '_' + Site.current.ID + '_Exported_PDP_URLs.csv';
        let locales = params.siteLocale;
        let IMPEX_FEEDS_PATH = params.impexPath;
        let action = '';
        if (empty(IMPEX_FEEDS_PATH)) {
            IMPEX_FEEDS_PATH = '/src/feeds/custom/catalogs/';
        }
        // Make sure our directory exist in the import/export root directory.
        (new File(File.IMPEX + IMPEX_FEEDS_PATH)).mkdirs();
        let file = new File(File.IMPEX + IMPEX_FEEDS_PATH + fileName);
        let writer = new FileWriter(file);
        exportFileWriter = new CSVStreamWriter(writer);
        let headers = 'PDP_URLs';
        exportFileWriter.writeNext(headers);
        let productIds = getSitePreference('productIds').split(',');
        locales = locales.split(',');
        let prodid = '';
        let locale = '';
        let url = '';
        for (let i = 0, len = productIds.length; i < len; i++) {
            prodid = productIds[i];
            for (let j = 0, leng = locales.length; j < leng; j++) {
                locale = locales[j];
                action = new URLAction('Product-Show', currentSiteID, locale);
                url = URLUtils.https(
                    action,
                    new URLParameter('pid', prodid));
                let exportWriter = url;
                exportFileWriter.writeNext(exportWriter);
            }
        }
    } catch (e) {
        Logger.error('ExportURLs_PDP.js: ' + e.message);
        return new Status(Status.ERROR, 'Failed to export PDP URLs data.');
    } finally {
        if (exportFileWriter) {
            exportFileWriter.close();
        }
    }

    return new Status(Status.OK, 'Successfully export PDP URLs data.');
}

module.exports = {
    generateFile: generateFile
};

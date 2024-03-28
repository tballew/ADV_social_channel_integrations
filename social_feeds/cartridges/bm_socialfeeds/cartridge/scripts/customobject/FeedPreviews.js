'use strict';

/**
 * create configuration object
 * @param {Object} co - feed configuration custom object
 * @returns {Object} config object
 */
function readConfigurationFromCustomObject(co) {
    const Reader = require('dw/io/Reader');
    var lines = new Reader(co.custom.configuration);
    var configSeparator = /,(?![^="]*")/;
    var config = {
        separator: configSeparator
    };
    var line;

    // eslint-disable-next-line no-cond-assign
    while ((line = lines.readLine()) != null) {
        if (line.indexOf('separator ') === 0) {
            config.separator = line.substring(10);
        } else if (!config.fields) {
            // use first line as fields
            config.fields = line.split(configSeparator);
        } else if (!config.header) {
            // if there are more lines, we previously read the header
            config.header = config.fields;
            config.fields = line.split(configSeparator);
        }
    }

    return config;
}

/**
 * feeds preview module generates sample feed. It is used in UI
 * @returns {string} feed preview
 */
function generatePreview() {
    const CustomObjectMgr = require('dw/object/CustomObjectMgr');
    const StringWriter = require('dw/io/StringWriter');
    const System = require('dw/system/System');
    const CSVExportHandler = require('int_socialfeeds/cartridge/scripts/export/handlers/CSVExportHandler.ds').CSVExportHandler;
    const TemplateExportHandler = require('int_socialfeeds/cartridge/scripts/export/handlers/TemplateExportHandler.ds').TemplateExportHandler;

    var templateName = request.httpParameterMap.feed.stringValue;
    var previewId = request.httpParameterMap.pid.stringValue;
    var feedPreviewFormat = request.httpParameterMap.feedPreviewFormat.stringValue || 'CSV';

    if (!previewId) {
        return 'Please select object ID to preview! (param=pid)';
    }
    if (!templateName) {
        return 'Please select a feed ID to preview! (param=feed)';
    }

    var co = CustomObjectMgr.getCustomObject('SalesChannelFeedConfig', templateName);
    if (co == null) {
        return 'Configuration object for this feed is not found!';
    }

    var writer = new StringWriter();
    var handler = null;
    var feedContext = co.custom.feedContext.value;
    if (!feedContext) {
        feedContext = 'Catalog';
    }

    switch (feedPreviewFormat) {
        case 'XML':
            handler = new TemplateExportHandler(writer, co.custom.configuration, feedContext, 'true', 'true', 'true', 'true', co.custom.socialCategory, co.custom.googleShoppingCategories);
            break;
        case 'CSV':
        default:
            var config = readConfigurationFromCustomObject(co);
            handler = new CSVExportHandler(
                writer,
                config.separator,
                config.fields,
                config.header,
                co.custom.feedContext.value,
                co.custom.includeOfflineProducts,
                co.custom.includeOutOfStockProducts,
                co.custom.includeNoPriceProducts,
                co.custom.includeSearchableIfUnavailableProducts,
                co.custom.socialCategory,
                co.custom.googleShoppingCategories,
                System.getInstanceHostname(),
                null, // file
                request.locale, // locale
                '', // Locales
                '', // LocalizedCategories
                '0', // DeltaCatalogInDays
                '', // GenerateDeleteFeed
                co.custom.exportCategoryId
            );
            break;
    }

    switch (feedContext) {
        case 'Catalog':
        default: // eslint-disable-line default-case-last
            var ProductMgr = require('dw/catalog/ProductMgr');
            var product = ProductMgr.getProduct(previewId);

            if (handler != null) {
                handler.beginExport(product);
                handler.exportProduct(product);
                handler.endExport();
                writer.close();

                return writer.toString();
            }

            return 'Unexpected error! Please check the logs.';
        case 'Order':
            var OrderMgr = require('dw/order/OrderMgr');
            var order = OrderMgr.getOrder(previewId);

            if (handler != null) {
                handler.beginExport();
                handler.exportOrder(order);
                handler.endExport();
                writer.close();

                return writer.toString();
            }

            return 'Unexpected error! Please check the logs.';
    }
}

exports.GeneratePreview = generatePreview;

'use strict';

var PRODUCT_PREFIX_TO_USE = 8; // increase this number if first two chars are not unique for product ids in your catalog
var SEPARATOR = '|';
var SortedSet = require('dw/util/SortedSet');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var FileReader = require('dw/io/FileReader');
var Logger = require('dw/system/Logger').getLogger('GlobalFeedExport', 'GlobalFeedExport');
var StringUtils = require('dw/util/StringUtils');
var Site = require('dw/system/Site');
var HashMap = require('dw/util/HashMap');
var trackingDir = 'tracking' + File.SEPARATOR + Site.getCurrent().ID;

/**
 * adds product ID and price to tracker
 *
 * Date structure: Using tracker as a HashMap and then values as SortedSet with product id | price prefix as key.
 * Main intent is to allow adding a lot of products into the tracker and avoid quota errors on collections.
 *
 * @param {dw.util.HashMap} tracker tracker HashMap object
 * @param {dw.catalog.Product} product product
 * @param {string} price product price
 * @returns {boolean} product added to tracker or not
 *
*/
function trackProduct(tracker, product, price) {
    var key = (product.ID).substring(0, Math.min(PRODUCT_PREFIX_TO_USE, product.ID.length));
    if (!tracker.containsKey(key)) {
        tracker.put(key, new SortedSet());
    }
    return tracker.get(key).add1(product.ID + SEPARATOR + price);
}

/**
 * save tracker data as file
 * format: csv
 * sample: index,[comma separated list of SKU IDs]
 * @param {dw.util.HashMap} tracker tracker HashMap object
 * @param {string} baseDirPath base directory where the tracker file will be stored
 * @param {string} locale locale that is being processed currently
 * @returns {boolean} file successfully saved or not
 *
*/
function storeTrackerDataToFile(tracker, baseDirPath, locale) {
    if (!tracker || !baseDirPath) {
        return false;
    }

    var dirPath = baseDirPath + File.SEPARATOR + trackingDir;
    var folder = new File(dirPath);
    var filename;
    var file;
    var writer;
    var value;
    var strValue;
    var entry;

    if (locale) {
        filename = 'feedtracker-' + StringUtils.formatCalendar(Site.getCalendar(), 'yyyyMMddHHmmss') + '-' + locale + '.txt';
    } else {
        filename = 'feedtracker-' + StringUtils.formatCalendar(Site.getCalendar(), 'yyyyMMddHHmmss') + '.txt';
    }

    try {
        if (!folder.exists() && !folder.mkdirs()) {
            Logger.error('Could not create folder: ' + dirPath);
        }

        file = new File(folder, filename);

        if (!file.exists() && !file.createNewFile()) {
            Logger.error('Could not create tracking file:');
        }

        writer = new FileWriter(file);

        var iter = tracker.entrySet().iterator();

        while (iter.hasNext()) {
            entry = iter.next();
            value = entry.value;
            if (value && value.size() > 0) {
                strValue = value.toArray().toString();
                writer.writeLine(entry.key + ',' + strValue);
            }
        }
    } catch (e) {
        Logger.error('Error saving tracker information into file' + e);
    } finally {
        if (writer) {
            writer.close();
        }
    }
    return true;
}

/**
 * returns a tracker object by parsing a file
 *
 * @param {File} file tracker file
 * @returns {dw.util.HashMap|undefined} tracker with parsed data
 */
function restoreTrackerFromFile(file) {
    var tracker = new HashMap();

    if (!file && !file.isFile()) {
        Logger.error('Error in restoring tracker from file - source file is incorrect');
        return tracker;
    }

    var fileReader = new FileReader(file);
    var nextLine;
    var data;
    var key;
    var sortedSet;

    try {
        // eslint-disable-next-line no-cond-assign
        while (!empty(nextLine = fileReader.readLine())) {
            if (nextLine) {
                data = nextLine.split(',');
                // first product id represents the HashMap key
                key = data.shift();
                sortedSet = new SortedSet();
                sortedSet.add(data);
                tracker.put(key, sortedSet);
            }
        }
    } catch (e) {
        Logger.error('Error while parsing the tracker file: ' + e);
    }

    return tracker;
}

/**
 * returns an array object with product ids which are present in first and not contained in second.
 *
 * @param {HashMap} first first tracker object
 * @param {HashMap} second second tracker object
 * @returns {Array|undefined} returns array containing the diff product ids
 *
 */
function findTrackerDiff(first, second) {
    var result = [];
    var firstKeySetIter;
    var key;
    var valueMatch;
    var firstSortedSetArr;
    var secondSortedSetArr;
    if (!first || !second) {
        Logger.error('findTrackerDiff: problem with input trackers');
        return result;
    }

    if ((first && first.isEmpty()) || (second && second.isEmpty())) {
        // if either are empty, most likely there is integration issue. Don't generate delete file
        Logger.error('findTrackerDiff: either of tracker is empty. Error is being returned');
        return result;
    }

    firstKeySetIter = first.keySet().iterator();

    while (firstKeySetIter.hasNext()) {
        key = firstKeySetIter.next();
        firstSortedSetArr = first
            .get(key)
            .toArray()
            .map(function (val) {
                return val.split(SEPARATOR)[0];
            });
        if (!second.containsKey(key)) {
            result = result.concat(firstSortedSetArr);
        } else {
            secondSortedSetArr = second.get(key)
                .toArray()
                .map(function (val) {
                    return val.split(SEPARATOR)[0];
                });
            valueMatch = JSON.stringify(secondSortedSetArr).indexOf(JSON.stringify(firstSortedSetArr)) > -1;
            if (!valueMatch) {
                firstSortedSetArr
                    // eslint-disable-next-line array-callback-return,no-loop-func
                    .map(function (productId) {
                        if (secondSortedSetArr.indexOf(productId) === -1) {
                            result.push(productId);
                        }
                    });
            }
        }
    }

    // remove the product ids which are deleted because of out of stock
    result.forEach(function (pid, index) {
        var product = require('dw/catalog/ProductMgr').getProduct(pid);
        if (product
            && product.availabilityModel
            && product.availabilityModel.inventoryRecord
            && product.availabilityModel.inventoryRecord.ATS.value <= 0) {
            result.splice(index, 1);
        }
    });

    return result;
}

/**
 * create delete file
 *
 * @param {Array} productArray product id array
 * @param {string} baseDirPath base directory path
 * @param {string} locale locale that is being processed currently
 * @returns {boolean} file successfully saved or not
 *
 */
function createDeleteFile(productArray, baseDirPath, locale) {
    if (!productArray || !baseDirPath) {
        Logger.error('createDeleteFile: error in inputs');
        return false;
    }
    var filename = 'delete-feed-' + Site.getCurrent().ID + '-' + StringUtils.formatCalendar(Site.getCalendar(), 'yyyyMMddHHmmss');
    if (locale) {
        filename = filename + '-' + locale;
    }
    var writer;
    try {
        var dir = new File(baseDirPath);
        if (!dir.exists()) {
            Logger.error('createDeleteFile: base directory does not exist');
            return false;
        }
        var file = new File(dir, filename + '.txt');

        if (!file.exists() && !file.createNewFile()) {
            Logger.error('Could not create tracking file:');
            return false;
        }

        writer = new FileWriter(file);

        productArray.map(function (productId) { // eslint-disable-line array-callback-return
            writer.writeLine(productId);
        });
    } catch (e) {
        Logger.error('createDeleteFile: error while creating delete file' + e);
    } finally {
        if (writer) {
            writer.close();
        }
    }

    return true;
}

/**
 * generate delete file based on comparison between old tracker stored data vs new
 *
 *
 * @param {dw.util.HashMap} tracker tracker HashMap object
 * @param {string} baseDirPath base directory path
 * @param {string} locale locale that is being processed currently
 * @returns {boolean} file successfully saved or not
 *
*/
function generateDeleteFile(tracker, baseDirPath, locale) {
    if (!tracker || !baseDirPath) {
        return false;
    }

    var fileGenereated = false;

    var dir = new File(baseDirPath + File.SEPARATOR + trackingDir);
    if (!dir.exists()) {
        Logger.error('generateDeleteFile: tracking directory does not exist');
    }
    var filesList = dir.list();

    if (locale) {
        filesList = filesList.filter(function (filename) {
            return filename.indexOf(locale) > -1;
        });
    }
    if (filesList.length >= 2) { // minimum we have two trackers to compare
        filesList = filesList.sort().reverse();
        var previousTrackerFilename = filesList[1]; // second last file is used for previous tracker
        var previousTrackerFile = new File(dir, previousTrackerFilename);
        var previousTracker = restoreTrackerFromFile(previousTrackerFile);
        var result = findTrackerDiff(previousTracker, tracker);

        if (result && result.length > 0) {
            // save to delete file
            fileGenereated = createDeleteFile(result, baseDirPath, locale);
        }
    }

    return fileGenereated;
}

/**
 * job run tracker
 *
 * @param {string} baseDirPath base directory path
 * @param {boolean} deleteFileGenerated true if delete file was generated
 * @param {boolean} deltaEnabled true if delta feed is enabled
 * @returns {boolean} file successfully saved or not
 *
*/
function trackJobRun(baseDirPath, deleteFileGenerated, deltaEnabled) {
    if (!baseDirPath) {
        return false;
    }

    var filename = '.lastrun.txt';
    var writer;

    try {
        var dir = new File(baseDirPath + File.SEPARATOR + trackingDir);
        if (!dir.exists() && !dir.mkdirs()) {
            Logger.error('trackJobRun: base directory does not exist');
            return false;
        }
        var file = new File(dir, filename);

        if (!file.exists() && !file.createNewFile()) {
            Logger.error('trackJobRun: Could not create tracking file:');
            return false;
        }

        writer = new FileWriter(file);

        var data = {
            deltaEnabled: deltaEnabled,
            deleteFileGenerated: deleteFileGenerated
        };
        writer.write(JSON.stringify(data));
    } catch (e) {
        Logger.error('trackJobRun: error while creating track file' + e);
    } finally {
        if (writer) {
            writer.close();
        }
    }

    return true;
}

/**
 * returns previous tracker from the tracker file
 *
 * @param {string} baseDirPath base directory path
 * @param {string} locale locale that is being processed currently
 * @returns {dw.util.HashMap|undefined} tracker tracker HashMap object
 *
*/
function getPreviousTracker(baseDirPath, locale) {
    if (!baseDirPath) {
        return undefined;
    }

    var dir = new File(baseDirPath + File.SEPARATOR + trackingDir);
    if (!dir.exists()) {
        Logger.error('generateDeleteFile: tracking directory does not exist');
        return undefined;
    }
    var filesList = dir.list();

    if (locale) {
        filesList = filesList.filter(function (filename) {
            return filename.indexOf(locale) > -1;
        });
    }
    if (filesList.length >= 1) { // minimum we have one file
        filesList = filesList.sort().reverse();
        var previousTrackerFilename = filesList[0]; // get last file
        var previousTrackerFile = new File(dir, previousTrackerFilename);
        return restoreTrackerFromFile(previousTrackerFile);
    }

    return undefined;
}

/**
 * returns true/false depending on whether the current price matches with tracked price or not
 *
 *
 * @param {dw.util.HashMap} tracker tracker HashMap object
 * @param {dw.catalog.Product} product product
 * @param {string} currentPrice price in [value][Whitespace][Currency] format
 * @returns {boolean} true/false if price is different or not
 *
*/
function hasPriceChanged(tracker, product, currentPrice) {
    if (!tracker || !product) {
        return false;
    }
    var key = (product.ID).substring(0, Math.min(PRODUCT_PREFIX_TO_USE, product.ID.length));
    var newVal = product.ID + SEPARATOR + currentPrice;

    if (!tracker.containsKey(key)) { // the history does not exist, export the product
        return true;
    }
    return !tracker.get(key).contains(newVal); // checks if the entry is exactly same or not
}

module.exports = {
    trackProduct: trackProduct,
    storeTrackerDataToFile: storeTrackerDataToFile,
    generateDeleteFile: generateDeleteFile,
    trackJobRun: trackJobRun,
    getPreviousTracker: getPreviousTracker,
    hasPriceChanged: hasPriceChanged,
    createDeleteFile: createDeleteFile
};

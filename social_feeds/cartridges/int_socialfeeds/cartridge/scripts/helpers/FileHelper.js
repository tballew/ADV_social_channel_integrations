'use strict';

var File = require('dw/io/File');
var Logger = require('dw/system/Logger');

const TEMP_PATH = File.SEPARATOR + File.TEMP + File.SEPARATOR;
const IMPEX_PATH = File.SEPARATOR + File.IMPEX + File.SEPARATOR;
const ZIP_FILE_REG_EXP = /\.zip$/;

var fileImpex = new File(File.IMPEX);

/**
 * Loads files from a given directory that match the given pattern
 * Non recursive.
 * Throws Exception if directory does not exist.
 *
 * @param {string} directoryPath (Absolute) Directory path to load from
 * @param {string} filePattern RegEx pattern that the filenames must match
 *
 * @returns {Array} file array
 */
var getFiles = function (directoryPath, filePattern) {
    var directory = new File(directoryPath);

    // We only want existing directories
    if (!directory.isDirectory()) {
        throw new Error('Source folder does not exist.');
    }

    var files = directory.list();

    return files.filter(function (filePath) {
        return empty(filePattern) || (!empty(filePattern) && filePath.match(filePattern) !== null);
    }).map(function (filePath) {
        return directoryPath + File.SEPARATOR + filePath;
    });
};

/**
 * Get files from a directory, sorted by date
 * @param {string} directoryPath (Absolute) Directory path to load from
 * @param {string} sortDirection sort direction (ASCENDING/ASC or DESCENDING/DESC)
 * @param {string} filePattern RegEx pattern that the filenames must match
 * @param {boolean} onlyFiles include only files in the returned list?
 * @returns {dw.util.SortedSet} array of sorted files
 */
var getSortedFiles = function (directoryPath, sortDirection, filePattern, onlyFiles) {
    var SortedSet = require('dw/util/SortedSet');

    var directory = new File(directoryPath);
    if (!directory || !directory.isDirectory()) {
        throw new Error('Source folder does not exist.');
    }
    var fileList = new SortedSet();
    if (sortDirection === 'DESCENDING' || sortDirection === 'DESC') {
        fileList = new SortedSet(function (o1, o2) {
            if (o1 < o2) {
                return 1;
            }
            if (o1 > o2) {
                return -1;
            }
            return 0;
        });
    }

    var regExp = new RegExp(filePattern, 'i');

    fileList.addAll(directory.listFiles(function (file) {
        if (onlyFiles && file.isDirectory()) {
            return false;
        }

        if (filePattern) {
            return regExp.test(file.name);
        }

        return true;
    }));

    return fileList;
};

/**
 * Loads files from a given directory that match the given pattern
 * recursive.
 * Throws Exception if directory does not exist.
 *
 * @param {string} sourceDirectory (Absolute) Directory path to load from
 * @param {string} filePattern RegEx pattern that the filenames must match
 * @param {string} sourceFolder source folder
 * @param {string} targetFolder target folder
 * @param {boolean} recursive recursive search?
 * @param {boolean} doOverwrite overwrite existing files?
 * @param {boolean} getTargetFile get the target file?
 * @returns {Array} files
 */
var getFileListRecursive = function (sourceDirectory, filePattern, sourceFolder, targetFolder, recursive, doOverwrite, getTargetFile) {
    var regexp;
    if (!empty(filePattern)) {
        regexp = new RegExp(filePattern);
    }

    var filteredList = [];
    var getFileList = function getFileList(currentFile) {
        var targetFile = null;
        if (getTargetFile) {
            targetFile = new File(currentFile.getFullPath().replace(sourceFolder, targetFolder));
            if (targetFile.exists() && !doOverwrite) {
                throw new Error('OverWriteWithoutPermission');
            }
        } else {
            // remove source and IMPEX folder path :
            targetFile = currentFile.getFullPath().replace(sourceFolder, '').replace(File.IMPEX, '');
            if (!currentFile.isDirectory()) {
                // this is to avoid targetFileName + targetFileName from upload behavior
                targetFile = targetFile.replace(currentFile.getName(), '');
            }
            // add targetFolder
            targetFile = targetFolder + (targetFile.charAt(0).equals(File.SEPARATOR) ? targetFile.substring(1) : targetFile);
        }
        if (currentFile.isDirectory() && recursive) {
            filteredList.push({
                name: currentFile.getName(),
                sourceFile: currentFile,
                targetFile: targetFile,
                createDirectory: true
            });
            currentFile.listFiles(getFileList);
        } else if (empty(filePattern) || (!empty(filePattern) && regexp.test(currentFile.getName()))) {
            filteredList.push({
                name: currentFile.getName(),
                sourceFile: currentFile,
                targetFile: targetFile,
                createDirectory: false
            });
            return true;
        }
        return false;
    };
    if (sourceDirectory instanceof File) {
        sourceDirectory.listFiles(getFileList);
    } else {
        sourceDirectory = new File(sourceDirectory); // eslint-disable-line no-param-reassign
        if (!sourceDirectory.isDirectory()) {
            throw new Error('Source folder does not exist.');
        }
        sourceDirectory.listFiles(getFileList);
    }

    return filteredList;
};

/**
 * Check if a file with the given {filename} in the given {directoryPath} exists or not
 *
 * @param {string} directoryPath directory path
 * @param {string} filename file name
 * @returns {boolean} true if file exists
 */
var isFileExists = function (directoryPath, filename) {
    var file = new File(directoryPath + File.SEPARATOR + filename);
    return file.exists();
};

/**
 * Create the given {directoryPath} recursively if it does not exists
 *
 * @param {string} directoryPath directory path
 * @returns {dw.io.File} The created directory instance
 */
var createDirectory = function (directoryPath) {
    var directory = new File(directoryPath);

    if (!directory.exists() && !directory.mkdirs()) {
        throw new Error('Cannot create the directory ' + directoryPath);
    }

    return directory;
};

/**
 * Returns the file name of the file from the file path.
 *
 * @param {string} filePath A file path to extract the file name from, e.g. '/directory/file.xml'.
 * @returns {string} The file name e.g. 'file.xml'.
 */
var getFileName = function (filePath) {
    var filePathParts = filePath.split(File.SEPARATOR);
    return filePathParts[filePathParts.length - 1];
};

/**
 * Moves the given {fileToMove} into the given {directory}.
 *
 * @param {dw.io.File} fileToMove File to move
 * @param {dw.io.File} directory Directory where to move the file in
 * @returns {boolean} Either the file has been successfully moved or not
 */
var moveFile = function (fileToMove, directory) {
    if (empty(fileToMove) || empty(directory)) {
        return false;
    }

    if (!directory.exists() && !directory.mkdirs()) {
        throw new Error('Cannot create the directory ' + directory.getFullPath() + ' to move the file ' + fileToMove.getName());
    }

    var fileDestination = new File(directory.getFullPath() + File.SEPARATOR + fileToMove.getName());
    return fileToMove.renameTo(fileDestination);
};

/**
 * Copy the given {fileToCopy} into the given {directory}.
 *
 * @param {dw.io.File} fileToCopy File to copy
 * @param {dw.io.File} directory Directory where to copy the file in
 * @returns {boolean} Either the file has been successfully moved or not
 */
var copyFile = function (fileToCopy, directory) {
    if (empty(fileToCopy) || empty(directory)) {
        return false;
    }

    if (!directory.exists() && !directory.mkdirs()) {
        throw new Error('Cannot create the directory ' + directory.getFullPath() + ' to copy the file ' + fileToCopy.getName());
    }

    var fileDestination = new File(directory.getFullPath() + File.SEPARATOR + fileToCopy.getName());
    return fileToCopy.copyTo(fileDestination);
};

/**
 * Prepends the {TEMP_PATH} path to provided {filePath} or returns
 * the {TEMP_PATH} path if provided {filePath} is empty.
 *
 * @param {string} filePath The file path to append to the {TEMP_PATH}
 * @returns {string} The final generated path
 */
var getTempPath = function (filePath) {
    var path = TEMP_PATH;

    if (!empty(filePath)) {
        path = TEMP_PATH + filePath;
    }

    return path;
};

/**
 * Prepends the {IMPEX_PATH} path to provided {filePath} or returns
 * the {IMPEX_PATH} path if provided {filePath} is empty.
 *
 * @param {string} filePath The file path to append to the {IMPEX_PATH}
 * @returns {string} The final generated path
 */
var getImpexPath = function (filePath) {
    var path = IMPEX_PATH;

    if (!empty(filePath)) {
        path = IMPEX_PATH + filePath;
    }

    return path;
};

/**
 * Compresses the given {directory} to the provided {zipFile}
 *
 * @param {dw.io.File} directory Directory to compress
 * @param {dw.io.File} zipFile File which will be the compressed file
 */
var compressDirectory = function (directory, zipFile) {
    if (!directory.exists()) {
        return;
    }
    directory.zip(zipFile);
};

/**
 * Removes all files and subdirectories if the given {directory} is a directory
 * Also traverses through subdirectories and the removes this directory.
 * If the given {directory} is a file it removes it.
 *
 * @param {dw.io.File} file Directory or file to remove
 * @returns {boolean} Either the directory has been successfully removed or not
 */
var removeFile = function (file) {
    if (!file.exists()) {
        return false;
    }

    if (file.isDirectory()) {
        var files = file.listFiles();
        if (!empty(files)) {
            files.toArray().forEach(function (fileToRemove) {
                // remove files inside the directory
                removeFile(fileToRemove);
            });
        }

        // now the directory is empty and it should be possible to remove it
        return file.remove();
    }
    return file.remove();
};

/**
 * Uncompress the given {files} in the given {targetDirectoryPath}
 *
 * @param {Array} files The list of files to process
 * @param {string} targetDirectoryPath The path of the folder where to uncompress the files
 * @param {boolean} useArchiveNameAsFolder Either if we have to use the archive name of each file as a sub-directory before unzipping the archive
 * @param {boolean} removeArchivesAfterCompletion Either if we have to remove the archive files after completion
 *
 * @returns {boolean} Either if all files have been successfully uncompressed or not
 */
var unzipFiles = function (files, targetDirectoryPath, useArchiveNameAsFolder, removeArchivesAfterCompletion) {
    if (files.length === 0) {
        return false;
    }

    var targetDirectory;
    // eslint-disable-next-line no-param-reassign
    targetDirectoryPath = getImpexPath(targetDirectoryPath) + (targetDirectoryPath.charAt(targetDirectoryPath.length - 1).equals(File.SEPARATOR) ? '' : File.SEPARATOR);

    // Loop across found files and only process .zip files
    return files.filter(function (file) {
        var archiveName = getFileName(file);
        return archiveName.substring(archiveName.length - 4, archiveName.length).toLowerCase() === '.zip';
    }).every(function (file) {
        var archiveFile = new File(file);
        var archiveName = getFileName(file);
        targetDirectory = createDirectory(targetDirectoryPath);

        archiveFile.unzip(targetDirectory);

        // By default, the platform create a folder with the archive name in the targetDirectory
        // i.e. /IMPEX/src/targetDirectory/archiveName.zip/unzippedFile.txt
        // But in some cases, we may want to have our uncompressed files directly in the targetDirectory
        if (useArchiveNameAsFolder !== true) {
            var uncompressedRootFolder = targetDirectory.getFullPath() + archiveName;
            var uncompressedFiles = getFiles(uncompressedRootFolder);
            uncompressedFiles.forEach(function (filePathToMove) {
                moveFile(new File(filePathToMove), targetDirectory);
            });

            removeFile(new File(uncompressedRootFolder));
        }

        if (removeArchivesAfterCompletion === true) {
            removeFile(archiveFile);
        }

        return true;
    });
};

/**
 * Compress the given {files} from the given {directoryPath}
 * in the given {targetDirectoryPath} in the given {archiveName} zip file.
 *
 * @param {Array} files The list of files to process
 * @param {string} targetDirectoryPath (Absolute) Directory path where to store the zip archive
 * @param {string} archiveName Archive name
 * @param {boolean} removeFilesFromSourceFolder Either if the function has to remove the found files from the source folder or not when adding them to the archive
 *
 * @returns {boolean} Either the archive has been successfully generated or not
 */
var zipFiles = function (files, targetDirectoryPath, archiveName, removeFilesFromSourceFolder) {
    if (files.length === 0) {
        return false;
    }

    // Append the .zip extension in case it's missing
    if (!ZIP_FILE_REG_EXP.test(archiveName.toLowerCase())) {
        archiveName += '.zip'; // eslint-disable-line no-param-reassign
    }

    // eslint-disable-next-line no-param-reassign
    targetDirectoryPath += (targetDirectoryPath.charAt(targetDirectoryPath.length - 1).equals(File.SEPARATOR) ? '' : File.SEPARATOR);

    // Copy files to a temporary folder
    // As we can only zip a folder or a unique file in SFCC
    var tempFullPath = getTempPath(targetDirectoryPath + archiveName);
    var tempArchiveDirectory = createDirectory(tempFullPath);

    files.forEach(function (filePathToArchive) {
        if (removeFilesFromSourceFolder === true) {
            moveFile(new File(filePathToArchive), tempArchiveDirectory);
        } else {
            copyFile(new File(filePathToArchive), tempArchiveDirectory);
        }
    });

    // zip archive directory
    var zipFile = new File(tempFullPath.replace(TEMP_PATH, IMPEX_PATH));
    compressDirectory(tempArchiveDirectory, zipFile);

    // remove temp archive directory
    return removeFile(tempArchiveDirectory);
};

/**
 *
 * @param {Object} options options object
 * @param {string} options.directory directory
 * @param {string} options.fileNamePattern file name patter
 * @returns {Iterator} iterator
 */
function listFiles(options) {
    var directoryFile = new File(fileImpex, options.directory);
    if (!directoryFile.exists()) {
        throw new Error(options.directory + ' does not exist');
    }

    if (!directoryFile.directory) {
        throw new Error(options.directory + ' is not a directory');
    }

    var re = new RegExp(options.fileNamePattern);

    var files = directoryFile.listFiles(function (file) {
        return re.test(file.name);
    });

    return files.iterator();
}

/**
 * Adds IMPEX folder to the file path
 * @param {string} filePath - file path to update
 * @returns {string} updated file path
 */
var addImpexPath = function (filePath) {
    return filePath.indexOf(File.IMPEX) >= 0
        ? filePath
        : File.IMPEX + File.SEPARATOR + 'src' + File.SEPARATOR + filePath;
};

/**
 * Creates a file to store inventory
 * @param {string} folderPath Folder where the file should be created
 * @param {string} filename filename
 * @param {string} siteId site id
 * @returns {dw.io.File} returns undefined or the created empty file
 */
function createFile(folderPath, filename, siteId) {
    var file;
    var dir;
    var folder;

    if (folderPath.charAt(0) === File.SEPARATOR) {
        dir = folderPath.slice(1);
    } else {
        dir = folderPath;
    }
    dir = File.IMPEX + File.SEPARATOR + 'src' + File.SEPARATOR + dir;
    folder = new File(dir);
    if (!folder.exists() && !folder.mkdirs()) {
        Logger.error('Could not create folder: ' + folderPath);
    }

    if (filename.indexOf('_siteid_') > -1) {
        // eslint-disable-next-line no-param-reassign
        filename = filename.replace(/_siteid_/, siteId);
    }

    if (filename.indexOf('_timestamp_') > -1) {
        // eslint-disable-next-line no-param-reassign
        filename = filename.replace(/_timestamp_/, Date.now());
    }
    file = new File(folder, filename);
    return file;
}

module.exports.createDirectory = createDirectory;
module.exports.getFileName = getFileName;
module.exports.getFiles = getFiles;
module.exports.getSortedFiles = getSortedFiles;
module.exports.getFileListRecursive = getFileListRecursive;
module.exports.isFileExists = isFileExists;
module.exports.removeFile = removeFile;
module.exports.moveFile = moveFile;
module.exports.copyFile = copyFile;
module.exports.unzipFiles = unzipFiles;
module.exports.zipFiles = zipFiles;
module.exports.listFiles = listFiles;
module.exports.addImpexPath = addImpexPath;
module.exports.createFile = createFile;

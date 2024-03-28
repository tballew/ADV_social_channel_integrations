'use strict';

module.exports = function (test, jasmine) {
    var expect = test.expect;
    var describe = test.describe;
    var it = test.it;
    var dummyFile;
    var dummyFilesMock;
    var mkdirsCalled = false;
    var fileExists = true;

    dummyFile = function (path) {
        this.fullPath = path;
        this.mkdirs = function () {
            mkdirsCalled = true;
        };
        this.isFile = function () { return true; };
        this.createNewFileCalled = false;
        this.createNewFile = function () {
            this.createNewFileCalled = true;
            return true;
        };
        this.exists = function () { return fileExists; };
    };
    dummyFile.IMPEX = 'IMPEX';
    dummyFile.SEPARATOR = '/';

    dummyFilesMock = function (arg1, arg2, arg3, arg4) {
        this.closeCalled = false;
        this.close = function () {
            this.closeCalled = true;
        };
        this.arg1 = arg1;
        this.arg2 = arg2;
        this.arg3 = arg3;
        this.arg4 = arg4;
    };

    // eslint-disable-next-line require-jsdoc
    function dummyRequire(filename) {
        if (['dw/io/FileReader',
            'dw/io/FileWriter',
            'dw/io/CSVStreamReader',
            'dw/io/CSVStreamWriter',
            'dw/io/XMLStreamReader',
            'dw/io/XMLStreamWriter'
        ].indexOf(filename) !== -1) {
            return dummyFilesMock;
        }
        return require(filename);
    }

    describe('fileHammer Utility', function () {
        var FH = require('../fileHammer');
        FH.mockEntry('File', dummyFile);
        FH.mockEntry('require', dummyRequire);

        describe('getFile method', function () {
            it('should exists', function () {
                expect(FH).toBeDefined();
                expect(typeof (FH.getFile)).toBe('function');
            });

            it('should open existing file', function () {
                var callback = jasmine.createSpy('callback');
                var status;

                callback.and.callFake(function (file) {
                    expect(file instanceof dummyFile).toBeTruthy();
                    expect(file.createNewFileCalled).toBeFalsy();
                    expect(mkdirsCalled).toBeFalsy();
                    mkdirsCalled = false;
                });
                status = FH.getFile('somedir/{siteID}/name', callback);
                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
            });

            it('should open existing file with options', function () {
                var callback = jasmine.createSpy('callback');
                var status;

                callback.and.callFake(function (file) {
                    expect(file instanceof dummyFile).toBeTruthy();
                    expect(file.createNewFileCalled).toBeTruthy();
                    expect(file.fullPath.indexOf(FH.TEMP)).toBe(0);
                    expect(mkdirsCalled).toBeTruthy();
                    mkdirsCalled = false;
                });
                status = FH.getFile('somedir/name', { rootDir: FH.TEMP, createFile: true }, callback);
                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
            });

            it('should replace placeholders in filename', function () {
                var callback = jasmine.createSpy('callback');
                var status;

                callback.and.callFake(function (file) {
                    expect(file.fullPath.match(/(\{siteID\})|(\{timestamp\})|(\{date\})/ig)).toBeFalsy();
                });
                status = FH.getFile('somedir/{siteID}/{date}/name.{timestamp}.csv', callback);
                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
            });

            it('should fails on opening unexisting file', function () {
                fileExists = false;
                var callback = jasmine.createSpy('callback');
                var status;

                status = FH.getFile('somedir/{siteID}/name', callback);
                expect(callback).not.toHaveBeenCalled();
                expect(status.isError()).toBeTruthy();
                fileExists = true;
            });
        });

        describe('getFileReader method', function () {
            it('should open existing file ', function () {
                var callback = jasmine.createSpy('callback');
                var status;

                callback.and.callFake(function (fileReader, file) {
                    expect(fileReader instanceof dummyFilesMock).toBeTruthy();
                    expect(file instanceof dummyFile).toBeTruthy();

                    expect(file.createNewFileCalled).toBeFalsy();
                    expect(mkdirsCalled).toBeFalsy();
                    mkdirsCalled = false;
                });
                status = FH.getFileReader('somedir/{siteID}/name', callback);
                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
            });

            it('should close fileReader after done and replace placeholders', function () {
                var callback = jasmine.createSpy('callbackFileReader');
                var status;
                var fileReaderEx;

                callback.and.callFake(function (fileReader, file) {
                    expect(file.fullPath.match(/(\{siteID\})|(\{timestamp\})|(\{date\})/ig)).toBeFalsy();
                    fileReaderEx = fileReader;
                    expect(fileReaderEx.closeCalled).toBeFalsy();
                    expect(fileReaderEx.arg2).toBe('UTF-8');
                });
                status = FH.getFileReader('somedir/{siteID}/{date}/name.{timestamp}.csv', callback);
                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
                expect(fileReaderEx.closeCalled).toBeTruthy();
            });

            it('should open existing file with options', function () {
                var callback = jasmine.createSpy('callback');
                var status;

                callback.and.callFake(function (fileReader, file) {
                    expect(file instanceof dummyFile).toBeTruthy();
                    expect(file.createNewFileCalled).toBeTruthy();
                    expect(file.fullPath.indexOf(FH.TEMP)).toBe(0);
                    expect(mkdirsCalled).toBeTruthy();
                    expect(fileReader.arg2).toBe('UTF-16');
                    mkdirsCalled = false;
                });
                status = FH.getFileReader('somedir/name', {
                    rootDir: FH.TEMP,
                    createFile: true,
                    encoding: 'UTF-16'
                }, callback);

                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
            });

            it('should fails on opening unexisting file', function () {
                fileExists = false;
                var callback = jasmine.createSpy('callback');
                var status;

                status = FH.getFileReader('somedir/{siteID}/name', callback);
                expect(callback).not.toHaveBeenCalled();
                expect(status.isError()).toBeTruthy();
                fileExists = true;
            });
        });

        describe('getFileWriter method', function () {
            it('should open existing file', function () {
                var callback = jasmine.createSpy('callback');
                var status;

                callback.and.callFake(function (fileWriter, file) {
                    expect(fileWriter instanceof dummyFilesMock).toBeTruthy();
                    expect(file instanceof dummyFile).toBeTruthy();
                    expect(file.createNewFileCalled).toBeTruthy();
                    expect(mkdirsCalled).toBeTruthy();
                    mkdirsCalled = false;
                });
                status = FH.getFileWriter('somedir/{siteID}/name', callback);
                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
            });

            it('should close fileWriter after done and replace placeholders', function () {
                var callback = jasmine.createSpy('callback');
                var status;
                var fileWriterEx;

                callback.and.callFake(function (fileWriter, file) {
                    expect(file.fullPath.match(/(\{siteID\})|(\{timestamp\})|(\{date\})/ig)).toBeFalsy();
                    fileWriterEx = fileWriter;
                    expect(fileWriterEx.closeCalled).toBeFalsy();
                    expect(fileWriterEx.arg2).toBe('UTF-8');
                });
                status = FH.getFileWriter('somedir/{siteID}/{date}/name.{timestamp}.csv', callback);
                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
                expect(fileWriterEx.closeCalled).toBeTruthy();
            });

            it('should open existing file with options', function () {
                var callback = jasmine.createSpy('callback');
                var status;

                callback.and.callFake(function (fileWriter, file) {
                    expect(file instanceof dummyFile).toBeTruthy();
                    expect(file.createNewFileCalled).toBeFalsy();
                    expect(file.fullPath.indexOf(FH.TEMP)).toBe(0);
                    expect(mkdirsCalled).toBeFalsy();
                    expect(fileWriter.arg2).toBe('UTF-16');
                    mkdirsCalled = false;
                });

                mkdirsCalled = false;
                status = FH.getFileWriter('somedir/name', {
                    rootDir: FH.TEMP,
                    createFile: false,
                    encoding: 'UTF-16'
                }, callback);

                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
            });

            it('should fails on opening unexisting file', function () {
                fileExists = false;
                var callback = jasmine.createSpy('callback');
                var status;

                status = FH.getFileWriter('somedir/{siteID}/{date}.csv', callback);
                expect(callback).not.toHaveBeenCalled();
                expect(status.isError()).toBeTruthy();
                fileExists = true;
            });
        });
        describe('getCSVStreamReader method', function () {
            test.beforeEach(function () {
                mkdirsCalled = false;
            });

            it('should open existing file', function () {
                var callback = jasmine.createSpy('callback');
                var status;

                callback.and.callFake(function (stream, fileReader, file) {
                    expect(fileReader instanceof dummyFilesMock).toBeTruthy();
                    expect(stream instanceof dummyFilesMock).toBeTruthy();
                    expect(file instanceof dummyFile).toBeTruthy();
                    expect(file.createNewFileCalled).toBeFalsy();
                    expect(mkdirsCalled).toBeFalsy();
                });

                status = FH.getCSVStreamReader('somedir/{siteID}/name', callback);
                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
            });

            it('should close CSVStreamReader and fileReader after done and replace placeholders', function () {
                var callback = jasmine.createSpy('callback');
                var status;
                var fileWriterEx;
                var streamEx;

                callback.and.callFake(function (stream, fileWriter, file) {
                    expect(file.fullPath.match(/(\{siteID\})|(\{timestamp\})|(\{date\})/ig)).toBeFalsy();
                    fileWriterEx = fileWriter;
                    streamEx = stream;
                    expect(fileWriterEx.closeCalled).toBeFalsy();
                    expect(streamEx.closeCalled).toBeFalsy();
                    expect(streamEx.arg3).toBe('"');
                    expect(fileWriterEx.arg2).toBe('UTF-8');
                });
                status = FH.getCSVStreamReader('somedir/{siteID}/{date}/name.{timestamp}.csv', callback);
                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
                expect(fileWriterEx.closeCalled).toBeTruthy();
                expect(streamEx.closeCalled).toBeTruthy();
            });

            it('should open existing file with options', function () {
                var callback = jasmine.createSpy('callback');
                var status;

                callback.and.callFake(function (stream, fileReader, file) {
                    expect(file instanceof dummyFile).toBeTruthy();
                    expect(file.createNewFileCalled).toBeTruthy();
                    expect(file.fullPath.indexOf(FH.TEMP)).toBe(0);
                    expect(mkdirsCalled).toBeTruthy();
                    expect(fileReader.arg2).toBe('UTF-16');
                    expect(stream.arg3).toBe('\'');
                });

                status = FH.getCSVStreamReader('somedir/name', {
                    rootDir: FH.TEMP,
                    createFile: true,
                    encoding: 'UTF-16',
                    quote: '\''
                }, callback);

                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
            });

            it('should fails on opening unexisting file', function () {
                fileExists = false;
                var callback = jasmine.createSpy('callback');
                var status;

                status = FH.getCSVStreamReader('somedir/{siteID}/{date}.csv', callback);
                expect(callback).not.toHaveBeenCalled();
                expect(status.isError()).toBeTruthy();
                fileExists = true;
            });
        });
        describe('getCSVStreamWriter method', function () {
            test.beforeEach(function () {
                mkdirsCalled = false;
            });

            it('should open existing file', function () {
                var callback = jasmine.createSpy('callback');
                var status;

                callback.and.callFake(function (stream, fileWriter, file) {
                    expect(fileWriter instanceof dummyFilesMock).toBeTruthy();
                    expect(stream instanceof dummyFilesMock).toBeTruthy();
                    expect(file instanceof dummyFile).toBeTruthy();
                    expect(file.createNewFileCalled).toBeTruthy();
                    expect(mkdirsCalled).toBeTruthy();
                });

                status = FH.getCSVStreamWriter('somedir/{siteID}/name', callback);
                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
            });

            it('should close getCSVStreamWriter and fileWriter after done and replace placeholders', function () {
                var callback = jasmine.createSpy('callback');
                var status;
                var fileWriterEx;
                var streamEx;

                callback.and.callFake(function (stream, fileWriter, file) {
                    expect(file.fullPath.match(/(\{siteID\})|(\{timestamp\})|(\{date\})/ig)).toBeFalsy();
                    fileWriterEx = fileWriter;
                    streamEx = stream;
                    expect(fileWriterEx.closeCalled).toBeFalsy();
                    expect(streamEx.closeCalled).toBeFalsy();
                    expect(streamEx.arg3).toBe('"');
                    expect(fileWriterEx.arg2).toBe('UTF-8');
                });
                status = FH.getCSVStreamWriter('somedir/{siteID}/{date}/name.{timestamp}.csv', callback);
                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
                expect(fileWriterEx.closeCalled).toBeTruthy();
                expect(streamEx.closeCalled).toBeTruthy();
            });

            it('should open existing file with options', function () {
                var callback = jasmine.createSpy('callback');
                var status;

                callback.and.callFake(function (stream, fileWriter, file) {
                    expect(file instanceof dummyFile).toBeTruthy();
                    expect(file.createNewFileCalled).toBeTruthy();
                    expect(file.fullPath.indexOf(FH.TEMP)).toBe(0);
                    expect(mkdirsCalled).toBeTruthy();
                    expect(fileWriter.arg2).toBe('UTF-16');
                    expect(stream.arg3).toBe('\'');
                });

                status = FH.getCSVStreamWriter('somedir/name', {
                    rootDir: FH.TEMP,
                    createFile: true,
                    encoding: 'UTF-16',
                    quote: '\''
                }, callback);

                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
            });

            it('should fails on opening unexisting file', function () {
                fileExists = false;
                var callback = jasmine.createSpy('callback');
                var status;

                status = FH.getCSVStreamWriter('somedir/{siteID}/{date}.csv', callback);
                expect(callback).not.toHaveBeenCalled();
                expect(status.isError()).toBeTruthy();
                fileExists = true;
            });
        });
        describe('getXMLStreamReader method', function () {
            test.beforeEach(function () {
                mkdirsCalled = false;
            });

            it('should open existing file', function () {
                var callback = jasmine.createSpy('callback');
                var status;

                callback.and.callFake(function (stream, fileWriter, file) {
                    expect(fileWriter instanceof dummyFilesMock).toBeTruthy();
                    expect(stream instanceof dummyFilesMock).toBeTruthy();
                    expect(file instanceof dummyFile).toBeTruthy();
                });

                status = FH.getXMLStreamReader('somedir/{siteID}/name', callback);
                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
            });

            it('should close getXMLStreamReader and fileReader after done and replace placeholders', function () {
                var callback = jasmine.createSpy('callback');
                var status;
                var fileWriterEx;
                var streamEx;

                callback.and.callFake(function (stream, fileWriter, file) {
                    expect(file.fullPath.match(/(\{siteID\})|(\{timestamp\})|(\{date\})/ig)).toBeFalsy();
                    fileWriterEx = fileWriter;
                    streamEx = stream;
                    expect(fileWriterEx.closeCalled).toBeFalsy();
                    expect(streamEx.closeCalled).toBeFalsy();
                    expect(streamEx.arg3).toBe('"');
                    expect(fileWriterEx.arg2).toBe('UTF-8');
                });
                status = FH.getCSVStreamWriter('somedir/{siteID}/{date}/name.{timestamp}.csv', callback);
                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
                expect(fileWriterEx.closeCalled).toBeTruthy();
                expect(streamEx.closeCalled).toBeTruthy();
            });

            it('should open existing file with options', function () {
                var callback = jasmine.createSpy('callback');
                var status;

                callback.and.callFake(function (stream, fileReader, file) {
                    expect(file instanceof dummyFile).toBeTruthy();
                    expect(file.createNewFileCalled).toBeTruthy();
                    expect(file.fullPath.indexOf(FH.TEMP)).toBe(0);
                    expect(mkdirsCalled).toBeTruthy();
                    expect(fileReader.arg2).toBe('UTF-16');
                });

                status = FH.getXMLStreamReader('somedir/name', {
                    rootDir: FH.TEMP,
                    createFile: true,
                    encoding: 'UTF-16'
                }, callback);

                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
            });

            it('should fails on opening unexisting file', function () {
                fileExists = false;
                var callback = jasmine.createSpy('callback');
                var status;

                status = FH.getXMLStreamReader('somedir/{siteID}/{date}.csv', callback);
                expect(callback).not.toHaveBeenCalled();
                expect(status.isError()).toBeTruthy();
                fileExists = true;
            });
        });
        describe('getXMLStreamWriter method', function () {
            test.beforeEach(function () {
                mkdirsCalled = false;
            });

            it('should open existing file', function () {
                var callback = jasmine.createSpy('callback');
                var status;

                callback.and.callFake(function (stream, fileWriter, file) {
                    expect(fileWriter instanceof dummyFilesMock).toBeTruthy();
                    expect(stream instanceof dummyFilesMock).toBeTruthy();
                    expect(file instanceof dummyFile).toBeTruthy();
                    expect(file.createNewFileCalled).toBeTruthy();
                    expect(mkdirsCalled).toBeTruthy();
                });

                status = FH.getXMLStreamWriter('somedir/{siteID}/name', callback);
                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
            });

            it('should close stream and fileWriter after done and replace placeholders', function () {
                var callback = jasmine.createSpy('callback');
                var status;
                var fileWriterEx;
                var streamEx;

                callback.and.callFake(function (stream, fileWriter, file) {
                    expect(file.fullPath.match(/(\{siteID\})|(\{timestamp\})|(\{date\})/ig)).toBeFalsy();
                    fileWriterEx = fileWriter;
                    streamEx = stream;
                    expect(fileWriterEx.closeCalled).toBeFalsy();
                    expect(streamEx.closeCalled).toBeFalsy();
                    expect(fileWriterEx.arg2).toBe('UTF-8');
                });
                status = FH.getXMLStreamWriter('somedir/{siteID}/{date}/name.{timestamp}.csv', callback);
                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
                expect(fileWriterEx.closeCalled).toBeTruthy();
                expect(streamEx.closeCalled).toBeTruthy();
            });

            it('should open existing file with options', function () {
                var callback = jasmine.createSpy('callback');
                var status;

                callback.and.callFake(function (stream, fileWriter, file) {
                    expect(file instanceof dummyFile).toBeTruthy();
                    expect(file.createNewFileCalled).toBeTruthy();
                    expect(file.fullPath.indexOf(FH.TEMP)).toBe(0);
                    expect(mkdirsCalled).toBeTruthy();
                    expect(fileWriter.arg2).toBe('UTF-16');
                });

                status = FH.getXMLStreamWriter('somedir/name', {
                    rootDir: FH.TEMP,
                    createFile: true,
                    encoding: 'UTF-16'
                }, callback);

                expect(callback).toHaveBeenCalled();
                expect(status.isError()).toBeFalsy();
            });

            it('should fails on opening unexisting file', function () {
                fileExists = false;
                var callback = jasmine.createSpy('callback');
                var status;

                status = FH.getXMLStreamWriter('somedir/{siteID}/{date}.csv', callback);
                expect(callback).not.toHaveBeenCalled();
                expect(status.isError()).toBeTruthy();
                fileExists = true;
            });
        });
    });
};

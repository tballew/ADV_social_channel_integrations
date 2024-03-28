## Intro
Demandware a bit spoils world of JavaScript by his Java API. That's why we have to face sometimes with error that is not inherent in classical JavaScript. Bright example reading of nonexistent property of Demandware/Java object. This is a reason why this library-wrapper is created. The idea is pretty simple, make Demandware more closer to the spirit of JavaScript. First step is make working with files a bit simplest as working with files a bit unusual in light of others objects. Because at first to open file to read we have to interact with several interjacent objects before we be able to work with XMLStreamReader. At second interjacent objects we have to close in right order, this may lead to mistakes. And at last we always have to make additional logic that serves validation and error checking, with is repeated many times. This issues is solved in this library wrapper.


## Goal
Reduce side effects and increase stability and simplify the design of scripts that work with the files.

## Solution
Usually when developer wants to read/write file he has file name and some logic that should be applied to this file.
Thats why developed functions have usually two arguments: filename and function (callback) what will be executed when file will be successfully opened. In case when file is not available or some error happened callback will not be called at all but error will be reported in logs and same error returned by opening function so developer might do something with this error. Sometimes may be needed to change behavior of functions so we have third (actually second one) argument that could be used to specify options (you might find signature of functions in src file that is documented in JSDoc format).

NodeJS developers have experience with callback functions to interact with files. So was decided to use same approach in this library but with little bit changed callback signature. In NodeJS first argument represent error (if it exists) and second one is actual data. In this implementation we will have only data. In error case callback will not be called at all and error will be returned by function that opens the file. beside this we will use synchronous nature of Demandware to reduce of side effects and close file automatically after callback logic finish his job.


Also there is possibility to use placeholders in file name, that allow scripts to be more flexible. 
Placeholders that could be used:

* {siteID} - represend current site ID 
* {data} - represent current data in format 'yyyy-mm-dd'
* {timestamp} - represent UNIX time stamp

## Examples
Open file for reading
```javascript
var FH = require('bc_library/cartridge/scripts/io/fileHammer');

var status = FH.getFileReader('src/myintegration/export{date}.txt', function (fileReader) {
	// do some with fileReader
});

if (status.isError()) {
	// process error if needed.
}
```
Open file for writing with options
```javascript
var FH = require('bc_library/cartridge/scripts/io/fileHammer');

var status = FH.getFileWriter('src/myintegration/export{date}.txt', {encoding: 'ISO-343', append: true},
function (fileWriter) {
	// do some with fileWriter
	
});

if (status.isError()) {
	// process error if needed.
}
```
Opening XML file for writing with options
```javascript
var FH = require('bc_library/cartridge/scripts/io/fileHammer');

var status = FH.getXMLStreamWriter('src/myintegration/{siteID}/export{date}.txt', {encoding: 'ISO-343'},
function (xsw) {
	xsw.writeStartDocument();
	 xsw.writeStartElement("products");
	   xsw.writeStartElement("product");
	   xsw.writeAttribute("id", "p42");
	     xsw.writeStartElement("name");
	       xsw.writeCharacters("blue t-shirt");
	     xsw.writeEndElement();
	     xsw.writeStartElement("rating");
	       xsw.writeCharacters("2.0");
	     xsw.writeEndElement();
	   xsw.writeEndElement();
	 xsw.writeEndElement();
	 xsw.writeEndDocument();
});

if (status.isError()) {
	// process error if needed.
}
```


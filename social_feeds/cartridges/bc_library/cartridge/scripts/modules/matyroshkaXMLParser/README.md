## Intro
This is a XML Parser framework designed to help parsing huge XML files which cannot be processed by simply calling getXMLObject for the root node.

The advantage over having the parsing done in one big file is separation of concerns and a much better overview. Matyroshka allows the definition of hierarchical parsers which only parse and process a dedicated part of the XML file. Parsers can communicate via events to exchange information. The same time the architecture helps to keep a small memory footprint and not to have a big influence on the performance because of the processing overhead that framework introduces.


## Examples

```javascript

var Logger = require('dw/system').Logger;

var Class = require('bc_library/cartridge/scripts/object-handling/libInheritance.ds').Class;
var Collections = require('bc_library/cartridge/scripts/util/Collections.ds').Collections;
var XMLFragmentParser = require('bc_library/cartridge/scripts/xml/matyroshka/XMLFragmentParser.ds').XMLFragmentParser;
var XMLParseError = require('bc_library/cartridge/scripts/xml/matyroshka/XMLParseError.ds').XMLParseError;
var ArrayList = require('dw/util').ArrayList;
var HashMap = require('dw/util').HashMap;



var ArticleParser = XMLFragmentParser.extend({

 init : function (streamWriter) {
 	this._super();
 	this.id = 0;
	this.priceinfo = new ArrayList();
	this.streamWriter = streamWriter;

	this._addBeginElementParseEventHandler('Article', this.beginArticle);
 	this._addEndElementParseEventHandler('Article', this.endArticle);
  	this._addEventListener('priceinfo:promo', this.isPromo, this);
 },

 _resetState : function () {
 	this.id = 0;
	this.priceinfo = new ArrayList();
 },
 
 beginArticle : function (event, xmlStreamReader) {
	this._resetState();
	this.id = xmlStreamReader.getAttributeValue(null, "id");
	this._activateChildParsers();
	
	this.document.messageQueue.fireEvent('productid', this.id);
 },
 

 endArticle : function (event, xmlStreamReader) {
	this.process();
	this.document.messageQueue.fireEvent('object:article', { id : this.id, priceinfo : this.priceinfo});
	this._deactivateChildParsers();
 },
 
 
 isAktion : function (event, object) {
 	this.priceinfo.add('Promo'); 
 },
 
process : function () {
	this.streamWriter.writeStartElement('product');
		this.streamWriter.writeAttribute('product-id', this.id.toString());
		
		if (!empty(this.priceinfo)) {
			this.streamWriter.writeStartElement('custom-attributes');
				this.streamWriter.writeStartElement('custom-attribute');
				this.streamWriter.writeAttribute('attribute-id', 'priceinfo');
				
				Collections.each(this.priceinfo, function (value) {
					this.streamWriter.writeStartElement('value');
						this.streamWriter.writeCharacters(value);
					this.streamWriter.writeEndElement();
				}, this);
			this.streamWriter.writeEndElement();
		}
		
	this.streamWriter.writeEndElement();
}

});

if(typeof(exports) !== 'undefined') {
	exports.ArticleParser = ArticleParser;
}
```

```javascript
var ArticleParser = require('test_shop/cartridge/scripts/xmlParser/ArticleParser.ds').ArticleParser;



var articleParser = new ArticleParser(xsw);
         
fileReader = new FileReader(args.InputFile);
xsw = new XMLIndentingStreamWriter(new FileWriter(new File(impexDir + 'testTransformed.xml')));


xsw.writeStartDocument();
xsw.writeStartElement('catalog');
xsw.writeAttribute('catalog-id', 'catalog');          
xsw.writeDefaultNamespace('http://www.demandware.com/xml/impex/catalog/2006-10-31');

   articleParser.registerChildFragmentParser(new AssignmentsParser(xswAssignments)).
   registerChildFragmentParser(new PriceListParser(xswListPrices, xswSalesPrices, xswDiscPrices, xswBestPrices)); 
   document.registerFragmentParser(articleParser);
   document.process(fileReader);   

xsw.writeEndElement();
xsw.writeEndDocument();
xsw.close();
```

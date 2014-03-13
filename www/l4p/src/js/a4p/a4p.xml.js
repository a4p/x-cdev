'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

a4p.Xml = (function()
{
    // Constructor
    function Xml()
    {
        this.version = "0.1";
    }

    // Public API

    Xml.isXml = function (elm) {
        // based on jQuery.isXML function
        var documentElement = (elm ? elm.ownerDocument || elm : 0).documentElement;
        return documentElement ? documentElement.nodeName !== "HTML" : false;
    };

    /**
     * Encodes a XML node to string
     */
    Xml.xml2String = function(xmlNode) {
        // based on http://www.mercurytide.co.uk/news/article/issues-when-working-ajax/
        if (!Xml.isXml(xmlNode)) {
            return false;
        }
        try { // Mozilla, Webkit, Opera
            return new XMLSerializer().serializeToString(xmlNode);
        } catch (E1) {
            try {  // IE
                return xmlNode.xml;
            } catch (E2) {

            }
        }
        return false;
    };

    /**
     * Decodes a XML node from string
     */
    Xml.string2Xml = function(xmlString) {
        // based on http://outwestmedia.com/jquery-plugins/xmldom/
        if (!dom_parser) {
            return false;
        }
        var resultXML = dom_parser.call("DOMParser" in window && (new DOMParser()) || window,
            xmlString, 'text/xml');
        return this.isXml(resultXML) ? resultXML : false;
    };

    // Private API
    // helper functions and variables hidden within this function scope

    var dom_parser = ("DOMParser" in window && (new DOMParser()).parseFromString) ||
        (window.ActiveXObject && function(_xmlString) {
            var xml_doc = new ActiveXObject('Microsoft.XMLDOM');
            xml_doc.async = 'false';
            xml_doc.loadXML(_xmlString);
            return xml_doc;
        });

    // The public API for this module is the constructor function.
    // We need to export that function from this private namespace so that
    // it can be used on the outside.
    return Xml;
})(); // Invoke the function immediately to create this class.

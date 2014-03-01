'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

a4p.Json = (function($)
{
    if(!(Object.toJSON || window.JSON)){
        throw new Error("Object.toJSON or window.JSON needs to be loaded before a4p.Json!");
    }

    // Constructor
    function Json()
    {
        this.version = "0.1";
    }

    // Public API

    /**
     * Encodes object to JSON string
     *
     * Do not use $.param() which causes havoc in ANGULAR.
     * See http://victorblog.com/2012/12/20/make-angularjs-http-service-behave-like-jquery-ajax/
     */
    Json.uriEncode = function(obj) {
        var query = '';
        var name, value, fullSubName, subName, subValue, innerObj, i;

        for (name in obj) {
            if (!obj.hasOwnProperty(name)) continue;
            value = obj[name];
            if (value instanceof Array) {
                for (i = 0; i < value.length; ++i) {
                    subValue = value[i];
                    fullSubName = name + '[' + i + ']';
                    innerObj = {};
                    innerObj[fullSubName] = subValue;
                    query += Json.uriEncode(innerObj) + '&';
                }
            } else if (value instanceof Object) {
                for (subName in value) {
                    if (!value.hasOwnProperty(subName)) continue;
                    subValue = value[subName];
                    fullSubName = name + '[' + subName + ']';
                    innerObj = {};
                    innerObj[fullSubName] = subValue;
                    query += Json.uriEncode(innerObj) + '&';
                }
            } else if (value !== undefined && value !== null) {
                query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
            }
        }
        return query.length ? query.substr(0, query.length - 1) : query;
    };

    /**
     * Encodes object to JSON string
     */
    Json.object2String = $.toJSON || Object.toJSON || (window.JSON && (JSON.encode || JSON.stringify));

    /**
     * Decodes object from JSON string
     */
    Json.string2Object = $.evalJSON || (window.JSON && (JSON.decode || JSON.parse)) || function(str){
        return String(str).evalJSON();
    };

    // The public API for this module is the constructor function.
    // We need to export that function from this private namespace so that
    // it can be used on the outside.
    return Json;
})(window.$ || window.jQuery); // Invoke the function immediately to create this class.

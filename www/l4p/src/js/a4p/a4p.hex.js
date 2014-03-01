'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

a4p.Hex = (function () {

    var Hex = {};

    // Public API

    /**
     * Encodes string to Hexadecimal string
     */
    Hex.encode = function (input) {
        var output = '';
        for (var i = 0; i < input.length; i++) {
            var x = input.charCodeAt(i);
            output += hexTab.charAt((x >>> 4) & 0x0F) + hexTab.charAt(x & 0x0F);
        }
        return output;
    };

    /**
     * Decodes Hexadecimal string to string
     */
    Hex.decode = function (input) {
        var output = '';
        if (input.length % 2 > 0) {
            input = '0' + input;
        }
        for (var i = 0; i < input.length; i = i + 2) {
            output += String.fromCharCode(parseInt(input.charAt(i) + input.charAt(i + 1), 16));
        }
        return output;
    };

    var hexTab = "0123456789abcdef";

    // The public API for this module is the constructor function.
    // We need to export that function from this private namespace so that
    // it can be used on the outside.
    return Hex;
})(); // Invoke the function immediately to create this class.

'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

/**
 *
 *  Secure Hash Algorithm (SHA1)
 *  http://www.webtoolkit.info/
 *
 **/
a4p.Sha1 = (function () {

    var Sha1 = {};

    // Public API

    /**
     * Hash string
     */
    Sha1.hash = function (input) {
        var s = a4p.Utf8.encode(input);
        return binb2rstr(binb_sha1(rstr2binb(s), s.length * 8));
    };

    /**
     * Create a 256 bits key from a password
     */
    Sha1.key256 = function (password) {
        var nBytes = 256 / 8;  // no bytes in key
        var halfLen = password.length / 2;
        var hash1 = a4p.Sha1.hash(password.substr(0, halfLen));
        var hash2 = a4p.Sha1.hash(password.substr(halfLen));
        return hash1.substr(0, 16) + hash2.substr(0, nBytes - 16);  // expand key to 16/24/32 bytes long
    };

    /*
     * Convert a raw string to an array of big-endian words
     * Characters >255 have their high-byte silently ignored.
     */
    function rstr2binb(input) {
        var output = new Array(input.length >> 2);
        for (var i = 0; i < output.length; i++)
            output[i] = 0;
        for (var j = 0; j < input.length * 8; j += 8)
            output[j >> 5] |= (input.charCodeAt(j / 8) & 0xFF) << (24 - j % 32);
        return output;
    }

    /*
     * Convert an array of big-endian words to a string
     */
    function binb2rstr(input) {
        var output = "";
        for (var i = 0; i < input.length * 32; i += 8)
            output += String.fromCharCode((input[i >> 5] >>> (24 - i % 32)) & 0xFF);
        return output;
    }

    /*
     * Calculate the SHA-1 of an array of big-endian words, and a bit length
     */
    function binb_sha1(x, len) {
        /* append padding */
        x[len >> 5] |= 0x80 << (24 - len % 32);
        x[((len + 64 >> 9) << 4) + 15] = len;

        var w = new Array(80);
        var a = 1732584193;
        var b = -271733879;
        var c = -1732584194;
        var d = 271733878;
        var e = -1009589776;

        for (var i = 0; i < x.length; i += 16) {
            var olda = a;
            var oldb = b;
            var oldc = c;
            var oldd = d;
            var olde = e;

            for (var j = 0; j < 80; j++) {
                if (j < 16) w[j] = x[i + j];
                else w[j] = bit_rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
                var t = safe_add(safe_add(bit_rol(a, 5), sha1_ft(j, b, c, d)),
                    safe_add(safe_add(e, w[j]), sha1_kt(j)));
                e = d;
                d = c;
                c = bit_rol(b, 30);
                b = a;
                a = t;
            }

            a = safe_add(a, olda);
            b = safe_add(b, oldb);
            c = safe_add(c, oldc);
            d = safe_add(d, oldd);
            e = safe_add(e, olde);
        }
        return [a, b, c, d, e];

    }

    /*
     * Perform the appropriate triplet combination function for the current
     * iteration
     */
    function sha1_ft(t, b, c, d) {
        if (t < 20) return (b & c) | ((~b) & d);
        if (t < 40) return b ^ c ^ d;
        if (t < 60) return (b & c) | (b & d) | (c & d);
        return b ^ c ^ d;
    }

    /*
     * Determine the appropriate additive constant for the current iteration
     */
    function sha1_kt(t) {
        return (t < 20) ? 1518500249 : (t < 40) ? 1859775393 :
            (t < 60) ? -1894007588 : -899497514;
    }

    /*
     * Add integers, wrapping at 2^32. This uses 16-bit operations internally
     * to work around bugs in some JS interpreters.
     */
    function safe_add(x, y) {
        var lsw = (x & 0xFFFF) + (y & 0xFFFF);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }

    /*
     * Bitwise rotate a 32-bit number to the left.
     */
    function bit_rol(num, cnt) {
        return (num << cnt) | (num >>> (32 - cnt));
    }

    // The public API for this module is the constructor function.
    // We need to export that function from this private namespace so that
    // it can be used on the outside.
    return Sha1;
})(); // Invoke the function immediately to create this class.

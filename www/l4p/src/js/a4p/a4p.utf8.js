'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};


a4p.Utf8 = (function () {

    var Utf8 = {};

    // Public API


    /**
     * Encodes multi-byte Unicode string to utf-8 encoded characters
     *
     * @param {String} input Unicode string to be encoded into utf-8
     * @returns {String} UTF-8 string
     */
    Utf8.encode = function (input) {
        var utftext = '', nChr, nStrLen = input.length;
        /* transcription... */
        for (var nChrIdx = 0; nChrIdx < nStrLen; nChrIdx++) {
            nChr = input.charCodeAt(nChrIdx);
            if (nChr < 128) {
                /* one byte */
                utftext += String.fromCharCode(nChr);
            } else if (nChr < 0x800) {
                /* two bytes */
                utftext += String.fromCharCode(192 + (nChr >>> 6));
                utftext += String.fromCharCode(128 + (nChr & 63));
            } else if (nChr < 0x10000) {
                /* three bytes */
                utftext += String.fromCharCode(224 + (nChr >>> 12));
                utftext += String.fromCharCode(128 + (nChr >>> 6 & 63));
                utftext += String.fromCharCode(128 + (nChr & 63));
            } else if (nChr < 0x200000) {
                /* four bytes */
                utftext += String.fromCharCode(240 + (nChr >>> 18));
                utftext += String.fromCharCode(128 + (nChr >>> 12 & 63));
                utftext += String.fromCharCode(128 + (nChr >>> 6 & 63));
                utftext += String.fromCharCode(128 + (nChr & 63));
            } else if (nChr < 0x4000000) {
                /* five bytes */
                utftext += String.fromCharCode(248 + (nChr >>> 24));
                utftext += String.fromCharCode(128 + (nChr >>> 18 & 63));
                utftext += String.fromCharCode(128 + (nChr >>> 12 & 63));
                utftext += String.fromCharCode(128 + (nChr >>> 6 & 63));
                utftext += String.fromCharCode(128 + (nChr & 63));
            } else /* if (nChr <= 0x7fffffff) */ {
                /* six bytes */
                utftext += String.fromCharCode(252 + /* (nChr >>> 32) is not possible in ECMAScript! So...: */ (nChr / 1073741824));
                utftext += String.fromCharCode(128 + (nChr >>> 24 & 63));
                utftext += String.fromCharCode(128 + (nChr >>> 18 & 63));
                utftext += String.fromCharCode(128 + (nChr >>> 12 & 63));
                utftext += String.fromCharCode(128 + (nChr >>> 6 & 63));
                utftext += String.fromCharCode(128 + (nChr & 63));
            }
        }
        return utftext;
    };

    /**
     * Encodes multi-byte Unicode string to Uint8Array characters
     *
     * @param {String} input Unicode string to be encoded into Uint8Array
     * @returns {String} Uint8Array
     */
    Utf8.encodeToUint8Array = function (input) {
        var aBytes, nChr, nStrLen = input.length, nArrLen = 0;
        /* mapping... */
        for (var nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
            nChr = input.charCodeAt(nMapIdx);
            nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6;
        }
        aBytes = new Uint8Array(nArrLen);
        /* transcription... */
        for (var nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++) {
            nChr = input.charCodeAt(nChrIdx);
            if (nChr < 128) {
                /* one byte */
                aBytes[nIdx++] = nChr;
            } else if (nChr < 0x800) {
                /* two bytes */
                aBytes[nIdx++] = 192 + (nChr >>> 6);
                aBytes[nIdx++] = 128 + (nChr & 63);
            } else if (nChr < 0x10000) {
                /* three bytes */
                aBytes[nIdx++] = 224 + (nChr >>> 12);
                aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
                aBytes[nIdx++] = 128 + (nChr & 63);
            } else if (nChr < 0x200000) {
                /* four bytes */
                aBytes[nIdx++] = 240 + (nChr >>> 18);
                aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
                aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
                aBytes[nIdx++] = 128 + (nChr & 63);
            } else if (nChr < 0x4000000) {
                /* five bytes */
                aBytes[nIdx++] = 248 + (nChr >>> 24);
                aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
                aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
                aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
                aBytes[nIdx++] = 128 + (nChr & 63);
            } else /* if (nChr <= 0x7fffffff) */ {
                /* six bytes */
                aBytes[nIdx++] = 252 + /* (nChr >>> 32) is not possible in ECMAScript! So...: */ (nChr / 1073741824);
                aBytes[nIdx++] = 128 + (nChr >>> 24 & 63);
                aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
                aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
                aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
                aBytes[nIdx++] = 128 + (nChr & 63);
            }
        }
        return aBytes;
    };

    /**
     * Decodes utf-8 encoded string to multi-byte Unicode characters
     *
     * @param {String} input UTF-8 string to be decoded into Unicode
     * @returns {String} Unicode string
     */
    Utf8.decode = function (input) {
        var sView = "", nChr, nCode, nStrLen = input.length;
        for (var nChrIdx = 0; nChrIdx < nStrLen; nChrIdx++) {
            nChr = input.charCodeAt(nChrIdx);
            if ((nChr >= 0xfc) && (nChr <= 0xfd) && ((nChrIdx + 5) < nStrLen)) {
                /* six bytes */
                /* (nChr - 252 << 32) is not possible in ECMAScript! So...: */
                nCode = (nChr & 0x01) * 1073741824;
                nChr = input.charCodeAt(++nChrIdx);
                nCode |= ((nChr & 0x3f) << 24);
                nChr = input.charCodeAt(++nChrIdx);
                nCode |= ((nChr & 0x3f) << 18);
                nChr = input.charCodeAt(++nChrIdx);
                nCode |= ((nChr & 0x3f) << 12);
                nChr = input.charCodeAt(++nChrIdx);
                nCode |= ((nChr & 0x3f) << 6);
                nChr = input.charCodeAt(++nChrIdx);
                nCode |= (nChr & 0x3f);
                sView += String.fromCharCode(nCode);
            } else if ((nChr >= 0xf8) && (nChr <= 0xfb) && ((nChrIdx + 4) < nStrLen)) {
                /* five bytes */
                nCode = ((nChr & 0x03) << 24);
                nChr = input.charCodeAt(++nChrIdx);
                nCode |= ((nChr & 0x3f) << 18);
                nChr = input.charCodeAt(++nChrIdx);
                nCode |= ((nChr & 0x3f) << 12);
                nChr = input.charCodeAt(++nChrIdx);
                nCode |= ((nChr & 0x3f) << 6);
                nChr = input.charCodeAt(++nChrIdx);
                nCode |= (nChr & 0x3f);
                sView += String.fromCharCode(nCode);
            } else if ((nChr >= 0xf0) && (nChr <= 0xf7) && ((nChrIdx + 3) < nStrLen)) {
                /* four bytes */
                nCode = ((nChr & 0x07) << 18);
                nChr = input.charCodeAt(++nChrIdx);
                nCode |= ((nChr & 0x3f) << 12);
                nChr = input.charCodeAt(++nChrIdx);
                nCode |= ((nChr & 0x3f) << 6);
                nChr = input.charCodeAt(++nChrIdx);
                nCode |= (nChr & 0x3f);
                sView += String.fromCharCode(nCode);
            } else if ((nChr >= 0xe0) && (nChr <= 0xef) && ((nChrIdx + 2) < nStrLen)) {
                /* three bytes */
                nCode = ((nChr & 0x0f) << 12);
                nChr = input.charCodeAt(++nChrIdx);
                nCode |= ((nChr & 0x3f) << 6);
                nChr = input.charCodeAt(++nChrIdx);
                nCode |= (nChr & 0x3f);
                sView += String.fromCharCode(nCode);
            } else if ((nChr >= 0xc0) && (nChr <= 0xdf) && ((nChrIdx + 1) < nStrLen)) {
                /* two bytes */
                nCode = ((nChr & 0x1f) << 6);
                nChr = input.charCodeAt(++nChrIdx);
                nCode |= (nChr & 0x3f);
                sView += String.fromCharCode(nCode);
            } else {
                /* one byte */
                sView += String.fromCharCode(nChr & 0x7f);
            }
        }
        return sView;
    };

    /**
     * Decodes Uint8Array to to multi-byte Unicode characters
     *
     * @param {String} aBytes Uint8Array to be decoded into Unicode
     * @returns {String} Unicode string
     */
    Utf8.decodeFromUint8Array = function (aBytes) {
        var sView = "", nPart, nCode, nLen = aBytes.length;
        for (var nIdx = 0; nIdx < nLen; nIdx++) {
            nPart = aBytes[nIdx];
            if ((nPart >= 0xfc) && (nPart <= 0xfd) && ((nIdx + 5) < nLen)) {
                /* six bytes */
                /* (nPart - 252 << 32) is not possible in ECMAScript! So...: */
                nCode = (nPart & 0x01) * 1073741824;
                nPart = aBytes[++nIdx];
                nCode += ((nPart & 0x3f) << 24);
                nPart = aBytes[++nIdx];
                nCode += ((nPart & 0x3f) << 18);
                nPart = aBytes[++nIdx];
                nCode += ((nPart & 0x3f) << 12);
                nPart = aBytes[++nIdx];
                nCode += ((nPart & 0x3f) << 6);
                nPart = aBytes[++nIdx];
                nCode += (nPart & 0x3f);
                sView += String.fromCharCode(nCode);
            } else if ((nPart >= 0xf8) && (nPart <= 0xfb) && ((nIdx + 4) < nLen)) {
                /* five bytes */
                nCode = ((nPart & 0x03) << 24);
                nPart = aBytes[++nIdx];
                nCode += ((nPart & 0x3f) << 18);
                nPart = aBytes[++nIdx];
                nCode += ((nPart & 0x3f) << 12);
                nPart = aBytes[++nIdx];
                nCode += ((nPart & 0x3f) << 6);
                nPart = aBytes[++nIdx];
                nCode += (nPart & 0x3f);
                sView += String.fromCharCode(nCode);
            } else if ((nPart >= 0xf0) && (nPart <= 0xf7) && ((nIdx + 3) < nLen)) {
                /* four bytes */
                nCode = ((nPart & 0x07) << 18);
                nPart = aBytes[++nIdx];
                nCode += ((nPart & 0x3f) << 12);
                nPart = aBytes[++nIdx];
                nCode += ((nPart & 0x3f) << 6);
                nPart = aBytes[++nIdx];
                nCode += (nPart & 0x3f);
                sView += String.fromCharCode(nCode);
            } else if ((nPart >= 0xe0) && (nPart <= 0xef) && ((nIdx + 2) < nLen)) {
                /* three bytes */
                nCode = ((nPart & 0x0f) << 12);
                nPart = aBytes[++nIdx];
                nCode += ((nPart & 0x3f) << 6);
                nPart = aBytes[++nIdx];
                nCode += (nPart & 0x3f);
                sView += String.fromCharCode(nCode);
            } else if ((nPart >= 0xc0) && (nPart <= 0xdf) && ((nIdx + 1) < nLen)) {
                /* two bytes */
                nCode = ((nPart & 0x1f) << 6);
                nPart = aBytes[++nIdx];
                nCode += (nPart & 0x3f);
                sView += String.fromCharCode(nCode);
            } else {
                /* one byte */
                sView += String.fromCharCode(nPart & 0x7f);
            }
        }
        return sView;
    };

    // The public API for this module is the constructor function.
    // We need to export that function from this private namespace so that
    // it can be used on the outside.
    return Utf8;
})(); // Invoke the function immediately to create this class.

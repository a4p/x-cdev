'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

/**
 * Management of browser capabilities
 */
a4p.BrowserCapabilities = (function (navigator, window, document) {
    var capacities = {vendor: '', cssVendor: ''};

    function prefixStyle(style) {
        if (capacities.vendor === '') return style;
        style = style.charAt(0).toUpperCase() + style.substr(1);
        return capacities.vendor + style;
    }

    var dummyStyle = document.createElement('div').style;
    var vendors = 't,webkitT,MozT,msT,OT'.split(',');
    var nbVendors = vendors.length;
    for (var i = 0; i < nbVendors; i++) {
        var t = vendors[i] + 'ransform';
        if (t in dummyStyle) {
            capacities.vendor = vendors[i].substr(0, vendors[i].length - 1);
            capacities.cssVendor = '-' + capacities.vendor.toLowerCase() + '-';
            break;
        }
    }

    capacities.transform = prefixStyle('transform');
    capacities.transitionProperty = prefixStyle('transitionProperty');
    capacities.transitionDuration = prefixStyle('transitionDuration');
    capacities.transformOrigin = prefixStyle('transformOrigin');
    capacities.transitionTimingFunction = prefixStyle('transitionTimingFunction');
    capacities.transitionDelay = prefixStyle('transitionDelay');

    capacities.isAndroid = (/android/gi).test(navigator.appVersion);
    capacities.isIDevice = (/iphone|ipad/gi).test(navigator.appVersion);
    capacities.isTouchPad = (/hp-tablet/gi).test(navigator.appVersion);
    capacities.isPhantom = (/phantom/gi).test(navigator.userAgent);
    //capacities.hasTouch = (('ontouchstart' in window) || ('createTouch' in document)) && !capacities.isTouchPad && !capacities.isPhantom;
    capacities.hasTouch = (('ontouchstart' in window) || ('createTouch' in document)) && (capacities.isAndroid || capacities.isIDevice) && !capacities.isPhantom;
    capacities.has3d = prefixStyle('perspective') in dummyStyle;
    capacities.hasTransform = (capacities.vendor != '');
    capacities.hasTransitionEnd = prefixStyle('transition') in dummyStyle;

    capacities.online = navigator.onLine;

    capacities.RESIZE_EVENT = 'onorientationchange' in window ? 'orientationchange' : 'resize';
    capacities.TRNEND_EVENT = (function () {
        if (capacities.vendor == '') return false;
        var transitionEnd = {
            '': 'transitionend',
            'webkit': 'webkitTransitionEnd',
            'Moz': 'transitionend',
            'O': 'otransitionend',
            'ms': 'MSTransitionEnd'
        };
        return transitionEnd[capacities.vendor];
    })();
    if (window.requestAnimationFrame) {
        //capacities.nextFrame.call(window, callback);
        capacities.nextFrame = function (callback) {
            return window.requestAnimationFrame(callback);
        };
    } else if (window.webkitRequestAnimationFrame) {
        capacities.nextFrame = function (callback) {
            return window.webkitRequestAnimationFrame(callback);
        };
    } else if (window.mozRequestAnimationFrame) {
        capacities.nextFrame = function (callback) {
            return window.mozRequestAnimationFrame(callback);
        };
    } else if (window.oRequestAnimationFrame) {
        capacities.nextFrame = function (callback) {
            return window.oRequestAnimationFrame(callback);
        };
    } else if (window.msRequestAnimationFrame) {
        capacities.nextFrame = function (callback) {
            return window.msRequestAnimationFrame(callback);
        };
    } else {
        capacities.nextFrame = function (callback) {
            return setTimeout(callback, 1);
        };
    }
    if (window.cancelRequestAnimationFrame) {
        //capacities.cancelFrame.call(window, handle);
        capacities.cancelFrame = function (handle) {
            return window.cancelRequestAnimationFrame(handle);
        };
    } else if (window.webkitCancelAnimationFrame) {
        capacities.cancelFrame = function (handle) {
            return window.webkitCancelAnimationFrame(handle);
        };
    } else if (window.webkitCancelRequestAnimationFrame) {
        capacities.cancelFrame = function (handle) {
            return window.webkitCancelRequestAnimationFrame(handle);
        };
    } else if (window.mozCancelRequestAnimationFrame) {
        capacities.cancelFrame = function (handle) {
            return window.mozCancelRequestAnimationFrame(handle);
        };
    } else if (window.oCancelRequestAnimationFrame) {
        capacities.cancelFrame = function (handle) {
            return window.oCancelRequestAnimationFrame(handle);
        };
    } else if (window.msCancelRequestAnimationFrame) {
        capacities.cancelFrame = function (handle) {
            return window.msCancelRequestAnimationFrame(handle);
        };
    } else {
        capacities.cancelFrame = function (handle) {
            return clearTimeout(handle);
        };
    }
    // FIX ANDROID BUG : translate3d and scale doesn't work together => deactivate translate3d (in case user uses scale) !
    capacities.translateZ = (capacities.has3d && !capacities.isAndroid) ? ' translateZ(0)' : '';

    dummyStyle = null;

    return capacities;
})(navigator, window, document);

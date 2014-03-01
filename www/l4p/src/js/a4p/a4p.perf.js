'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

/**
 * Returns a function, that, when invoked, will only be triggered at most once during a given window of time.
 *
 * Example of use :
 * <code>
 * var socket = io.connect();
 * socket.on(eventName, a4p.throttle(function () { // limit to once every 500ms
 *   var args = arguments;
 *   a4p.safeApply($scope, function() {
 *       callback.apply(socket, args);
 *   });
 * }, 500));
 * </code>
 *
 * @param func Callback to execute
 * @param wait Time in ms between 2 successive execution of Callback
 * @return {Function} Function which will return undefined if wait time is not expired, or the result of func call if wait time is expired.
 * @see https://github.com/documentcloud/underscore/blob/master/underscore.js#L626
 */
a4p.throttle = function (func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function () {
        previous = new Date();
        timeout = null;
        result = func.apply(context, args);
    };
    return function () {
        var now = new Date();
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0) {
            window.clearTimeout(timeout);
            timeout = null;
            previous = now;
            result = func.apply(context, args);
        } else if (!timeout) {
            timeout = window.setTimeout(later, remaining);
        }
        return result;
    };
};

/**
 * Returns a function, that, when invoked, will only be triggered at least <wait> time of delay
 * after the last call. Each call before this timeout will delay it at least <wait> time. Then
 * callback function will not be called while returned function is called within <wait> time since
 * last call.
 *
 * Example of use :
 * <code>
 * var fct = a4p.delay(function () {...}, 500));
 * window.setTimeout(fct, 100);// {...} will be executed in 500ms
 * window.setTimeout(fct, 100);// {...} will be executed only in 500ms
 * window.setTimeout(fct, 100);// {...} will be executed only in 500ms
 * // {...} will be executed in 500ms
 * </code>
 *
 * @param func Callback to execute
 * @param wait Time in ms to wait after each call before executing Callback
 * @return {Function} Function which will return running timer.
 */
a4p.delay = function (func, wait) {
    var context, args, timeout;
    var previous = 0;
    var later = function () {
        var now = (new Date()).getTime();
        var remaining = wait - (now - previous);
        if (remaining > 0) {
            timeout = window.setTimeout(later, remaining);
        } else {
            timeout = null;
            func.apply(context, args);
        }
    };
    return function () {
        previous = (new Date()).getTime();
        if (!timeout) {
            context = this;
            args = arguments;
            timeout = window.setTimeout(later, wait);
        }
        return timeout;
    };
}

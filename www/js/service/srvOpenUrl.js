'use strict';

var SrvOpenUrl = (function() {

    function Service(exceptionHandlerService) {
        this.exceptionHandler = exceptionHandlerService;

        this.callbacks = [];
        this.callbackHandle = 0;
    }

    Service.prototype.addListener = function (fct) {
        this.callbackHandle++;
        this.callbacks.push({id:this.callbackHandle, callback:fct});
        return this.callbackHandle;
    };
    Service.prototype.cancelListener = function (callbackHandle) {
        return (removeIdFromList(this.callbacks, callbackHandle) !== false);
    };
    Service.prototype.openUrl = function (url) {
        var callbacks = this.callbacks.slice(0);// Copy to be independant of updates
        for (var idx = 0, max = callbacks.length; idx < max; idx++) {
            try {
                callbacks[idx].callback(callbacks[idx].id, url);
            } catch (e) {
                this.exceptionHandler(e, "SrvOpenUrl.callbacks#" + idx);
            }
        }
    };

    return Service;
})();


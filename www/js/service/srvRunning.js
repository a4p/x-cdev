'use strict';

var SrvRunning = (function() {
    function Service(exceptionHandlerService) {
        this.exceptionHandler = exceptionHandlerService;

        this.refresh = false;
        this.pause = false;
        this.online = true;

        this.callbacksRefresh = [];
        this.callbacksPause = [];
        this.callbacksOnline = [];
        this.callbackHandle = 0;
    }
    Service.prototype.setRefresh = function (yes) {
        this.refresh = yes;
        triggerRefresh(this, yes);
    };
    Service.prototype.setPause = function (yes) {
        this.pause = yes;
        triggerPause(this, yes);
    };
    Service.prototype.setOnline = function (yes) {
        this.online = yes;
        triggerOnline(this, yes);
    };
    Service.prototype.addListenerOnRefresh = function (fct) {
        this.callbackHandle++;
        this.callbacksRefresh.push({id:this.callbackHandle, callback:fct});
        return this.callbackHandle;
    };
    Service.prototype.addListenerOnPause = function (fct) {
        this.callbackHandle++;
        this.callbacksPause.push({id:this.callbackHandle, callback:fct});
        return this.callbackHandle;
    };
    Service.prototype.addListenerOnOnline = function (fct) {
        this.callbackHandle++;
        this.callbacksOnline.push({id:this.callbackHandle, callback:fct});
        return this.callbackHandle;
    };
    Service.prototype.cancelListener = function (callbackHandle) {
        if (removeIdFromList(this.callbacksRefresh, callbackHandle) === false) {
            if (removeIdFromList(this.callbacksPause, callbackHandle) === false) {
                return (removeIdFromList(this.callbacksOnline, callbackHandle) !== false);
            }
        }
        return true;
    };
    function triggerRefresh(self, yes) {
        var callbacks = self.callbacksRefresh.slice(0);// Copy to be independant of updates
        for (var idx = 0, max = callbacks.length; idx < max; idx++) {
            try {
                callbacks[idx].callback(callbacks[idx].id, yes);
            } catch (e) {
                self.exceptionHandler(e, "srvRunning.callbacksRefresh#" + idx);
            }
        }
    }
    function triggerPause(self, yes) {
        var callbacks = self.callbacksPause.slice(0);// Copy to be independant of updates
        for (var idx = 0, max = callbacks.length; idx < max; idx++) {
            try {
                callbacks[idx].callback(callbacks[idx].id, yes);
            } catch (e) {
                self.exceptionHandler(e, "srvRunning.callbacksPause#" + idx);
            }
        }
    }
    function triggerOnline(self, yes) {
        var callbacks = self.callbacksOnline.slice(0);// Copy to be independant of updates
        for (var idx = 0, max = callbacks.length; idx < max; idx++) {
            try {
                callbacks[idx].callback(callbacks[idx].id, yes);
            } catch (e) {
                self.exceptionHandler(e, "srvRunning.callbacksOnline#" + idx);
            }
        }
    }
    return Service;
})();


'use strict';

var SrvTime = (function() {

    function setNow(self, now) {
        self.now = now;
        setSecond(self, now);
    }
    function setSecond(self, now) {
        if (self.second != now.getSeconds()) {
            self.second = now.getSeconds();
            setMinute(self, now);
            triggerSecond(self);
        }
    }
    function setMinute(self, now) {
        if (self.minute != now.getMinutes()) {
            self.minute = now.getMinutes();
            setHour(self, now);
            triggerMinute(self);
        }
    }
    function setHour(self, now) {
        if (self.hour != now.getHours()) {
            self.hour = now.getHours();
            setDay(self, now);
            triggerHour(self);
        }
    }
    function setDay(self, now) {
        if (self.day != now.getDate()) {
            self.day = now.getDate();
            setMonth(self, now);
            triggerDay(self);
        }
    }
    function setMonth(self, now) {
        if (self.month != (now.getMonth() + 1)) {
            self.month = (now.getMonth() + 1);
            setYear(self, now);
            triggerMonth(self);
        }
    }
    function setYear(self, now) {
        if (self.year != now.getFullYear()) {
            self.year = now.getFullYear();
            triggerYear(self);
        }
    }

    function Service(exceptionHandlerService) {
        this.exceptionHandler = exceptionHandlerService;

        this.now = new Date();
        this.year = this.now.getFullYear();
        this.month = this.now.getMonth() + 1;
        this.day = this.now.getDate();
        this.hour = this.now.getHours();
        this.minute = this.now.getMinutes();
        this.second = this.now.getSeconds();

        this.callbacksYear = [];
        this.callbacksMonth = [];
        this.callbacksDay = [];
        this.callbacksHour = [];
        this.callbacksMinute = [];
        this.callbacksSecond = [];
        this.callbackHandle = 0;

        var self = this;
        (function tick() {
            setNow(self, new Date());
            // Usage of $timeout breaks e2e tests for the moment : https://github.com/angular/angular.js/issues/2402
            //$timeout(tick, 1000, false);// DO NOT call $apply
            window.setTimeout(tick, 1000);
        })();
    }

    Service.prototype.addListenerOnYear = function (fct) {
        this.callbackHandle++;
        this.callbacksYear.push({id:this.callbackHandle, callback:fct});
        return this.callbackHandle;
    };
    Service.prototype.addListenerOnMonth = function (fct) {
        this.callbackHandle++;
        this.callbacksMonth.push({id:this.callbackHandle, callback:fct});
        return this.callbackHandle;
    };
    Service.prototype.addListenerOnDay = function (fct) {
        this.callbackHandle++;
        this.callbacksDay.push({id:this.callbackHandle, callback:fct});
        return this.callbackHandle;
    };
    Service.prototype.addListenerOnHour = function (fct) {
        this.callbackHandle++;
        this.callbacksHour.push({id:this.callbackHandle, callback:fct});
        return this.callbackHandle;
    };
    Service.prototype.addListenerOnMinute = function (fct) {
        this.callbackHandle++;
        this.callbacksMinute.push({id:this.callbackHandle, callback:fct});
        return this.callbackHandle;
    };
    Service.prototype.addListenerOnSecond = function (fct) {
        this.callbackHandle++;
        this.callbacksSecond.push({id:this.callbackHandle, callback:fct});
        return this.callbackHandle;
    };
    Service.prototype.cancelListener = function (callbackHandle) {
        if (removeIdFromList(this.callbacksYear, callbackHandle) === false) {
            if (removeIdFromList(this.callbacksMonth, callbackHandle) === false) {
                if (removeIdFromList(this.callbacksDay, callbackHandle) === false) {
                    if (removeIdFromList(this.callbacksHour, callbackHandle) === false) {
                        if (removeIdFromList(this.callbacksMinute, callbackHandle) === false) {
                            return (removeIdFromList(this.callbacksSecond, callbackHandle) !== false);
                        }
                    }
                }
            }
        }
        return true;
    };
    function triggerYear(self) {
        var callbacks = self.callbacksYear.slice(0);// Copy to be independant of updates
        for (var idx = 0, max = callbacks.length; idx < max; idx++) {
            try {
                callbacks[idx].callback(callbacks[idx].id, self.now);
            } catch (e) {
                self.exceptionHandler(e, "SrvTime.callbacksYear#" + idx);
            }
        }
    }
    function triggerMonth(self) {
        var callbacks = self.callbacksMonth.slice(0);// Copy to be independant of updates
        for (var idx = 0, max = callbacks.length; idx < max; idx++) {
            try {
                callbacks[idx].callback(callbacks[idx].id, self.now);
            } catch (e) {
                self.exceptionHandler(e, "SrvTime.callbacksMonth#" + idx);
            }
        }
    }
    function triggerDay(self) {
        var callbacks = self.callbacksDay.slice(0);// Copy to be independant of updates
        for (var idx = 0, max = callbacks.length; idx < max; idx++) {
            try {
                callbacks[idx].callback(callbacks[idx].id, self.now);
            } catch (e) {
                self.exceptionHandler(e, "SrvTime.callbacksDay#" + idx);
            }
        }
    }
    function triggerHour(self) {
        var callbacks = self.callbacksHour.slice(0);// Copy to be independant of updates
        for (var idx = 0, max = callbacks.length; idx < max; idx++) {
            try {
                callbacks[idx].callback(callbacks[idx].id, self.now);
            } catch (e) {
                self.exceptionHandler(e, "SrvTime.callbacksHour#" + idx);
            }
        }
    }
    function triggerMinute(self) {
        var callbacks = self.callbacksMinute.slice(0);// Copy to be independant of updates
        for (var idx = 0, max = callbacks.length; idx < max; idx++) {
            try {
                callbacks[idx].callback(callbacks[idx].id, self.now);
            } catch (e) {
                self.exceptionHandler(e, "SrvTime.callbacksMinute#" + idx);
            }
        }
    }
    function triggerSecond(self) {
        var callbacks = self.callbacksSecond.slice(0);// Copy to be independant of updates
        for (var idx = 0, max = callbacks.length; idx < max; idx++) {
            try {
                callbacks[idx].callback(callbacks[idx].id, self.now);
            } catch (e) {
                self.exceptionHandler(e, "SrvTime.callbacksSecond#" + idx);
            }
        }
    }

    return Service;
})();


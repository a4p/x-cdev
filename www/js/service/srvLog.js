'use strict';

var SrvLog = (function() {
    var nbErrorMax = 1000;
    var nbInternalMax = 1000;
    var nbUserMax = 100;

    function Service(srvLocalStorage) {
        // New log
        this.userLog = new a4p.Log(nbUserMax);
        // Use already existing logs
        this.internalLog = a4p.InternalLog;
        this.internalLog.setNbMax(nbInternalMax);
        this.errorLog = a4p.ErrorLog;
        this.errorLog.setNbMax(nbErrorMax);

        this.message = '';
        this.read = true;
        this.initDone = false;
    }
    Service.prototype.init = function () {
        if (this.initDone) return;
        this.initDone = true;
        a4p.InternalLog.log('srvLog', "initialized");
    };
    Service.prototype.getUserLog = function () {
        return this.userLog.getLog();
    };
    Service.prototype.getInternalLog = function () {
        return this.internalLog.getLog();
    };
    Service.prototype.getErrorLog = function () {
        return this.errorLog.getLog();
    };

    Service.prototype.logSuccess = function (showUser, msg, details) {
        logMessage(this, showUser, 'success', 5000, msg, details);
    };
    Service.prototype.logInfo = function (showUser, msg, details) {
        logMessage(this, showUser, 'information', 7000, msg, details);
    };
    Service.prototype.logWarning = function (showUser, msg, details) {
        logMessage(this, showUser, 'alert', 15000, msg, details);
    };
    Service.prototype.logError = function (showUser, msg, details) {
        logMessage(this, showUser, 'error', 15000, msg, details);
    };

    Service.prototype.userLogPersistentMessage = function (msg) {
        this.message = msg;
        this.read = false;
        logMessage(this, true, 'alert', false, msg);
    };

    Service.prototype.setInfoRead = function () {
        this.read = true;
    };

    function logMessage(self, showUser, type, timeout, msg, details) {
        if (a4p.isUndefined(msg) || (msg == null)) {
            self.errorLog.log('srvLog', "Warning log message undefined : type=" + type + ", timeout=" + timeout + ", msg=" + msg + ", details=" + details, 2);
        }
        if (showUser) {
            if (typeof(noty) == "function") {
                noty({
                    text:msg,
                    layout:'bottomRight',
                    timeout:timeout,
                    type:type
                });
            }
            self.userLog.log(type + ':' + msg, null, 2);
        }
        if (type == 'error') {
            self.errorLog.log(msg, details, 2);
        } else {
            self.internalLog.log(msg, details, 2);
        }
    }

    return Service;
})();

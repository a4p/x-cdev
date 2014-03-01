'use strict';

var SrvSecurity = (function() {
    function Service(srvLocalStorage) {
        this.srvLocalStorage = srvLocalStorage;
        this.secured = false;// Implies PinCode required
        // TODO : encryption of data in secure mode (file storage and local storage) and hashing of passwords

        // PinCode
        this.expected = '';

        // A4P Login/Password account
        this.login = '';
        this.password = '';
        this.serverToken = '';

        this.initDone = false;
    }
    Service.prototype.init = function () {
        if (this.initDone) return;
        // PinCode
        this.secured = this.srvLocalStorage.get('AuthSecured', false);
        this.expected = this.srvLocalStorage.get('AuthExpected', '');
        this.login = this.srvLocalStorage.get('AuthLogin', '');
        a4p.InternalLog.log('srvSecurity', 'init : login=' + a4pDumpData(this.login, 2));
        this.password = this.srvLocalStorage.get('AuthPassword', '');
        this.serverToken = this.srvLocalStorage.get('AuthServerToken', '');
        this.initDone = true;
        a4p.InternalLog.log('srvSecurity', "initialized");
    };

    Service.prototype.resetPINCode = function () {
    	 this.secured = false;// Implies PinCode required
         // TODO : encryption of data in secure mode (file storage and local storage) and hashing of passwords

         // PinCode
         this.expected = '';

         // PinCode
         this.srvLocalStorage.set('AuthSecured', false);
         this.srvLocalStorage.set('AuthExpected', '');
    };

    Service.prototype.setSecured = function (secured) {
        this.secured = secured;
        this.srvLocalStorage.set('AuthSecured', this.secured);
    };
    Service.prototype.isSecured = function () {
        return this.secured;
    };

    Service.prototype.isVerified = function () {
        return (this.expected.length > 0);
    };
    Service.prototype.register = function (password) {
        // register the password
        a4p.InternalLog.log('srvSecurity', 'authenticate registering new password');
        this.expected = password;
        this.srvLocalStorage.set('AuthExpected', this.expected);
    };
    Service.prototype.verify = function (password) {
        if (password == this.expected) {
            a4p.InternalLog.log('srvSecurity', 'authenticate success');
            return true;
        } else {
            a4p.ErrorLog.log('srvSecurity', 'authenticate failure');
            return false;
        }
    };

    Service.prototype.setDemo = function () {
        this.setA4pLogin('');
        this.setA4pPassword('');
        this.setC4pServerToken('');
    };
    Service.prototype.setA4pLogin = function (login) {
        if (this.login != login) {
            this.login = login;
            this.srvLocalStorage.set('AuthLogin', this.login);
            a4p.InternalLog.log('srvSecurity', 'setA4pLogin : login=' + a4pDumpData(this.login, 2));
        }
        // reset user auth in C4P server
        this.setC4pServerToken('');
    };
    Service.prototype.setA4pPassword = function (password) {
        if (this.password != password) {
            this.password = password;
            this.srvLocalStorage.set('AuthPassword', this.password);
        }
        // reset user auth in C4P server
        this.setC4pServerToken('');
    };
    Service.prototype.setC4pServerToken = function (serverToken) {
        if (this.serverToken != serverToken) {
            this.serverToken = serverToken;
            this.srvLocalStorage.set('AuthServerToken', this.serverToken);
        }
    };
    Service.prototype.getA4pLogin = function () {
        return this.login;
    };
    Service.prototype.getA4pPassword = function () {
        return this.password;
    };

    Service.prototype.getHttpRequestToken = function () {
        var time = Math.floor(new Date().getTime()/1000);// seconds since 1/1/1970
        var md5 = calcMD5(time.toString() + '|' + this.login + '|' + this.password);
        return time + '|' + md5 + '|' + this.serverToken;
    };

    return Service;
})();

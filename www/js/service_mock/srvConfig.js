'use strict';

/***
 Helper - required only_once
 ***/
function checkMocking(mockName, mockClass, originalName, originalClass, skipMockMethods, skipOriginalMehods) {
    for (var om in originalClass.prototype) {
        if (a4p.isDefined(skipOriginalMehods) && (skipOriginalMehods.indexOf(om) >= 0)) continue;
        if (typeof originalClass.prototype[om] == "function" && !mockClass.prototype.hasOwnProperty(om)) {
            throw 'Error : method "' + om + '" is not implemented in '+mockName+' class. You should create it to mock correctly '+originalName+' class.';
        }
    }
    for (var mm in mockClass.prototype) {
        if (a4p.isDefined(skipMockMethods) && (skipMockMethods.indexOf(mm) >= 0)) continue;
        if (typeof mockClass.prototype[mm] == "function" && !originalClass.prototype.hasOwnProperty(mm)) {
            throw 'Error : method "' + mm + '" is still implemented in '+mockName+' class. You should delete it to mock correctly '+originalName+' class.';
        }
    }
}

/***
Stub mock service for "Nu" App
***/
var SrvConfigMock = (function() {
    
    // No config needed ?
    function Service(srvDataTransfer, srvLoad, srvLocalStorage, srvAnalytics) {}
    Service.prototype.initBetaOptions = function () {};
    Service.prototype.init = function () {};
    Service.prototype.setC4pUrlConf = function (c4pUrlConf) {};
    Service.prototype.startLoading = function (callback) {};
    Service.prototype.setTrustAllHosts = function (trustAllHosts) {};
    Service.prototype.setBuildDate = function (date) {};
    Service.prototype.setLicence = function (licence) {};
    Service.prototype.setConfig = function (config) {};
    Service.prototype.setBetaMode = function (isBetaMode) {};
    Service.prototype.setBetaCfgPrm = function (prmKey, flag) {};
    Service.prototype.setPossibleCrms = function (possibleCrms) {};
    Service.prototype.setActiveCrms = function (activeCrms) {};
    Service.prototype.getActiveCrms = function () {};
    Service.prototype.hasActiveRemoteCrm = function () {};
    Service.prototype.setUrlBase = function (c4pUrlBase) {};
    Service.prototype.setNameComposition = function (objectType, idx) {};
    Service.prototype.getNameComposition = function (objectType) {};
    Service.prototype.getItemName = function (item) {};
    Service.prototype.setSizeCss = function (value) {};
    Service.prototype.getSizeCss = function () {};
    Service.prototype.setThemeCss = function (value) {};
    Service.prototype.getThemeCss = function () {};

    return Service;
})();


checkMocking('SrvConfigMock', SrvConfigMock, 'SrvConfig', SrvConfig);


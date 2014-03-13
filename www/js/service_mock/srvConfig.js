'use strict';

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

var SrvConfigMock = (function() {

    // Update synchronously this array with l4p/src/php/c4p/common/Model.php and c4p_html_ang/www/models/local_*.json
    var betaOptions = [
        "exposeCreateAccount",
        "exposeRequestPassword",
        "exposeUserFeedback",
        "exposeFileStorage",
        "exposeDataSynchro",
        "exposeGoogleMap",
        "exposeTimeline",
        "exposeFacetDialog",
        "exposeDraggableHover",
        "exposeDraggableBorder",
        "exposeAllFacets",
        "phoneFormatIfSmall"
    ];

    function Service(srvDataTransfer, srvLoad, srvLocalStorage, srvAnalytics) {
        this.dataTransfer = srvDataTransfer;
        this.srvLoad = srvLoad;
        this.srvLocalStorage = srvLocalStorage;
        this.srvAnalytics = srvAnalytics;
        this.c4pUrlConf = 'models/c4p_conf.json';
        this.c4pUrlBase = '';
        this.c4pUrlForget = this.c4pUrlBase + "/c4p_forget.php";
        this.c4pUrlCreateAccount = this.c4pUrlBase + "/c4p_createAccount.php";
        this.c4pUrlData = this.c4pUrlBase + "/c4p_fill.php";
        this.c4pUrlFullMap = this.c4pUrlBase + "/c4p_fullMap.php";
        this.c4pUrlRefreshMap = this.c4pUrlBase + "/c4p_refreshMap.php";
        this.c4pUrlUpload = this.c4pUrlBase + "/c4p_upload.php";
        this.c4pUrlUploadFile = this.c4pUrlBase + "/c4p_uploadFile.php";
        this.c4pUrlSendEmail = this.c4pUrlBase + "/c4p_sendEmail.php";
        this.c4pUrlSendICal = this.c4pUrlBase + "/c4p_sendICal.php";
        this.c4pUrlShareDoc = this.c4pUrlBase + "/c4p_shareDoc.php";
        this.c4pUrlSfCreate = this.c4pUrlBase + "/c4p_create.php";
        this.c4pUrlSfUpdate = this.c4pUrlBase + "/c4p_update.php";
        this.c4pUrlSfDelete = this.c4pUrlBase + "/c4p_delete.php";
        this.c4pUrlErrorReport = this.c4pUrlBase + "/c4p_errorReport.php";
        this.c4pUrlFeedback = this.c4pUrlBase + "/c4p_feedback.php";
        this.c4pUrlDownload = this.c4pUrlBase + "/c4p_download.php";
        this.c4pUrlPing = this.c4pUrlBase + "/c4p_ping.php";
        this.trustAllHosts = false;
        this.c4pBuildDate = '';
        this.c4pLicence = '';
        this.possibleCrms = ["ios", "c4p"];// list of CRM currently possible
        this.activeCrms = ["ios", "c4p"];// list of CRM activated by User if they are possible
        this.c4pConfig = {
            "exposeBetaFunctionalities": false
        };
        this.nameComposition = {};
        this.sizeCss = '';
        this.themeCss = "c4p-cosmo";

        this.initBetaOptions();

        this.env = 'P';
        this.initDone = false;
    }

    Service.prototype.initBetaOptions = function () {
        for (var i=0, nb=betaOptions.length; i<nb; i++) {
            var key = betaOptions[i];
            if (a4p.isUndefinedOrNull(this.c4pConfig[key])) {
                this.c4pConfig[key] = false;
            }
        }
    };
    Service.prototype.init = function () {
        if (this.initDone) return;
        var urlBase = this.srvLocalStorage.get('UrlBase', '');
        this.setUrlBase(urlBase);
        this.trustAllHosts = this.srvLocalStorage.get('TrustAllHosts', false);
        this.c4pBuildDate = this.srvLocalStorage.get('BuildDate', '');
        this.c4pLicence = this.srvLocalStorage.get('Licence', '');
        this.possibleCrms = this.srvLocalStorage.get('PossibleCrms', ["ios", "c4p"]);
        this.activeCrms = this.srvLocalStorage.get('ActiveCrms', ["ios", "c4p"]);
        this.c4pConfig = this.srvLocalStorage.get('Config', {
            "exposeBetaFunctionalities": false
        });
        this.initBetaOptions();
        this.nameComposition = this.srvLocalStorage.get('NameComposition', {});
        var sizeCss = this.srvLocalStorage.get('SizeCss', '');
        if (sizeCss != '') {
            this.sizeCss = sizeCss;
            var html = document.documentElement;
            html.style.fontSize = this.sizeCss;
            //$('html').css('font-size', this.sizeCss);
        }
        this.themeCss = this.srvLocalStorage.get('ThemeCss', 'c4p-cosmo');

        //TODO app version (Free, Premium, SF ...)
        var appVersion = this.activeCrms.length > 1 ? 'Premium' : 'Free';  
        //GA : set Version ID
        this.srvAnalytics.setVid(this.c4pBuildDate+' '+this.env+' '+appVersion);

        this.initDone = true;
        a4p.InternalLog.log('srvConfig', "initialized");
    };
   /* //test
    Service.prototype.setC4pUrlConf = function (c4pUrlConf) {
        this.c4pUrlConf = c4pUrlConf;
    };
    */
    Service.prototype.startLoading = function (callback) {
        var msg = "Initializing Configuration ...";
        a4p.InternalLog.log('srvConfig', msg);
        this.srvLoad.setStatus(msg);
        this.srvLoad.setError('');
        var self = this;
        var onSuccess = function (response) {
            //response.data, response.status, response.headers
            var msg = "Configuration ready.";
            a4p.InternalLog.log('srvConfig', msg);
            self.srvLoad.setStatus(msg);
            self.srvLoad.setError('');
            if ((self.c4pUrlBase == '') && (self.c4pBuildDate == '')) {
                // First init => we load Configuration file (during next starts we keep LocalStorage values)
                a4p.InternalLog.log('srvConfig', 'First init');
                if (a4p.isDefinedAndNotNull(response.data.possibleCrms)) {
                    self.setPossibleCrms(response.data.possibleCrms);
                }
                if (a4p.isDefinedAndNotNull(response.data.activeCrms)) {
                    self.setActiveCrms(response.data.activeCrms);
                }
                if (a4p.isDefinedAndNotNull(response.data.config)) {
                    self.setConfig(response.data.config);
                }
            }
            // Configuration file always forces buildDate, urlBase, trustAllHosts
            if (a4p.isDefinedAndNotNull(response.data.buildDate)) {
                a4p.InternalLog.log('srvConfig', 'buildDate='+response.data.buildDate);
                self.setBuildDate(response.data.buildDate);
            }
            if (a4p.isDefinedAndNotNull(response.data.urlBase)) {
                a4p.InternalLog.log('srvConfig', 'urlBase='+response.data.urlBase);
                self.setUrlBase(response.data.urlBase);
            }
            if (a4p.isDefinedAndNotNull(response.data.trustAllHosts)) {
                a4p.InternalLog.log('srvConfig', 'trustAllHosts='+response.data.trustAllHosts);
                self.setTrustAllHosts(response.data.trustAllHosts);
            }

            //TODO app version (Free, Premium, SF ...)
            var appVersion = self.activeCrms.length > 1 ? 'Premium' : 'Free';  
            //GA : set Version ID
            self.srvAnalytics.setVid(self.c4pBuildDate+' '+self.env+' '+appVersion);

            callback();
        };
        var onFailure = function (response) {
            //response.data, response.status, response.headers
            var msg = "Initializing Configuration failed : use default values.";
            a4p.InternalLog.log('srvConfig', msg);
            self.srvLoad.setStatus(msg);
            self.srvLoad.setError(response.data);
            callback();
        };
        this.dataTransfer.recvData(this.c4pUrlConf).then(onSuccess, onFailure);
    };
    Service.prototype.setTrustAllHosts = function (trustAllHosts) {
        this.trustAllHosts = trustAllHosts;
        this.srvLocalStorage.set('TrustAllHosts', this.trustAllHosts);
    };
    Service.prototype.setBuildDate = function (date) {
        this.c4pBuildDate = date;
        this.srvLocalStorage.set('BuildDate', this.c4pBuildDate);
    };
    Service.prototype.setLicence = function (licence) {
        this.c4pLicence = licence;
        this.srvLocalStorage.set('Licence', this.c4pLicence);
    };
    Service.prototype.setConfig = function (config) {
        this.c4pConfig = config;
        this.initBetaOptions();
        if (!this.c4pConfig.exposeBetaFunctionalities) this.setBetaMode(false);// Clear all beta parms
        this.srvLocalStorage.set('Config', this.c4pConfig);
    };
    Service.prototype.setBetaMode = function (isBetaMode) {
        this.c4pConfig.exposeBetaFunctionalities = isBetaMode;
        if (!isBetaMode) {
            // Clear all beta parms
            for (var key in this.c4pConfig) {
                if (!this.c4pConfig.hasOwnProperty(key)) continue;
                if (key == 'exposeBetaFunctionalities') continue;
                this.c4pConfig[key] = false;
            }
        }
        this.srvLocalStorage.set('Config', this.c4pConfig);
    };
    Service.prototype.setBetaCfgPrm = function (prmKey, flag) {
        this.c4pConfig[prmKey] = flag;
        this.srvLocalStorage.set('Config', this.c4pConfig);
    };
    Service.prototype.setPossibleCrms = function (possibleCrms) {
        this.possibleCrms = possibleCrms;
        this.srvLocalStorage.set('PossibleCrms', this.possibleCrms);
        for (var crmIdx=this.activeCrms.length-1; crmIdx>= 0; crmIdx--) {
            var key = this.activeCrms[crmIdx];
            if (!isValueInList(this.possibleCrms, key)) {
                removeValueFromList(this.activeCrms, key);
            }
        }
        this.srvLocalStorage.set('ActiveCrms', this.activeCrms);
    };
    Service.prototype.setActiveCrms = function (activeCrms) {
        this.activeCrms = activeCrms.slice(0);
        for (var crmIdx=this.activeCrms.length-1; crmIdx>= 0; crmIdx--) {
            var key = this.activeCrms[crmIdx];
            if (!isValueInList(this.possibleCrms, key)) {
                removeValueFromList(this.activeCrms, key);
            }
        }
        this.srvLocalStorage.set('ActiveCrms', this.activeCrms);
    };
    Service.prototype.getActiveCrms = function () {
        return this.activeCrms;
    };
    Service.prototype.hasActiveRemoteCrm = function () {
        if (isValueInList(this.activeCrms, 'ios')) {
            return (this.activeCrms.length > 1);
        } else {
            return (this.activeCrms.length > 0);
        }
    };
    Service.prototype.setUrlBase = function (c4pUrlBase) {
        this.c4pUrlBase = c4pUrlBase;
        this.c4pUrlForget = this.c4pUrlBase + "/c4p_forget.php";
        this.c4pUrlCreateAccount = this.c4pUrlBase + "/c4p_createAccount.php";
        this.c4pUrlData = this.c4pUrlBase + "/c4p_fill.php";
        this.c4pUrlFullMap = this.c4pUrlBase + "/c4p_fullMap.php";
        this.c4pUrlRefreshMap = this.c4pUrlBase + "/c4p_refreshMap.php";
        this.c4pUrlUpload = this.c4pUrlBase + "/c4p_upload.php";
        this.c4pUrlUploadFile = this.c4pUrlBase + "/c4p_uploadFile.php";
        this.c4pUrlSendEmail = this.c4pUrlBase + "/c4p_sendEmail.php";
        this.c4pUrlSendICal = this.c4pUrlBase + "/c4p_sendICal.php";
        this.c4pUrlShareDoc = this.c4pUrlBase + "/c4p_shareDoc.php";
        this.c4pUrlSfCreate = this.c4pUrlBase + "/c4p_create.php";
        this.c4pUrlSfUpdate = this.c4pUrlBase + "/c4p_update.php";
        this.c4pUrlSfDelete = this.c4pUrlBase + "/c4p_delete.php";
        this.c4pUrlErrorReport = this.c4pUrlBase + "/c4p_errorReport.php";
        this.c4pUrlFeedback = this.c4pUrlBase + "/c4p_feedback.php";
        this.c4pUrlDownload = this.c4pUrlBase + "/c4p_download.php";
        this.c4pUrlPing = this.c4pUrlBase + "/c4p_ping.php";
        if (this.c4pUrlBase.indexOf('ssl15.ovh.net') > -1) {
            if (this.c4pUrlBase.indexOf('~appsprok') > -1) {
                this.env = 'D';
            } else if (this.c4pUrlBase.indexOf('~appspron') > -1) {
                this.env = 'D';
            } else {
                this.env = 'P';
            }
        } else if ((this.c4pUrlBase.indexOf('apps4pro.net') > -1)) {
            this.env = 'D';
        } else if ((this.c4pUrlBase.indexOf('apps4pro.biz') > -1)) {
            this.env = 'D';
        } else if ((this.c4pUrlBase.indexOf('apps4pro.com') > -1)) {
            this.env = 'P';
        } else if ((this.c4pUrlBase.indexOf('apps4pro.eu') > -1)) {
            this.env = 'P';
        } else if ((this.c4pUrlBase.indexOf('ssl14.ovh.net') > -1)) {
            this.env = 'P';
        } else if ((this.c4pUrlBase.indexOf('http://127.0.0.1') > -1)) {
            this.env = 'L';
        } else if ((this.c4pUrlBase.indexOf('https://127.0.0.1') > -1)) {
            this.env = 'LS';
        } else if ((this.c4pUrlBase.indexOf('http://192.168.') > -1)) {
            this.env = 'L';
        } else if ((this.c4pUrlBase.indexOf('https://192.168.') > -1)) {
            this.env = 'LS';
        } else {
            this.env = 'P';
        }

        //TODO MLE ??? if (this.env != 'P') {this.srvAnalytics.setEnable(false);} //GA only in PROD env

        this.srvLocalStorage.set('UrlBase', this.c4pUrlBase);
    };

    Service.prototype.setNameComposition = function (objectType, idx) {
        this.nameComposition[objectType] = idx;
        this.srvLocalStorage.set('NameComposition', this.nameComposition);
    };
    Service.prototype.getNameComposition = function (objectType) {
        return this.nameComposition[objectType] || 0;
    };

    Service.prototype.getItemName = function (item) {
        var result = '';
        if ((item != null) && a4p.isDefined(c4p.Model.a4p_types[item.a4p_type])) {
            // concat names
            var idx = this.nameComposition[item.a4p_type] || 0;
            var nameList =  c4p.Model.a4p_types[item.a4p_type].displayNameList[idx];

            if (nameList) {
                for (var fieldNameIdx = 0; fieldNameIdx < nameList.length; fieldNameIdx++) {
                    var fieldName = nameList[fieldNameIdx];
                    result = result + ' ' + item[fieldName];
                }
                result = result.trim();
            }
        }
        return result;
    };

    Service.prototype.setSizeCss = function (value) {
        this.sizeCss = value;
        this.srvLocalStorage.set('SizeCss', this.sizeCss);
        var html = document.documentElement;
        html.style.fontSize = this.sizeCss;
        //$('html').css('font-size', value);
    };
    Service.prototype.getSizeCss = function () {
        return this.sizeCss || '';
    };

    Service.prototype.setThemeCss = function (value) {
        this.themeCss = value;
        this.srvLocalStorage.set('ThemeCss', this.themeCss);
    };
    Service.prototype.getThemeCss = function () {
        return this.themeCss || 'c4p-cosmo';
    };

    return Service;
})();


checkMocking('SrvConfigMock', SrvConfigMock, 'SrvConfig', SrvConfig);


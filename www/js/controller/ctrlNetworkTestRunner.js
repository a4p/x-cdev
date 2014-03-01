'use strict';

function networkTestRunnerCtrl($scope, $q, $location, $http, $dialog, version, srvLoad, srvLocalStorage, srvFileStorage, srvAnalytics, srvConfig, srvLog, srvLocale, srvData, srvRunning, srvSecurity, srvSynchro, cordovaReady, srvLink, srvNav, srvGuider, srvFacet) {
    $scope.todo = [];
    $scope.tests = [];
    $scope.status = 'No test started';
    $scope.status2 = '';

    $scope.initialized = false;// to call init() only once
    $scope.fileStorageType = null;
    $scope.fileStorageQuota = 4 * 1024 * 1024 * 1024;// 4 Go

    $scope.currentIdx = $scope.todo.length;// No test running

    $scope.networkDataListener = srvData.addListenerOnUpdate(function (callbackId, action, type, id) {
        a4p.safeApply($scope, function() {
            if (action == 'clear') {
                $scope.status2 = 'srvData has cleared';
            } else if (action == 'remove') {
                $scope.status2 = 'srvData has removed ' + type + ' ' + id;
            } else if (action == 'set') {
                $scope.status2 = 'srvData has updated ' + type + ' ' + id;
            } else if (action == 'add') {
                $scope.status2 = 'srvData has created ' + type + ' ' + id;
            }
        });
    });

    $scope.networkSynchroStartListener = srvSynchro.addListenerOnStart('networkTestRunner', function (callbackId, reqId, reqCtx, reqNbTry) {
        a4p.safeApply($scope, function() {
            $scope.synchroStart = {id:reqId, ctx:reqCtx, nbTry:reqNbTry};
        });
    });
    $scope.networkSynchroErrorListener = srvSynchro.addListenerOnError('networkTestRunner', function (callbackId, reqId, reqCtx, reqNbTry, message) {
        a4p.safeApply($scope, function() {
            $scope.synchroError = {id:reqId, ctx:reqCtx, nbTry:reqNbTry, message:message};
        });
    });
    $scope.networkSynchroCancelListener = srvSynchro.addListenerOnCancel('networkTestRunner', function (callbackId, reqId, reqCtx, reqNbTry) {
        a4p.safeApply($scope, function() {
            $scope.synchroCancel = {id:reqId, ctx:reqCtx, nbTry:reqNbTry};
        });
    });
    $scope.networkSynchroSuccessListener = srvSynchro.addListenerOnSuccess('networkTestRunner', function (callbackId, reqId, reqCtx, reqNbTry, responseCode, responseData, responseHeaders) {
        a4p.safeApply($scope, function() {
            $scope.synchroSuccess = {id:reqId, ctx:reqCtx, nbTry:reqNbTry, code:responseCode, data:responseData, headers:responseHeaders};
        });
    });

    $scope.$on('$destroy', function (event) {
        srvData.cancelListener($scope.networkDataListener);
        srvSynchro.cancelListener($scope.networkSynchroStartListener);
        srvSynchro.cancelListener($scope.networkSynchroErrorListener);
        srvSynchro.cancelListener($scope.networkSynchroCancelListener);
        srvSynchro.cancelListener($scope.networkSynchroSuccessListener);
    });

    $scope.run = function () {
        $scope.init().then(function() {
            $scope.tests = [];
            $scope.runTest(0);
        }, function(response) {
            $scope.tests.push({title: 'init', ok: false, log: response.error + ' => All tests aborted'});
        });
    };

    $scope.runTest = function (idx) {
        a4p.safeApply($scope, function() {
            if (idx < $scope.todo.length) {
                $scope.currentIdx = idx;
                var test = $scope.todo[idx];
                $scope.status = 'Running test ' + idx + ' (' + test.name + ') : ';
                $scope.status2 = '';
                a4p.InternalLog.log('Test#' + $scope.currentIdx, 'starting test');
                test.fct();
                //$scope[test.name](test.options);
            } else {
                $scope.currentIdx = idx;
                $scope.status = 'All tests finished';
                $scope.status2 = '';
            }
        });
    };

    $scope.success = function () {
        a4p.safeApply($scope, function() {
            var test = $scope.todo[$scope.currentIdx];
            $scope.tests.push({title: test.name, ok: true, log: ''});
            a4p.InternalLog.log('Test#' + $scope.currentIdx, 'success');

            setTimeout((function (scope, idx) {
                return function () {
                    scope.runTest(idx);
                };
            })($scope, $scope.currentIdx + 1), 1000);
        });
    };
    $scope.failure = function (log) {
        a4p.safeApply($scope, function() {
            var test = $scope.todo[$scope.currentIdx];
            $scope.tests.push({title: test.name, ok: false, log: log});
            a4p.InternalLog.log('Test#' + $scope.currentIdx, 'failure : ' + log);

            setTimeout((function (scope, idx) {
                return function () {
                    scope.runTest(idx);
                };
            })($scope, $scope.currentIdx + 1), 1000);
        });
    };

    // Initialization functions

    $scope.init = function() {
        var deferred = $q.defer();

        if ($scope.initialized) {
            deferred.resolve();
            return deferred.promise;
        }
        $scope.initialized = true;
        // We must wait for dom, cache & cordova ready before initializing this controller because cache can provoque a document.reload()
        var startApplication = function() {
            a4p.safeApply($scope, function() {
                initLocalStorage($scope, deferred);
            });
        };
        cordovaReady(startApplication)();// We HOPE that Cordova is ready !!!!
        return deferred.promise;
    };
    function initLocalStorage(scope, deferred) {
        scope.loadLocalStorage();
        initConfig(scope, deferred);
    }
    function initConfig(scope, deferred) {
        a4p.InternalLog.log('testCtrl', 'srvConfig.startLoading');
        srvConfig.setC4pUrlConf('../../www/models/c4p_conf.json');
        srvConfig.startLoading(function() {
            a4p.safeApply(scope, function() {
                initLocale(scope, deferred);
            });
        });
    }
    function initLocale(scope, deferred) {
        a4p.InternalLog.log('testCtrl', 'srvLocale.startLoading');
        srvLocale.setLocaleDir('../../www/');
        srvLocale.startLoading(function () {
            a4p.safeApply(scope, function() {
                initFileStorage(scope, deferred);
            });
        });
    }
    function initFileStorage(scope, deferred) {
        a4p.InternalLog.log('testCtrl', 'srvFileStorage.init');
        srvFileStorage.init().then(
            function () {
                a4p.safeApply(scope, function() {
                    initData(scope, deferred);
                });
            }, function (message) {
                a4p.safeApply(scope, function() {
                    deferred.reject({error:message});
                });
            });
    }
    function initData(scope, deferred) {
        a4p.InternalLog.log('testCtrl', 'initData');
        scope.loadLocalStorage();
        srvData.init();// Must be initialized() AFTER srvSynchro,
        scope.initFinished(deferred);
    }

    $scope.loadLocalStorage = function () {
        srvConfig.init();
        srvLog.init();
        srvLocale.init();
        srvSecurity.init();
    };
    $scope.initFinished = function (deferred) {
        a4p.safeApply($scope, function() {
            a4p.InternalLog.log('testCtrl', 'init finished');
            deferred.resolve();

            // Start network requests from srvData
            srvData.start();
            srvData.clear();
        });
    };

    // Helper functions

    function getObjectFromList(list, crm, id) {
        if (a4p.isUndefinedOrNull(list)) return false;
    	for (var i = list.length - 1; i >= 0; i--) {
            var a4p_type = list[i].a4p_type;
            var crmObjects = list[i].crmObjects;
            if (a4p.isUndefinedOrNull(crmObjects)) return false;
            for (var j = crmObjects.length - 1; j >= 0; j--) {
                var crmObject = crmObjects[j];
                if (a4p.isDefined(crmObject.crmId) && (crmObject.crmId.crm == crm) && (crmObject.crmId.id == id)) {
                    return crmObject;
                }
            }
    	}
        return false;
    }

    function openChildBrowser(url, extension, onLocationChange, onClose) {

        var closeChildBrowserAfterLocationChange = false;// To NOT call onClose() if onLocationChange() has been called
    	if (!window.device){
            // Chrome case
            // We can not bind on window events because Salesforce page modify/erase our event bindings.
    		var new_window = window.open(url, '_blank', 'menubar=no,scrollbars=yes,resizable=1,height=400,width=600');
            var initialLocation = undefined;
            var initialUrl = undefined;
            if (a4p.isDefined(new_window.location)) {
                initialLocation = new_window.location.href;
            }
            if (a4p.isDefined(new_window.document)) {
                initialUrl = new_window.document.URL;
            }
            a4p.InternalLog.log('openChildBrowser', 'initialLocation=' + initialLocation + ' initialUrl=' + initialUrl);
            var locationChanged = false;
    		//if (onLocationChange) new_window.onbeforeunload = onLocationChange;
            var new_window_tracker = function () {
                if (a4p.isDefined(new_window.location)
                    && (typeof new_window.location.href == "string")) {
                    a4p.InternalLog.log('openChildBrowser', 'new location=' + new_window.location.href);
                } else if (a4p.isDefined(new_window.document)
                    && (typeof new_window.document.URL == "string")) {
                    a4p.InternalLog.log('openChildBrowser', 'new url=' + new_window.document.URL);
                }
                if (!locationChanged) {
                    if (a4p.isDefined(new_window.location)
                        && (typeof new_window.location.href == "string")
                        && (initialLocation != new_window.location.href)) {
                        a4p.InternalLog.log('openChildBrowser', 'new location=' + new_window.location.href);
                        locationChanged = true;
                        setTimeout(new_window_tracker, 100);
                        return;
                    } else if (a4p.isDefined(new_window.document)
                        && (typeof new_window.document.URL == "string")
                        && (initialUrl != new_window.document.URL)) {
                        a4p.InternalLog.log('openChildBrowser', 'new url=' + new_window.document.URL);
                        locationChanged = true;
                        setTimeout(new_window_tracker, 100);
                        return;
                    }
                } else {
                    if (a4p.isDefined(new_window.location)
                        && (typeof new_window.location.href == "string")
                        && (new_window.location.href.indexOf('about:blank') >= 0)) {
                        a4p.InternalLog.log('openChildBrowser', 'onLocationChange');
                        if (onLocationChange) onLocationChange();
                        closeChildBrowserAfterLocationChange = true;
                        new_window.close();
                        return;
                    } else if (a4p.isDefined(new_window.document)
                        && (typeof new_window.document.URL == "string")
                        && (new_window.document.URL.indexOf('about:blank') >= 0)) {
                        a4p.InternalLog.log('openChildBrowser', 'onUrlChange');
                        if (onLocationChange) onLocationChange();
                        closeChildBrowserAfterLocationChange = true;
                        new_window.close();
                        return;
                    }
                }
                if (new_window.closed) {
                    a4p.InternalLog.log('openChildBrowser', 'onClose');
                    if (!closeChildBrowserAfterLocationChange) {
                        if (onClose) onClose();
                    }
                    return;
                }
                a4p.InternalLog.log('openChildBrowser', 'track locationChanged=' + locationChanged);
                setTimeout(new_window_tracker, 100);
            };
            setTimeout(new_window_tracker, 100);
    		return;
    	}

    	if(window.device){
    		var ref = window.open(url, '_blank', 'location=yes');
    	    ref.addEventListener('loadstart', function(e){
    	    	//alert('loadstart '+e.url);
    	    });
    	    ref.addEventListener('loadstop', function(e){
    	    	//alert('loadstop '+e.url);
    	        if (typeof e.url == "string" && e.url.indexOf("about:blank") >= 0) {
    	        	closeChildBrowserAfterLocationChange = true;
    	            if (onLocationChange) onLocationChange();
    	            	ref.close();
    	        }
    	    });
    	    ref.addEventListener('loaderror', function(e){
    	    	//alert('loaderror '+e.url);
    	    });
    	    ref.addEventListener('exit', function(e){
    	    	//alert('exit '+e.url);
    	    	if(!closeChildBrowserAfterLocationChange){
    	    		if (onClose) onClose();
    	        }
    	    });
    	}
    }

    $scope.badLoginUser = function (testName) {
        var userFeedback = {
            company_name: 'apps4pro',
            phone: '01.23.45.67.89',
            feedback: 'test network',
            star: ''
        };
        srvData.loginUser(false, 'mat@apps4pro.com', 'dummy', '', true, userFeedback, 'v01')
                .then(function () {
                    $scope.failure("login should not succeed");
                }, function (response) {
                    if (response.error) {
                        if (response.error != 'htmlMsgInvalidPassword') {
                            $scope.failure("login should not fail with error " + response.error);
                        } else {
                            $scope.success();
                        }
                    } else {//if (response.urlBase)
                        $scope.failure("loginUser should fail with InvalidPassword instead of urlBase changed to " + response.urlBase);
                    }
                });
    };
    $scope.loginUser = function (testName) {
        var userFeedback = {
            company_name: 'apps4pro',
            phone: '01.23.45.67.89',
            feedback: 'test network',
            star: ''
        };
        srvData.loginUser(false, 'mat@apps4pro.com', 'apps4pro', '', true, userFeedback, 'v01')
                .then(function () {
                    a4p.InternalLog.log(testName, 'loginUser done');
                    setTimeout(function() {
                        $scope.forcePossibleCrms(testName).then(function () {
                            $scope.success();
                        }, function (message) {
                            $scope.failure(message);
                        });
                    }, 1000);
                }, function (response) {
                    if (response.error) {
                        $scope.failure("loginUser error " + response.error + ' ' + response.log);
                    } else {//if (response.urlBase)
                        $scope.failure("loginUser urlBase changed to " + response.urlBase);
                    }
                });
    };

    $scope.waitFor = function (timeMs) {
        var deferred = $q.defer();
        var timeStart = new Date().getTime();
        var timer = function waitForSomeSecond() {
            a4p.safeApply($scope, function() {
                a4p.safeApply($scope, function() {
                    var nb = new Date().getTime() - timeStart;
                    if (timeMs <= nb) {
                        deferred.resolve();
                    } else {
                        //a4p.InternalLog.log('waitSynchronized', 'tick');
                        $scope.status2 = 'Still '
                                + ((timeMs - nb)/1000) + ' seconds to wait for';
                        setTimeout(function() { timer(); }, 1000);
                    }
                });
            });
        };
        setTimeout(function() { timer(); }, 1000);
        return deferred.promise;
    };

    $scope.waitSynchroDone = function () {
        var deferred = $q.defer();
        var timer = function waitForSomeSecond() {
            a4p.safeApply($scope, function() {
                if ((srvSynchro.nbPendingRequests() == 0)) {
                    deferred.resolve();
                } else {
                    //a4p.InternalLog.log('waitSynchroDone', 'tick');
                    $scope.status2 = 'Still '
                            + srvSynchro.nbPendingRequests() + ' pending requests in srvSynchro';
                    setTimeout(function() { timer(); }, 1000);
                }
            });
        };
        setTimeout(function() { timer(); }, 1000);
        return deferred.promise;
    };

    $scope.forcePossibleCrms = function (testName) {
        var deferred = $q.defer();
        // BEWARE : Force 'ios' and 'c4p' in possibleCrms whatever the server answers
        srvConfig.setPossibleCrms(['ios', 'c4p', 'sf']);
        srvConfig.setActiveCrms(['ios', 'c4p']);
        // setPossibleCrms(['ios', 'c4p', 'sf']) in C4P CRM because a4p_login.php sets it to ['ios'] only
        var ctx = {};
        // reset listening data
        $scope.synchroStart = null;
        $scope.synchroError = null;
        $scope.synchroCancel = null;
        $scope.synchroSuccess = null;

        srvSynchro.addRequest('networkTestRunner', ctx,
            'https://admin:admin@127.0.0.1/c4p_server/www/_admin/setUserConfig.php',
            'POST',
            {
                login:'mat@apps4pro.com',
                setting:'on',
                possibleDevice:'checked',
                possibleApps4Pro:'checked',
                possibleSalesforce:'checked'
            });
        $scope.waitSynchroDone().then(function() {
            if (a4p.isUndefinedOrNull($scope.synchroStart)) {
                //$scope.failure('forcePossibleCrms not started');
                deferred.reject('forcePossibleCrms not started');
            }
            if (a4p.isDefinedAndNotNull($scope.synchroError)) {
                //$scope.failure('forcePossibleCrms failed : ' + $scope.synchroError.message);
                deferred.reject('forcePossibleCrms failed : ' + $scope.synchroError.message);
            }
            if (a4p.isDefinedAndNotNull($scope.synchroCancel)) {
                //$scope.failure('forcePossibleCrms cancelled');
                deferred.reject('forcePossibleCrms cancelled');
            }
            if (a4p.isUndefinedOrNull($scope.synchroSuccess)) {
                //$scope.failure('forcePossibleCrms not succeed');
                deferred.reject('forcePossibleCrms not succeed');
            }
            if ($scope.synchroSuccess.code != 200) {
                //$scope.failure('forcePossibleCrms failed : code=' + $scope.synchroSuccess.code);
                deferred.reject('forcePossibleCrms failed : code=' + $scope.synchroSuccess.code);
            }
            if ($scope.synchroSuccess.data.search('Use Device CRM = 1') < 0) {
                //$scope.failure('forcePossibleCrms failed : Device CRM not possible');
                deferred.reject('forcePossibleCrms failed : Device CRM not possible');
            }
            if ($scope.synchroSuccess.data.search('Use Apps4Pro CRM = 1') < 0) {
                //$scope.failure('forcePossibleCrms failed : Apps4Pro CRM not possible');
                deferred.reject('forcePossibleCrms failed : Apps4Pro CRM not possible');
            }
            if ($scope.synchroSuccess.data.search('Use Salesforce CRM = 1') < 0) {
                //$scope.failure('forcePossibleCrms failed : Salesforce CRM not possible');
                deferred.reject('forcePossibleCrms failed : Salesforce CRM not possible');
            }
            a4p.InternalLog.log(testName, 'forcePossibleCrms done');
            setTimeout(function() {
                $scope.downloadFullMap(testName).then(function () {
                    //$scope.success();
                    deferred.resolve();
                }, function (message) {
                    //$scope.failure(message);
                    deferred.reject(message);
                });
            }, 1000);
        }, function(response) {
            //$scope.failure('forcePossibleCrms failed');
            deferred.reject('forcePossibleCrms failed');
        });
        return deferred.promise;
    };

    $scope.downloadFullMap = function (testName) {
        var deferred = $q.defer();
        srvData.downloadFullMap(srvSecurity.getHttpRequestToken())
            .then(function (fullmap) {
                a4p.InternalLog.log(testName, 'downloadFullMap done');
                //$scope.success();
                deferred.resolve();
            }, function (response) {
                if (response.error) {
                    //$scope.failure("downloadFullMap error " + response.error + ' ' + response.log);
                    deferred.reject("downloadFullMap error " + response.error + ' ' + response.log);
                } else if (response.redirect) {
                    var onClose = function () {
                        //$scope.failure("onLoginCancel");
                        deferred.reject("onLoginCancel");
                    };
                    var onLocationChange = function () {
                        a4p.InternalLog.log(testName, "onLoginSuccess => retry downloadFullMap");
                        $scope.downloadFullMap(testName).then(function () {
                            deferred.resolve();
                        }, function (message) {
                            deferred.reject(message);
                        });
                    };
                    openChildBrowser(response.redirect, 'url', onLocationChange, onClose);
                } else {// if (response.nop)
                    //$scope.failure("downloadFullMap empty");
                    deferred.reject("downloadFullMap empty");
                }
            });
        return deferred.promise;
    };

    $scope.waitSynchronized = function () {
        var deferred = $q.defer();
        var timer = function waitForSomeSecond() {
            a4p.safeApply($scope, function() {
                if ((srvData.objectsToDownload.length == 0) && (srvData.objectsToSave.length == 0)) {
                    deferred.resolve();
                } else {
                    //a4p.InternalLog.log('waitSynchronized', 'tick');
                    $scope.status2 = 'Still '
                            + srvData.objectsToDownload.length + ' objects to download and '
                            + srvData.objectsToSave.length + ' objects to upload';
                    setTimeout(function() { timer(); }, 1000);
                }
            });
        };
        setTimeout(function() { timer(); }, 1000);
        return deferred.promise;
    };

    $scope.refreshMap = function (dataListener) {
        var deferred = $q.defer();
        setTimeout(function() {
            srvData.refreshFullMap(srvSecurity.getHttpRequestToken()).then(function(refreshMap) {
                srvData.cancelListener(dataListener);
                deferred.resolve(refreshMap);
            }, function(response) {
                srvData.cancelListener(dataListener);
                deferred.reject(response);
            })
        }, 1000);
        return deferred.promise;
    };

    // Tests functions

    $scope.todo.push({name: 'test Success', fct: function() {
        $scope.success();
    }});

    $scope.todo.push({name: 'test Bad Login', fct: function() {
        $scope.badLoginUser();
    }});

    $scope.todo.push({name: 'test Login (srvData will download any Document in the Map)', fct: function() {
        $scope.loginUser();
    }});

    $scope.todo.push({name: 'wait for all downloads/uploads done', fct: function() {
        $scope.waitSynchronized().then(function() {
            if (a4p.isUndefined(srvData.userObject) || (srvData.userObject.email != 'mat@apps4pro.com')) {
                // User 'mat@apps4pro.com' should have been created
                $scope.failure("User 'mat@apps4pro.com' is not found in srvData");
            } else if (a4p.isUndefined(srvData.favoritesObject) || (srvData.favoritesObject.name != srvLocale.translations.htmlFavorites)) {
                // Facet srvLocale.translations.htmlFavorites should have been created
                $scope.failure("Facet '" + srvLocale.translations.htmlFavorites + "' is not found in srvData");
            } else {
                $scope.success();
            }
        }, function(response) {
            $scope.failure(response.error);
        });
    }});

    $scope.todo.push({name: 'test C4P Facet creation', fct: function() {
        var dataActions = {clear:[], remove:[], set:[], add:[]};
        var dataListener = srvData.addListenerOnUpdate(function (callbackId, action, type, id) {
            a4p.InternalLog.log('refreshMap', action + ' ' + type + ' ' + id);
            if (action == 'clear') {
                dataActions.clear.push(id);
            } else if (action == 'remove') {
                dataActions.remove.push(id);
            } else if (action == 'set') {
                dataActions.set.push(id);
            } else if (action == 'add') {
                dataActions.add.push(id);
            }
        });
        $scope.facet = srvData.createObject('Facet', {
            prefix:'',
            name:'FacetName',
            description:'Descriptif'
        });

        srvData.addAndSaveObject($scope.facet);
        $scope.waitSynchronized().then(function() {
            $scope.refreshMap(dataListener).then(function(refreshMap) {
                if (!getObjectFromList(refreshMap.updates, 'c4p', $scope.facet.id.c4p_id)) {
                    $scope.failure("Facet newly created is not found in refreshMap");
                } else if (!isValueInList(dataActions.set, $scope.facet.id.dbid)) {
                    $scope.failure("Facet newly created is not found in dataActions");
                } else {
                    $scope.success();
                }
            }, function(response) {
                if (response.error) {
                    $scope.failure("refreshMap error " + response.error + ' ' + response.log);
                } else if (response.redirect) {
                    $scope.failure("refreshMap failure, redirect to " + response.redirect);
                } else {
                    $scope.failure("refreshMap empty");
                }
            });
        }, function(response) {
            $scope.failure('waiting for all downloads/uploads failed : ' + response.error);
        });
    }});

    $scope.todo.push({name: 'test C4P Facet update', fct: function() {
        var dataActions = {clear:[], remove:[], set:[], add:[]};
        var dataListener = srvData.addListenerOnUpdate(function (callbackId, action, type, id) {
            a4p.InternalLog.log('refreshMap', action + ' ' + type + ' ' + id);
            if (action == 'clear') {
                dataActions.clear.push(id);
            } else if (action == 'remove') {
                dataActions.remove.push(id);
            } else if (action == 'set') {
                dataActions.set.push(id);
            } else if (action == 'add') {
                dataActions.add.push(id);
            }
        });
        $scope.facet.description = 'Second descriptif';
        srvData.setAndSaveObject($scope.facet);
        $scope.waitSynchronized().then(function() {
            $scope.refreshMap(dataListener).then(function(refreshMap) {
                if (!getObjectFromList(refreshMap.updates, 'c4p', $scope.facet.id.c4p_id)) {
                    $scope.failure("Facet newly updated is not found in refreshMap");
                } else if (!isValueInList(dataActions.set, $scope.facet.id.dbid)) {
                    $scope.failure("Facet newly updated is not found in dataActions");
                } else {
                    $scope.success();
                }
            }, function(response) {
                if (response.error) {
                    $scope.failure("refreshMap error " + response.error + ' ' + response.log);
                } else if (response.redirect) {
                    $scope.failure("refreshMap failure, redirect to " + response.redirect);
                } else {
                    $scope.failure("refreshMap empty");
                }
            });
        }, function(response) {
            $scope.failure('waiting for all downloads/uploads failed : ' + response.error);
        });
    }});

    $scope.todo.push({name: 'test C4P Many objects creation', fct: function() {
        var dataActions = {clear:[], remove:[], set:[], add:[]};
        var dataListener = srvData.addListenerOnUpdate(function (callbackId, action, type, id) {
            a4p.InternalLog.log('refreshMap', action + ' ' + type + ' ' + id);
            if (action == 'clear') {
                dataActions.clear.push(id);
            } else if (action == 'remove') {
                dataActions.remove.push(id);
            } else if (action == 'set') {
                dataActions.set.push(id);
            } else if (action == 'add') {
                dataActions.add.push(id);
            }
        });

        $scope.account1 = srvData.createObject('Account', {
            company_name:'NetworkTestRunner account',
            phone:'(33) 01 47 55 78',
            annual_revenue:125000,
            nb_employees:145,
            industry:'Electronics',
            description:'NetworkTestRunner account description'
        });
        srvData.addObject($scope.account1);

        $scope.contact1 = srvData.createObject('Contact', {
            salutation:'Mr',
            first_name:'Alain',
            last_name:'Porthus',
            title:'Director',
            email:'aporthus@ntr.com'
        });
        srvData.addObject($scope.contact1);
        srvData.linkToItem('Contact', 'accounter', [$scope.contact1], $scope.account1);

        $scope.opportunity1 = srvData.createObject('Opportunity', {
            name:'Software CRM',
            stage:'Prospecting',
            amount:5400,
            probability:75,
            description:'CRM software selling'
        });
        srvData.addObject($scope.opportunity1);
        srvData.linkToItem('Opportunity', 'accounter', [$scope.opportunity1], $scope.account1);

        $scope.event1 = srvData.createObject('Event', {
            name:'NetworkTestRunner 2 hours event',
            location:'Tours',
            date_start:'2014-07-01 12:00:00',
            date_end:'2014-07-01 14:00:00',
            description:'NetworkTestRunner 2 hours event description'
        });
        srvData.addObject($scope.event1);
        srvData.linkToItem('Event', 'leader', [$scope.event1], $scope.contact1);

        $scope.task1 = srvData.createObject('Task', {
            name:'NetworkTestRunner task',
            date_start:'2014-07-01 00:00:00',
            description:'NetworkTestRunner task description'
        });
        srvData.addObject($scope.task1);
        srvData.linkToItem('Task', 'leader', [$scope.task1], $scope.contact1);

        $scope.note1 = srvData.createObject('Note', {
            title:'NetworkTestRunner note1',
            message:'Recall after Christmas',
            description:'NetworkTestRunner note1 description'
        });
        srvData.addObject($scope.note1);
        srvData.linkToItem('Note', 'parent', [$scope.note1], $scope.event1);

        $scope.report1 = srvData.createObject('Report', {
            title:'NetworkTestRunner report1',
            message:'Report of yesterday',
            ratings:{code:'Feeling', name:'Feeling', type:'star', value: 0},
            description:'NetworkTestRunner report1 description'
        });
        srvData.addObject($scope.report1);
        srvData.linkToItem('Report', 'parent', [$scope.report1], $scope.event1);

        srvData.addObjectToSave($scope.account1.a4p_type, $scope.account1.id.dbid);
        srvData.addObjectToSave($scope.contact1.a4p_type, $scope.contact1.id.dbid);
        srvData.addObjectToSave($scope.opportunity1.a4p_type, $scope.opportunity1.id.dbid);
        srvData.addObjectToSave($scope.event1.a4p_type, $scope.event1.id.dbid);
        srvData.addObjectToSave($scope.task1.a4p_type, $scope.task1.id.dbid);
        srvData.addObjectToSave($scope.note1.a4p_type, $scope.note1.id.dbid);
        srvData.addObjectToSave($scope.report1.a4p_type, $scope.report1.id.dbid);

        $scope.waitSynchronized().then(function() {
            $scope.refreshMap(dataListener).then(function(refreshMap) {
                if (!getObjectFromList(refreshMap.updates, 'c4p', $scope.account1.id.c4p_id)) {
                    $scope.failure("Account newly created is not found in refreshMap");
                } else if (!isValueInList(dataActions.set, $scope.account1.id.dbid)) {
                    $scope.failure("Account newly created is not found in dataActions");
                } else if (!getObjectFromList(refreshMap.updates, 'c4p', $scope.contact1.id.c4p_id)) {
                    $scope.failure("Contact newly created is not found in refreshMap");
                } else if (!isValueInList(dataActions.set, $scope.contact1.id.dbid)) {
                    $scope.failure("Contact newly created is not found in dataActions");
                } else if (!getObjectFromList(refreshMap.updates, 'c4p', $scope.opportunity1.id.c4p_id)) {
                    $scope.failure("Opportunity newly created is not found in refreshMap");
                } else if (!isValueInList(dataActions.set, $scope.opportunity1.id.dbid)) {
                    $scope.failure("Opportunity newly created is not found in dataActions");
                } else if (!getObjectFromList(refreshMap.updates, 'c4p', $scope.event1.id.c4p_id)) {
                    $scope.failure("Event newly created is not found in refreshMap");
                } else if (!getObjectFromList(refreshMap.updates, 'c4p', $scope.task1.id.c4p_id)) {
                    $scope.failure("Task newly created is not found in refreshMap");
                } else if (!isValueInList(dataActions.set, $scope.event1.id.dbid)) {
                    $scope.failure("Event newly created is not found in dataActions");
                } else if (!isValueInList(dataActions.set, $scope.task1.id.dbid)) {
                    $scope.failure("Task newly created is not found in dataActions");
                } else if (!getObjectFromList(refreshMap.updates, 'c4p', $scope.note1.id.c4p_id)) {
                    $scope.failure("Note newly created is not found in refreshMap");
                } else if (!isValueInList(dataActions.set, $scope.note1.id.dbid)) {
                    $scope.failure("Note newly created is not found in dataActions");
                } else if (!getObjectFromList(refreshMap.updates, 'c4p', $scope.report1.id.c4p_id)) {
                    $scope.failure("Report newly created is not found in refreshMap");
                } else if (!isValueInList(dataActions.set, $scope.report1.id.dbid)) {
                    $scope.failure("Report newly created is not found in dataActions");
                } else {
                    $scope.success();
                }
            }, function(response) {
                if (response.error) {
                    $scope.failure("refreshMap error " + response.error + ' ' + response.log);
                } else if (response.redirect) {
                    $scope.failure("refreshMap failure, redirect to " + response.redirect);
                } else {
                    $scope.failure("refreshMap empty");
                }
            });
        }, function(response) {
            $scope.failure('waiting for all downloads/uploads failed : ' + response.error);
        });
    }});

    $scope.todo.push({name: 'test C4P Facet remove', fct: function() {
        var dataActions = {clear:[], remove:[], set:[], add:[]};
        var dataListener = srvData.addListenerOnUpdate(function (callbackId, action, type, id) {
            a4p.InternalLog.log('refreshMap', action + ' ' + type + ' ' + id);
            if (action == 'clear') {
                dataActions.clear.push(id);
            } else if (action == 'remove') {
                dataActions.remove.push(id);
            } else if (action == 'set') {
                dataActions.set.push(id);
            } else if (action == 'add') {
                dataActions.add.push(id);
            }
        });
        srvData.removeAndSaveObject($scope.facet);
        $scope.waitSynchronized().then(function() {
            $scope.refreshMap(dataListener).then(function(refreshMap) {
                if (!getObjectFromList(refreshMap.deletes, 'c4p', $scope.facet.id.c4p_id)) {
                    $scope.failure("Facet newly removed is not found in refreshMap");
                } else if (!isValueInList(dataActions.remove, $scope.facet.id.dbid)) {
                    $scope.failure("Facet newly removed is not found in dataActions");
                } else {
                    $scope.success();
                }
            }, function(response) {
                if (response.error) {
                    $scope.failure("refreshMap error " + response.error + ' ' + response.log);
                } else if (response.redirect) {
                    $scope.failure("refreshMap failure, redirect to " + response.redirect);
                } else {
                    $scope.failure("refreshMap empty");
                }
            });
        }, function(response) {
            $scope.failure('waiting for all downloads/uploads failed : ' + response.error);
        });
    }});

    $scope.todo.push({name: 'test C4P Many objects remove', fct: function() {
        //srvRunning.setOnline(false);
        var dataActions = {clear:[], remove:[], set:[], add:[]};
        var dataListener = srvData.addListenerOnUpdate(function (callbackId, action, type, id) {
            a4p.InternalLog.log('refreshMap', action + ' ' + type + ' ' + id);
            if (action == 'clear') {
                dataActions.clear.push(id);
            } else if (action == 'remove') {
                dataActions.remove.push(id);
            } else if (action == 'set') {
                dataActions.set.push(id);
            } else if (action == 'add') {
                dataActions.add.push(id);
            }
        });
        srvData.removeAndSaveObject($scope.report1);
        srvData.removeAndSaveObject($scope.note1);
        srvData.removeAndSaveObject($scope.event1);
        srvData.removeAndSaveObject($scope.task1);
        srvData.removeAndSaveObject($scope.opportunity1);
        srvData.removeAndSaveObject($scope.contact1);
        srvData.removeAndSaveObject($scope.account1);
        $scope.waitSynchronized().then(function() {
            $scope.refreshMap(dataListener).then(function(refreshMap) {
                if (!getObjectFromList(refreshMap.deletes, 'c4p', $scope.account1.id.c4p_id)) {
                    $scope.failure("Account newly removed is not found in refreshMap");
                } else if (!isValueInList(dataActions.remove, $scope.account1.id.dbid)) {
                    $scope.failure("Account newly removed is not found in dataActions");
                } else if (!getObjectFromList(refreshMap.deletes, 'c4p', $scope.contact1.id.c4p_id)) {
                    $scope.failure("Contact newly removed is not found in refreshMap");
                } else if (!isValueInList(dataActions.remove, $scope.contact1.id.dbid)) {
                    $scope.failure("Contact newly removed is not found in dataActions");
                } else if (!getObjectFromList(refreshMap.deletes, 'c4p', $scope.opportunity1.id.c4p_id)) {
                    $scope.failure("Opportunity newly removed is not found in refreshMap");
                } else if (!isValueInList(dataActions.remove, $scope.opportunity1.id.dbid)) {
                    $scope.failure("Opportunity newly removed is not found in dataActions");
                } else if (!getObjectFromList(refreshMap.deletes, 'c4p', $scope.event1.id.c4p_id)) {
                    $scope.failure("Event newly removed is not found in refreshMap");
                } else if (!getObjectFromList(refreshMap.deletes, 'c4p', $scope.task1.id.c4p_id)) {
                    $scope.failure("Task newly removed is not found in refreshMap");
                } else if (!isValueInList(dataActions.remove, $scope.event1.id.dbid)) {
                    $scope.failure("Event newly removed is not found in dataActions");
                } else if (!isValueInList(dataActions.remove, $scope.task1.id.dbid)) {
                    $scope.failure("Task newly removed is not found in dataActions");
                } else if (!getObjectFromList(refreshMap.deletes, 'c4p', $scope.note1.id.c4p_id)) {
                    $scope.failure("Note newly removed is not found in refreshMap");
                } else if (!isValueInList(dataActions.remove, $scope.note1.id.dbid)) {
                    $scope.failure("Note newly removed is not found in dataActions");
                } else if (!getObjectFromList(refreshMap.deletes, 'c4p', $scope.report1.id.c4p_id)) {
                    $scope.failure("Report newly removed is not found in refreshMap");
                } else if (!isValueInList(dataActions.remove, $scope.report1.id.dbid)) {
                    $scope.failure("Report newly removed is not found in dataActions");
                } else {
                    $scope.success();
                }
            }, function(response) {
                if (response.error) {
                    $scope.failure("refreshMap error " + response.error + ' ' + response.log);
                } else if (response.redirect) {
                    $scope.failure("refreshMap failure, redirect to " + response.redirect);
                } else {
                    $scope.failure("refreshMap empty");
                }
            });
        }, function(response) {
            $scope.failure('waiting for all downloads/uploads failed : ' + response.error);
        });
        //srvRunning.setOnline(true);
    }});

    $scope.todo.push({name: 'test SF CRM activation', fct: function() {
        // Configuration for more tests : activate SF crm
        srvConfig.setPossibleCrms(['c4p', 'ios', 'sf']);
        srvConfig.setActiveCrms(['c4p', 'ios', 'sf']);
        $scope.downloadFullMap('test SF CRM activation').then(function () {
            $scope.waitSynchronized().then(function() {
                $scope.success();
            }, function(response) {
                $scope.failure('waiting for all downloads/uploads failed : ' + response.error);
            });
        }, function (message) {
            $scope.failure(message);
        });
    }});

    $scope.todo.push({name: 'test SF Many objects creation', fct: function() {
        var now = new Date();
        var dataActions = {clear:[], remove:[], set:[], add:[]};
        var dataListener = srvData.addListenerOnUpdate(function (callbackId, action, type, id) {
            a4p.InternalLog.log('refreshMap', action + ' ' + type + ' ' + id);
            if (action == 'clear') {
                dataActions.clear.push(id);
            } else if (action == 'remove') {
                dataActions.remove.push(id);
            } else if (action == 'set') {
                dataActions.set.push(id);
            } else if (action == 'add') {
                dataActions.add.push(id);
            }
        });
        $scope.account1 = srvData.createObject('Account', {
            company_name:'NetworkTestRunner account',
            phone:'(33) 01 47 55 78',
            annual_revenue:125000,
            nb_employees:145,
            industry:'Electronics',
            description:'NetworkTestRunner account description'
        });
        srvData.addObject($scope.account1);
        srvData.addObjectToSave($scope.account1.a4p_type, $scope.account1.id.dbid);

        $scope.contact1 = srvData.createObject('Contact', {
            salutation:'Mr',
            first_name:'Alain',
            last_name:'Porthus',
            title:'Director',
            email:'aporthus@ntr.com'
        });
        srvData.addObject($scope.contact1);
        srvData.linkToItem('Contact', 'accounter', [$scope.contact1], $scope.account1);
        srvData.addObjectToSave($scope.contact1.a4p_type, $scope.contact1.id.dbid);

        $scope.opportunity1 = srvData.createObject('Opportunity', {
            name:'Software CRM',
            stage:'Prospecting',
            amount:5400,
            probability:75,
            description:'CRM software selling'
        });
        srvData.addObject($scope.opportunity1);
        srvData.linkToItem('Opportunity', 'accounter', [$scope.opportunity1], $scope.account1);
        srvData.addObjectToSave($scope.opportunity1.a4p_type, $scope.opportunity1.id.dbid);

        $scope.event1 = srvData.createObject('Event', {
            name:'NetworkTestRunner 2 hours event',
            location:'Tours',
            date_start:a4pDateFormat(now),
            date_end:a4pTimestampFormat(now.getTime() + 7200000),
            description:'NetworkTestRunner 2 hours event description'
        });
        srvData.addObject($scope.event1);
        srvData.linkToItem('Event', 'leader', [$scope.event1], $scope.contact1);
        srvData.addObjectToSave($scope.event1.a4p_type, $scope.event1.id.dbid);

        $scope.task1 = srvData.createObject('Task', {
            name:'NetworkTestRunner task',
            date_start:a4pDateFormat(now),
            is_reminder_set:true,
            date_reminder:a4pTimestampFormat(now.getTime() - 7200000),
            description:'NetworkTestRunner task description'
        });
        srvData.addObject($scope.task1);
        srvData.linkToItem('Task', 'leader', [$scope.task1], $scope.contact1);
        srvData.addObjectToSave($scope.task1.a4p_type, $scope.task1.id.dbid);

        $scope.note1 = srvData.createObject('Note', {
            title:'NetworkTestRunner note1',
            message:'Recall after Christmas',
            description:'NetworkTestRunner note1 description'
        });
        srvData.addObject($scope.note1);
        srvData.linkToItem('Note', 'parent', [$scope.note1], $scope.event1);
        srvData.addObjectToSave($scope.note1.a4p_type, $scope.note1.id.dbid);

        $scope.report1 = srvData.createObject('Report', {
            title:'NetworkTestRunner report1',
            message:'Report of yesterday',
            ratings:{code:'Feeling', name:'Feeling', type:'star', value: 0},
            description:'NetworkTestRunner report1 description'
        });
        srvData.addObject($scope.report1);
        srvData.linkToItem('Report', 'parent', [$scope.report1], $scope.event1);
        srvData.addObjectToSave($scope.report1.a4p_type, $scope.report1.id.dbid);

        $scope.attach1 = false;
        /*
        for (var i = 0; i < srvData.currentItems.Document.length; i++) {
            if (srvData.currentItems.Document[i]['name'].indexOf('.pdf') >= 0) {
                $scope.attach1 = srvData.newAndSaveAttachment('Attachee', srvData.currentItems.Document[i], $scope.event1);
            }
        }
        */
        if (srvData.currentItems.Document.length > 0) {
            $scope.attach1 = srvData.newAndSaveAttachment('Attachee', srvData.currentItems.Document[0], $scope.event1);
        }

        // Wait for 5 minutes to let Salesforce the time to update all its database
        $scope.waitSynchronized().then(function() {
            $scope.waitFor(300 * 1000).then(function () {
                $scope.refreshMap(dataListener).then(function(refreshMap) {
                    if (!getObjectFromList(refreshMap.updates, 'sf', $scope.account1.id.sf_id)) {
                        $scope.failure("SF Account newly created is not found in refreshMap");
                    } else if (!isValueInList(dataActions.set, $scope.account1.id.dbid)) {
                        $scope.failure("Account newly created is not found in dataActions");
                    } else if (!getObjectFromList(refreshMap.updates, 'sf', $scope.contact1.id.sf_id)) {
                        $scope.failure("SF Contact newly created is not found in refreshMap");
                    } else if (!isValueInList(dataActions.set, $scope.contact1.id.dbid)) {
                        $scope.failure("Contact newly created is not found in dataActions");
                    } else if (!getObjectFromList(refreshMap.updates, 'sf', $scope.opportunity1.id.sf_id)) {
                        $scope.failure("SF Opportunity newly created is not found in refreshMap");
                    } else if (!isValueInList(dataActions.set, $scope.opportunity1.id.dbid)) {
                        $scope.failure("Opportunity newly created is not found in dataActions");
                    } else if (!getObjectFromList(refreshMap.updates, 'sf', $scope.event1.id.sf_id)) {
                        $scope.failure("SF Event newly created is not found in refreshMap");
                    } else if (!getObjectFromList(refreshMap.updates, 'sf', $scope.task1.id.sf_id)) {
                        $scope.failure("SF Task newly created is not found in refreshMap");
                    } else if (!isValueInList(dataActions.set, $scope.event1.id.dbid)) {
                        $scope.failure("Event newly created is not found in dataActions");
                    } else if (!isValueInList(dataActions.set, $scope.task1.id.dbid)) {
                        $scope.failure("Task newly created is not found in dataActions");
                    } else if (!getObjectFromList(refreshMap.updates, 'c4p', $scope.note1.id.c4p_id)) {
                        $scope.failure("C4P Note newly created is not found in refreshMap");
                    } else if (!isValueInList(dataActions.set, $scope.note1.id.dbid)) {
                        $scope.failure("Note newly created is not found in dataActions");
                    } else if (!getObjectFromList(refreshMap.updates, 'c4p', $scope.report1.id.c4p_id)) {
                        $scope.failure("C4P Report newly created is not found in refreshMap");
                    } else if (!isValueInList(dataActions.set, $scope.report1.id.dbid)) {
                        $scope.failure("Report newly created is not found in dataActions");
                    } else if (!getObjectFromList(refreshMap.updates, 'sf', $scope.attach1.id.sf_id)) {
                        $scope.failure("SF Attachee newly created is not found in refreshMap");
                    } else {
                        $scope.success();
                    }
                }, function(response) {
                    if (response.error) {
                        $scope.failure("refreshMap error " + response.error + ' ' + response.log);
                    } else if (response.redirect) {
                        $scope.failure("refreshMap failure, redirect to " + response.redirect);
                    } else {
                        $scope.failure("refreshMap empty");
                    }
                });
            }, function () {
                $scope.failure('waiting for 5 minutes failed');
            });
        }, function(response) {
            $scope.failure('waiting for all downloads/uploads failed : ' + response.error);
        });

    }});

    $scope.todo.push({name: 'test SF Many objects remove', fct: function() {
        //srvRunning.setOnline(false);
        var dataActions = {clear:[], remove:[], set:[], add:[]};
        var dataListener = srvData.addListenerOnUpdate(function (callbackId, action, type, id) {
            a4p.InternalLog.log('refreshMap', action + ' ' + type + ' ' + id);
            if (action == 'clear') {
                dataActions.clear.push(id);
            } else if (action == 'remove') {
                dataActions.remove.push(id);
            } else if (action == 'set') {
                dataActions.set.push(id);
            } else if (action == 'add') {
                dataActions.add.push(id);
            }
        });
        if ($scope.attach1) {
            srvData.removeAndSaveObject($scope.attach1);
        }
        srvData.removeAndSaveObject($scope.report1);
        srvData.removeAndSaveObject($scope.note1);
        srvData.removeAndSaveObject($scope.event1);
        srvData.removeAndSaveObject($scope.task1);
        srvData.removeAndSaveObject($scope.opportunity1);
        srvData.removeAndSaveObject($scope.contact1);
        srvData.removeAndSaveObject($scope.account1);

        // Wait for 5 minutes to let Salesforce the time to update all its database
        $scope.waitSynchronized().then(function() {
            $scope.waitFor(300 * 1000).then(function () {
                $scope.refreshMap(dataListener).then(function(refreshMap) {
                    if (!getObjectFromList(refreshMap.deletes, 'sf', $scope.account1.id.sf_id)) {
                        $scope.failure("SF Account newly removed is not found in refreshMap");
                    } else if (!isValueInList(dataActions.remove, $scope.account1.id.dbid)) {
                        $scope.failure("Account newly removed is not found in dataActions");
                    } else if (!getObjectFromList(refreshMap.deletes, 'sf', $scope.contact1.id.sf_id)) {
                        $scope.failure("SF Contact newly removed is not found in refreshMap");
                    } else if (!isValueInList(dataActions.remove, $scope.contact1.id.dbid)) {
                        $scope.failure("Contact newly removed is not found in dataActions");
                    } else if (!getObjectFromList(refreshMap.deletes, 'sf', $scope.opportunity1.id.sf_id)) {
                        $scope.failure("SF Opportunity newly removed is not found in refreshMap");
                    } else if (!isValueInList(dataActions.remove, $scope.opportunity1.id.dbid)) {
                        $scope.failure("Opportunity newly removed is not found in dataActions");
                    } else if (!getObjectFromList(refreshMap.deletes, 'sf', $scope.event1.id.sf_id)) {
                        $scope.failure("SF Event newly removed is not found in refreshMap");
                    } else if (!getObjectFromList(refreshMap.deletes, 'sf', $scope.task1.id.sf_id)) {
                        $scope.failure("SF Task newly removed is not found in refreshMap");
                    } else if (!isValueInList(dataActions.remove, $scope.event1.id.dbid)) {
                        $scope.failure("Event newly removed is not found in dataActions");
                    } else if (!isValueInList(dataActions.remove, $scope.task1.id.dbid)) {
                        $scope.failure("Task newly removed is not found in dataActions");
                    } else if (!getObjectFromList(refreshMap.deletes, 'c4p', $scope.note1.id.c4p_id)) {
                        $scope.failure("C4P Note newly removed is not found in refreshMap");
                    } else if (!isValueInList(dataActions.remove, $scope.note1.id.dbid)) {
                        $scope.failure("Note newly removed is not found in dataActions");
                    } else if (!getObjectFromList(refreshMap.deletes, 'c4p', $scope.report1.id.c4p_id)) {
                        $scope.failure("C4P Report newly removed is not found in refreshMap");
                    } else if (!isValueInList(dataActions.remove, $scope.report1.id.dbid)) {
                        $scope.failure("Report newly removed is not found in dataActions");
                    } else if ($scope.attach1 && !getObjectFromList(refreshMap.deletes, 'sf', $scope.attach1.id.sf_id)) {
                        $scope.failure("SF Attachee newly removed is not found in refreshMap");
                    } else {
                        $scope.success();
                    }
                }, function(response) {
                    if (response.error) {
                        $scope.failure("refreshMap error " + response.error + ' ' + response.log);
                    } else if (response.redirect) {
                        $scope.failure("refreshMap failure, redirect to " + response.redirect);
                    } else {
                        $scope.failure("refreshMap empty");
                    }
                });
            }, function () {
                $scope.failure('waiting for 5 minutes failed');
            });
        }, function(response) {
            $scope.failure('waiting for all downloads/uploads failed : ' + response.error);
        });
        //srvRunning.setOnline(true);
    }});
}
networkTestRunnerCtrl.$inject = ['$scope', '$q', '$location', '$http', '$dialog', 'version',
    'srvLoad', 'srvLocalStorage', 'srvFileStorage', 'srvAnalytics', 'srvConfig',
    'srvLog', 'srvLocale', 'srvData', 'srvRunning', 'srvSecurity',
    'srvSynchro', 'cordovaReady', 'srvLink', 'srvNav', 'srvGuider', 'srvFacet'];


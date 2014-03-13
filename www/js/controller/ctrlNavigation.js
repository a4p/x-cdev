'use strict';

function navigationCtrl($scope, $q, $timeout, $location, $http, $dialog, version,
                        srvLoad, srvLocalStorage, srvFileStorage, srvAnalytics, srvConfig,
                        srvLog, srvLocale, srvData, srvRunning, srvSecurity,
                        srvSynchro, cordovaReady, srvLink, srvNav, srvGuider, srvFacet, srvOpenUrl) {

    /**
     * Provides current URL from browser address bar. Synchronization automatically maintained !
     */
    $scope.location = $location;


    /**
     * Used for performing http request
     */
    $scope.http = $http;


    /**
     * Calendar view to display as init view in app
     */
	$scope.calendarView = 'dayView';	// 'monthView';


    /**
     * App version
     */
    $scope.version = version;
    //a4p.InternalLog.log('version = ' + $scope.version);


	/**
	 * Default size values. They are recalculated during resize
	 */
    $scope.baseMagnetWidth = 100; 	// to check if used
    $scope.baseToolbarWidth =  80;	// left and right menu bars
    $scope.basePageWidth  = 240;	// screen width
    $scope.basePageHeight = 240;	// screen height


    /**
     * Constants : all the possible pages and slides inside each page
     */
    $scope.pageAuth = 'auth';
    $scope.pageGuider = 'guider';
    $scope.pageMeeting = 'meeting';
    $scope.pageNavigation = 'navigation';
    $scope.pageTimeline = 'timeline';

    /**
     * Constants : all the possible slides inside each page
     */
    $scope.slideAuth = 'index';

    $scope.slideGuiderGuider = 'guider';
    $scope.slideGuiderConnection = 'connection';
//    $scope.slideGuiderCreateAccount = 'createAccount';
    $scope.slideGuiderRegister = 'register';
    $scope.slideGuiderRequestPassword = 'requestPassword';
    $scope.slideGuiderValidation = 'validation';
    $scope.slideGuiderValidationReceiveRes = 'validationReceiveRes';

    $scope.slideMeeting = 'index';
    $scope.slideMeetingMeeting = 'meeting';

    $scope.slideTimeline = 'timeline';

    $scope.slideNavigation = 'index';
    $scope.slideNavigationConfig = 'config';
    $scope.slideNavigationCalendar = 'calendar';
    $scope.slideNavigationAccounts = 'accounts';
    $scope.slideNavigationContacts = 'contacts';
    $scope.slideNavigationDocuments = 'documents';
    $scope.slideNavigationEvents = 'events';
    $scope.slideNavigationTasks = 'tasks';
    $scope.slideNavigationFavorites = 'favorites';
    $scope.slideNavigationOpportunities = 'opportunities';
    $scope.slideNavigationLeads = 'leads';
    $scope.slideNavigationNotes = 'notes';
    $scope.slideNavigationReports = 'reports';
    $scope.slideNavigationFacets = 'facets';
    $scope.slideNavigationType = {
        'Account': $scope.slideNavigationAccounts,
        'Contact': $scope.slideNavigationContacts,
        'Document': $scope.slideNavigationDocuments,
        'Event': $scope.slideNavigationEvents,
        'Task': $scope.slideNavigationTasks,
        'Opportunity': $scope.slideNavigationOpportunities,
        'Lead': $scope.slideNavigationLeads,
        'Note': $scope.slideNavigationNotes,
        'Report': $scope.slideNavigationReports,
        'Facet': $scope.slideNavigationFacets
    };


    /**
     * All services initialized in App.js
     */
    $scope.srvLoad = srvLoad;
    $scope.srvLocalStorage = srvLocalStorage;
    $scope.srvFileStorage = srvFileStorage;
    $scope.srvAnalytics = srvAnalytics;
    $scope.srvConfig = srvConfig;
    $scope.srvLog = srvLog;
    $scope.srvLocale = srvLocale;
    $scope.srvData = srvData;
    $scope.srvRunning = srvRunning;
    $scope.srvSecurity = srvSecurity;
    $scope.srvSynchro = srvSynchro;
    $scope.srvLink = srvLink;
    $scope.srvNav = srvNav;
    $scope.srvGuider = srvGuider;
    $scope.srvOpenUrl = srvOpenUrl;


    /**
     * File storage allocated memory. Not used here but for message purpose.
     * The memory allocation is statically and directly defined in a4p.storage.js file
     */
    $scope.fileStorageQuota = 4 * 1024 * 1024 * 1024;// 4 Go


    /**
     * Used to prevent further unwanted calls
     */
    $scope.initAlreadyCalled = false;	// to call init() only once


    /**
     * Tells the app initialization is fully finished
     */
    $scope.initializationFinished = false;




    $scope.lastRefresh = null;
    // Data saved into Local Storage but not cleared upon refresh must be initialized here
    $scope.isDemo = false;
    $scope.firstConfigDone = false;
    $scope.rememberPassword = true;
    $scope.keepCrmLogin = false;
    //MLE  $scope.elementsOrderByAlphabet = {'contacts' : false, 'accounts' : false, 'opportunities' : false, 'documents' : false};




    /**
     * TASKS QUEUE MANAGEMENT- START
     *
     * Queue used to delay potential tasks launched before app initialization is complete.
     * Otherwise, some service might lack for task processing.
     *
     * This queue is used in the case of opening some document from outside the app (for example, click on some picture and 'open with' CRM Meeting pad)
     */
    $scope.taskTimer = null;
    $scope.taskQueue = [];

    // Add task to queue
    $scope.enqueueTask = function (fct) {
        $scope.taskQueue.push(fct);
        if ($scope.initializationFinished && ($scope.taskTimer == null)) {
            $scope.runNextTask();
        }
    };

    // Run all next tasks with 300ms sleep in between
    $scope.runNextTask = function () {
        if ($scope.taskQueue.length > 0) {
            var fct = $scope.taskQueue.shift();
            a4p.safeApply($scope, fct);
            $scope.taskTimer = window.setTimeout(function() {$scope.taskTimer = null;$scope.runNextTask();}, 300);
        }
    };

    /**
     * TASKS QUEUE MANAGEMENT- END
     */


    /**
     * APP INITIALIZATION - START
     *
     * Asynchronous initialization of this controller
     * @returns {promise} Return the promise which will be resolved upon end of initialization
     */
    $scope.initNavigationCtrl = function() {
        a4p.InternalLog.log('navigationCtrl', 'init() launched by AngularJS');
        var deferred = $q.defer();

        // Prevent multiple calls to this function
        if ($scope.initAlreadyCalled) {
            deferred.resolve();
            return deferred.promise;
        }
        $scope.initAlreadyCalled = true;

        var msg = "Initializing Cache: " + $scope.page + " page";	// cannot use srvLocale, not already loaded.
        srvLoad.setStatus(msg);

        // We must wait for dom, cache & cordova ready before initializing this controller because cache can provoque a document.reload()
        var startApplication = function() {
            a4p.InternalLog.log('navigationCtrl', 'startApplication() launched by cordovaReady');
            var msg = "Initializing Local Storage ...";	// cannot use srvLocale, not already loaded.

            a4p.safeApply($scope, function() {
                a4p.Resize.refreshAll();
                srvLoad.setStatus(msg);
                $scope.setA4pSpinnerState('run');
                initLocalStorage($scope, deferred);
            });
            //a4p.InternalLog.log("begin url:"+$location.absUrl());
            if (typeof StatusBar != 'undefined' && StatusBar) StatusBar.styleBlackTranslucent(); // iOS status bar
        };
        //a4pCordovaReadyAddCallback(startApplication);// Can call synchronously (if no Cordova as in Chrome, or if Cordova is already ready)
        cordovaReady(startApplication)();// We HOPE that Cordova is ready !!!!
        return deferred.promise;
    };

    function initLocalStorage(scope, deferred) {
        a4p.safeApply(scope, function() {
            scope.loadLocalStorage();
            scope.filteredContacts = [];
            scope.filteredAccounts = [];
            scope.filteredEvents = [];
            scope.filteredOpportunities = [];
            scope.filteredDocuments = [];
            initConfig(scope, deferred);
        });
    }

    function initConfig(scope, deferred) {
        a4p.InternalLog.log('ctrlNavigation', 'srvConfig.startLoading');
        srvAnalytics.init();
        srvConfig.startLoading(function() {
            a4p.safeApply(scope, function() {
                initLocale(scope, deferred);
            });
        });
    }

    function initLocale(scope, deferred) {
        a4p.InternalLog.log('ctrlNavigation', 'srvLocale.startLoading');
        srvLocale.startLoading(function () {
            a4p.safeApply(scope, function() {
                initFileStorage(scope, deferred);
            });
        });
    }

    function initFileStorage(scope, deferred) {
        a4p.InternalLog.log('ctrlNavigation', 'srvFileStorage.init');
        var msg = a4pFormat(srvLocale.translations.htmlMsgInitializingFileStorage, scope.fileStorageQuota);
        srvLoad.setStatus(msg);

        srvFileStorage.init().then(
            function () {
                a4p.safeApply(scope, function() {
                    srvLoad.setStatus(srvLocale.translations.htmlTextInitializingData);
                    initData(scope, deferred);
                });
            }, function (message) {
                a4p.safeApply(scope, function() {
                    srvLoad.setStatus(srvLocale.translations.htmlMsgLoadFileStoragePb);
                    scope.setA4pSpinnerState('doneWithPb');
                    srvLoad.setError(message);
                    deferred.reject({error:message});
                });
            });
    }

    function initData(scope, deferred) {
        a4p.safeApply(scope, function() {
            a4p.InternalLog.log('ctrlNavigation', 'initData');
            scope.loadLocalStorage();
            scope.filteredContacts = [];
            scope.filteredAccounts = [];
            scope.filteredEvents = [];
            scope.filteredOpportunities = [];
            scope.filteredDocuments = [];

            srvData.init();// Must be initialized() AFTER srvSynchro,
            srvGuider.init();

            // TODO : delete unused documents (not in mindmap) to escape bigger and bigger file storage.
            // But beware of external viewers which keep locks on files : do it only at boot of pad ?

            scope.initFinished(deferred);
        });
    }

    $scope.initFinished = function (deferred) {
        a4p.safeApply($scope, function() {
            a4p.InternalLog.log('ctrlNavigation', 'initFinished - guider:'+' / firstConfig:'+$scope.firstConfigDone+' / slide:'+$scope.slide+ ' / page:'+$scope.page);
        	$scope.setA4pSpinnerState('done');
        	srvLoad.setLoaded();
            deferred.resolve();

            $scope.initializationFinished = true;


            //GA : empty queue and launch first event
        	srvAnalytics.run();
            var login = srvSecurity.getA4pLogin();
            srvAnalytics.setUid(login);
            srvAnalytics.add('Once', 'App launched');

            // Start network requests from srvData
            srvData.start();
            // Verify that we do need to lock page
            if (!($scope.firstConfigDone && $scope.rememberPassword)) srvSecurity.resetPINCode();
            if (srvSecurity.isSecured()) {
                $scope.openDialogLocked(function() {
                    a4p.safeApply($scope, function() {
                        if ($scope.firstConfigDone && $scope.rememberPassword) {
                        	$scope.gotoWelcome();
                        // } else if($scope.firstConfigDone && !$scope.rememberPassword) {
                        //     $scope.gotoSlide($scope.pageGuider, $scope.slideGuiderConnection);
                        // }
                        } else {
                            $scope.gotoRegister();
                        }
                    });
                });
            }
            else{
            	if ($scope.firstConfigDone && $scope.rememberPassword) {
                	$scope.gotoWelcome();
                } else {
                    $scope.gotoRegister();
                }
            }

            // App initialization is finished => run waiting tasks
            if ($scope.taskTimer == null) {
                $scope.runNextTask();
            }
        });
    };





    $scope.loadLocalStorage = function () {
        // Restore data saved in local storage

        srvConfig.init();
        srvLog.init();
        srvLocale.init();
        srvSecurity.init();

        $scope.isDemo = srvLocalStorage.get('DemoMode', false);
        //?? srvAnalytics.setEnabled(($scope.isDemo != true));
        //MLE $scope.elementsOrderByAlphabet = srvLocalStorage.get('elementsOrderByAlphabet', {'contacts' : false, 'accounts' : false, 'opportunities' : false, 'documents' : false});
        $scope.firstConfigDone = srvLocalStorage.get('FirstConfigDone', false);
        $scope.rememberPassword = srvLocalStorage.get('RememberPassword', true);
        $scope.keepCrmLogin = $scope.rememberPassword;
    };

    $scope.setFirstConfigDone = function(firstConfigDone) {
		//a4p.InternalLog.log('FirstConfigDone : ' + firstConfigDone);
		$scope.firstConfigDone = firstConfigDone;
		$scope.saveFirstConfigDone();
	};

	$scope.saveFirstConfigDone = function() {
		srvLocalStorage.set('FirstConfigDone', $scope.firstConfigDone);
		//a4p.InternalLog.log("saveFirstConfigDone : " + $scope.firstConfigDone + " FirstConfigDone");
	};

	$scope.setRememberPassword = function(rememberPassword) {
		//a4p.InternalLog.log('RememberPassword : ' + rememberPassword);
        $scope.keepCrmLogin = rememberPassword;
        if (!$scope.rememberPassword && rememberPassword) $scope.keepCrmLogin = false;// Keep false for 1 time
		$scope.rememberPassword = rememberPassword;
		$scope.saveRememberPassword();
	};

	$scope.saveRememberPassword = function() {
		srvLocalStorage.set('RememberPassword', $scope.rememberPassword);
		//a4p.InternalLog.log("saveRememberPassword : " + $scope.rememberPassword+ " Remembered");
	};

    $scope.demoCounter = 5;
    $scope.doubleSetDemo = function(isDemo) {
        $scope.demoCounter = $scope.demoCounter - 1;
        if ($scope.demoCounter <= 0) $scope.setDemo(isDemo);
   	};

    $scope.setDemo = function (isDemo) {
        //a4p.InternalLog.log('demo : ' + isDemo);
        $scope.isDemo = isDemo;
        srvLocalStorage.set('DemoMode', $scope.isDemo);
        if (isDemo) {
            // Clear data every time we login in demo mode
            srvData.clear();
            // reset user identity
            srvSecurity.setDemo();
        }

        //Force download & refresh : do not use $scope.refreshClient();
        return $scope.downloadClient();
    };

    $scope.setEventDbidToBeCopied = function (dbid) {
    	//a4p.InternalLog.log('copy event dbid : ' + dbid);
        $scope.eventDbidToBeCopied = dbid;
    };

    $scope.getEventDbidToBeCopied = function () {
        return $scope.eventDbidToBeCopied;
    };

    $scope.setA4pSpinnerState = function(state){
    	$scope.a4pSpinnerState  = state;
    };

    //required to high light the active navigational point
    srvLoad.setStatus('');
    srvLoad.setError('');
    $scope.page =  '';//$scope.pageGuider;
    $scope.slide = '';//$scope.slide = $scope.slideGuiderConnection;
   /* $scope.hideGuiderPlusInfs = {inf1:true, inf2:true, inf3:true};
    $scope.messageGuider = '';
    $scope.responseGuider = '';
    $scope.showSwitchGuider = false;
    $scope.showBConn = true;
    $scope.showBCreate = true;
    $scope.itemCarousel = 0;*/
    $scope.slideToTransferInGuider = '';
    $scope.a4pSpinnerState = 'done';
    $scope.a4pSpinnerDownloadState = 'done';
    //$scope.a4pDeviceAdapter = a4pDeviceAdapter.GetInstance();
	$scope.relatedCategoriesFilterId = '';//"contact.id.dbid";
    $scope.filteredContacts = [];
    $scope.filteredAccounts = [];
    $scope.filteredEvents = [];
    $scope.filteredOpportunities = [];
    $scope.filteredDocuments = [];
    $scope.contactQuery = '';
    $scope.accountQuery = '';
    $scope.eventQuery = '';
    $scope.opportunityQuery = '';
    $scope.documentQuery = '';
    $scope.sameElementQuery = '';

    $scope.runningOnline = srvRunning.addListenerOnOnline(function (callbackId, online) {
        //a4p.InternalLog.log("Network " + (online ? 'online' : 'offline'));
        //$scope.a4pSpin.setOffline(!online);

        if (!online) {
            a4p.safeApply($scope, function() {
                $scope.setA4pSpinnerState('offline');
            });
        }
    });

    $scope.handleOpenUrl = srvOpenUrl.addListener(function (callbackId, url) {
        a4p.InternalLog.log('ctrlNavigation.handleOpenUrl', url);
        $scope.enqueueTask(function() { $scope.importNewFile(url); });
    });

    $scope.$on('$destroy', function (event) {
        srvRunning.cancelListener($scope.runningOnline);
        srvOpenUrl.cancelListener($scope.handleOpenUrl);
    });


    /**
     * Initialization
     */


    // Chain of Asynchronous Initializations



    // Navigation Basics

    $scope.gotoLogin = function () {
        // Cancel any pending request (already sent and not answered or not yet sent)
        // TODO : block until current requests are terminated
        // TODO : dialog to inform user that some requests are not yet done (and recall user every N days as he choose) :
        // TODO : save requests in waiting state or delete them as he wants or run them in background
        // TODO : erroneous requests resumed in log page (delete/update requests are not retryable, create requests are retryable)
        //srvData.clear();// do not clear yet to let the user go back if he wants
        //$scope.setFirstConfigDone(false);
        $scope.gotoSlide($scope.pageGuider, $scope.slideGuiderConnection);
    };

    $scope.gotoRegister = function() {
        $scope.gotoSlide($scope.pageGuider, $scope.slideGuiderRegister);
    };

    $scope.gotoWelcome = function () {

        //GA : reset User ID
        var login = srvSecurity.getA4pLogin();
        srvAnalytics.setUid(login);

        $scope.gotoSlide($scope.pageNavigation, $scope.slideNavigationCalendar);
    };

    $scope.gotoMeeting = function(item) {
        //TODO: optimization ?
        if (!item && $scope.getSlideFromDetail() == 'events') {
            $scope.setItemAndGoMeeting(srvNav.item);
        } else if(!item || (item.a4p_type != 'Event')) {
            $scope.openDialog(
                {
                    backdropClick: false,
                    dialogClass: 'modal c4p-modal-small c4p-modal-goto-meeting',
                    backdropClass: 'modal-backdrop c4p-modal-small',
                    controller: 'ctrlGoToMeetingDialog',
                    templateUrl: 'partials/dialog/dialogGoToMeeting.html',
                    resolve: {
                        item: function() {
                            return item;
                        },
                        version: function() {
                            return version;
                        },
                        srvData: function() {
                            return srvData;
                        },
                        srvNav: function() {
                            return srvNav;
                        },
                        srvLink: function() {
                            return srvLink;
                        },
                        srvLocale: function () {
                            return srvLocale;
                        },
                        srvConfig: function() {
                            return srvConfig;
                        },
                        srvAnalytics: function() {
                            return srvAnalytics;
                        }
                    }
                },
                function (result) {
                    if(result) {
                        $scope.setItemAndGoMeeting(result);
                    }
                });
        } else {
            $scope.setItemAndGoMeeting(item);
        }
    };

    // Spinner functions

    $scope.spinner = null;
    $scope.spinnerOpts = null;
    $scope.spinnerContainer = null;
    $scope.spinnerCnt = 0;
    $scope.setSpinner = function (spinnerContainer) {

        $scope.spinnerContainer = spinnerContainer;
        /*
         $scope.spinnerOpts = {
             lines: 12,            // The number of lines to draw
             length: 40,            // The length of each line
             width: 10,             // The line thickness
             radius: 30,           // The radius of the inner circle
             rotate: 0,            // Rotation offset
             corners: 1,           // Roundness (0..1)
             color: '#000',        // #rgb or #rrggbb
             direction: 1,         // 1: clockwise, -1: counterclockwise
             speed: 1,             // Rounds per second
             trail: 40,           // Afterglow percentage
             opacity: 1/4,         // Opacity of the lines
             fps: 20,              // Frames per second when using setTimeout()
             zIndex: 2e9,          // Use a high z-index by default
             className: 'a4p-spin', // CSS class to assign to the element
             top: 'auto',          // center vertically
             left: 'auto',         // center horizontally
             position: 'relative'  // element position
         };
         $scope.spinner = new Spinner($scope.spinnerOpts);
         */
    };
    $scope.startSpinner = function () {
        if ($scope.spinnerContainer != null) {
            //$scope.spinnerContainer.style['zIndex'] = 1050;
            $scope.spinnerContainer.style['display'] = '';
        }

        /* old code

         if ($scope.spinner) {
             $scope.spinnerCnt++;

             if ($scope.spinnerCnt == 1) {
                 $scope.spinner.opts.top = (a4p.Resize.resizeHeight>>1) - $scope.spinnerOpts.length - $scope.spinnerOpts.radius;
                 $scope.spinner.opts.left = (a4p.Resize.resizeWidth>>1) - $scope.spinnerOpts.length - $scope.spinnerOpts.radius;
                 $scope.spinner.spin($scope.spinnerContainer);
                 $scope.spinnerContainer.style['zIndex'] = 1050;
             }
         }
         */
    };
    $scope.stopSpinner = function () {
        if ($scope.spinnerContainer != null) {
            //$scope.spinnerContainer.style['zIndex'] = -1;
            $scope.spinnerContainer.style['display'] = 'none';
        }
        /*
         if ($scope.spinner) {
             $scope.spinnerCnt--;
             if ($scope.spinnerCnt <= 0) {
                 $scope.spinner.stop();
                 $scope.spinnerContainer.style['zIndex'] = -1;
             }
         }*/
    };

    // Synchronization functions

    /**
     * Asynchronous synchronization of this controller with c4p server.
     *
     * @returns {promise} Return the promise which will be resolved upon end of mindmap update
     */
    $scope.refreshClient = function () {
        a4p.InternalLog.log('ctrlNavigation', 'refreshClient');

        //if (!isDemo && ($scope.page != $scope.pageGuider)) {
        //	if ($scope.verifyEmail()) return;
    	//	if ($scope.verifyPassword()) return;
        //}

        // TODO : do not use new value of $scope.rememberPassword, but its old value if it was false
        var deferred = $q.defer();
        doRefreshClient($scope, $scope.isDemo, srvSecurity.getA4pLogin(), srvSecurity.getA4pPassword(),
            srvSecurity.getHttpRequestToken(), $scope.keepCrmLogin, deferred);
        $scope.keepCrmLogin = $scope.rememberPassword;

        return deferred.promise;
    };

    // Equivalent of "nothing in v1" : clear uploading then downloading
    $scope.downloadClient = function () {
        //a4p.InternalLog.log('download');
        var deferred = $q.defer();
        beginSynchronization($scope);
        loginUser($scope, $scope.isDemo, srvSecurity.getA4pLogin(), srvSecurity.getA4pPassword(),
            srvSecurity.getHttpRequestToken(), $scope.keepCrmLogin, deferred);
        $scope.keepCrmLogin = $scope.rememberPassword;
        return deferred.promise;
    };

    function beginSynchronization(scope) {
        //a4p.InternalLog.log('beginSynchronization');
    	srvRunning.setRefresh(true);
        scope.setA4pSpinnerState('run');
        //$scope.startSpinner();
    }

    function endSynchronization(scope) {
        //a4p.InternalLog.log('endSynchronization');
    	srvRunning.setRefresh(false);
        scope.setA4pSpinnerState('done');
        //$scope.stopSpinner();

        // TODO : move logSuccess() and gotoWelcome() out of this function
        srvLog.logSuccess(true, srvLocale.translations.htmlMsgSynchronizationOK,
            a4pFormat(srvLocale.translations.htmlMsgNbObjectsInserted, srvData.nbObjects));
    	//a4p.InternalLog.log('endSynchronization page now: '+ scope.page + ' slide : '+ scope.slide );
        scope.gotoWelcome();
    }

    function failSynchronization(scope) {
        //a4p.InternalLog.log('failSynchronization');
    	srvRunning.setRefresh(false);
        scope.setA4pSpinnerState('doneWithPb');
        //$scope.stopSpinner();
    }

    // Downloading functions

    function doRefreshClient(scope, isDemo, userEmail, userPassword, c4pToken, keepCrmLogin, deferred) {
        //a4p.InternalLog.log('refresh');
        beginSynchronization(scope);
        if (srvData.nbObjects > 0) {
            if (isDemo) {
                endSynchronization(scope);
                deferred.resolve();
            } else {
                refreshMindMap(scope, userEmail, userPassword, c4pToken, deferred);
            }
        } else {
            loginUser(scope, isDemo, userEmail, userPassword, c4pToken, keepCrmLogin, deferred);
        }
    }

    // There is NEVER refreshMindMap in demo mode
    function refreshMindMap(scope, userEmail, userPassword, c4pToken, deferred) {
        //a4p.InternalLog.log('refreshMindMap');
        srvData.refreshFullMap(c4pToken)
            .then(function (refreshMap) {
                // TODO : remove deleted objects from srvNav
                a4p.safeApply(scope, function() {
                    scope.gotoWelcome();
                    scope.filteredContacts = [];
                    scope.filteredAccounts = [];
                    scope.filteredEvents = [];
                    scope.filteredOpportunities = [];
                    scope.filteredDocuments = [];
                    scope.setFirstConfigDone(true);
                    scope.$broadcast('mindMapUpdated');
                    a4p.InternalLog.log('ctrlNavigation', 'MindMap updated');
                    endSynchronization(scope);
                    deferred.resolve();

                    //last Refresh done with success
                    // BEWARE : timestamps from Saleforce are in SECONDS, while timestamp in Javascript is in MILLI-SECONDS since 1/1/1970.
                    scope.lastRefresh = (srvData.lastRefreshMindMap ? srvData.lastRefreshMindMap || 0 : 0)*1000;

                    //GA : empty queue and push messages to GA
                    srvAnalytics.run();
                });
            }, function (response) {
                if (response.error) {
                    a4p.safeApply(scope, function() {
                        var errorCode = response.error;
                        var log = response.log;
                        srvLog.logWarning(true, srvLocale.translations[errorCode], log);
                        failSynchronization(scope);
                        deferred.reject({error: srvLocale.translations[errorCode] + ' : ' + log});
                    });
                } else if (response.maintenance) {
                    a4p.safeApply(scope, function() {
                        var errorCode = 'htmlMsgMaintenancePb';
                        var log = response.log;
                        srvLog.logWarning(true, srvLocale.translations[errorCode], log);
                        failSynchronization(scope);
                        deferred.reject({error: srvLocale.translations[errorCode] + ' : ' + log});
                    });
                } else if (response.redirect) {
                    var onClose = function () {
                        a4p.safeApply(scope, function() {
                            a4p.ErrorLog.log('ctrlNavigation', "onLoginCancel ");
                            failSynchronization(scope);
                            deferred.reject({error: 'User has cancelled Login'});
                        });
                    };
                    var onLocationChange = function () {
                        a4p.safeApply(scope, function() {
                            a4p.InternalLog.log('ctrlNavigation', "onLoginSuccess " + response.redirect);
                            //endSynchronization(scope);
                            doRefreshClient(scope, false, userEmail, userPassword, c4pToken, true, deferred);
                        });
                    };
                    openChildBrowser(response.redirect, 'url', onLocationChange, onClose);
                } else {
                    // empty mindmap
                    a4p.safeApply(scope, function() {
                        endSynchronization(scope);
                        deferred.resolve();
                    });
                }
            });
    }

    function loginUser(scope, isDemo, userEmail, userPassword, c4pToken, keepCrmLogin, deferred) {
        a4p.InternalLog.log('ctrlNavigation', 'loginUser ' + userEmail + ' demo=' + isDemo);
        var userFeedback = {
            company_name: '',
            phone: '',
            feedback: '',
            star: ''
        };
        srvData.loginUser(isDemo, userEmail, userPassword, c4pToken, keepCrmLogin, userFeedback, scope.version)
            .then(function () {
                a4p.InternalLog.log('ctrlNavigation', 'loginUser done');
                // c4pToken should have been created by server upon successful login
                downloadMindMap(scope, srvSecurity.getHttpRequestToken(), deferred);
            }, function (response) {
                if (response.error) {
                    a4p.safeApply(scope, function() {
                        a4p.ErrorLog.log('ctrlNavigation', "loginUser error " + response.error + ' ' + response.log);
                        var errorCode = response.error;
                        var log = response.log;
                        if (scope.page == scope.pageGuider) {
                            scope.setMessageGuider(errorCode);
                            scope.setSlideToTransferInGuider(scope.slideGuiderConnection);
                            scope.gotoSlide(scope.pageGuider, scope.slideGuiderValidationReceiveRes);
                        } else {
                            srvLog.logWarning(true, srvLocale.translations[errorCode], log);
                        }
                        failSynchronization(scope);
                        deferred.reject({error: srvLocale.translations[errorCode] + ' : ' + log});
                    });
                } else if (response.maintenance) {
                    a4p.safeApply(scope, function() {
                        a4p.ErrorLog.log('ctrlNavigation', "loginUser failed because server is in maintenance " + response.maintenance + ' ' + response.log);
                        var errorCode = 'htmlMsgMaintenancePb';
                        var log = response.log;
                        if (scope.page == scope.pageGuider) {
                            scope.setMessageGuider(errorCode);
                            scope.setSlideToTransferInGuider(scope.slideGuiderConnection);
                            scope.gotoSlide(scope.pageGuider, scope.slideGuiderValidationReceiveRes);
                        } else {
                            srvLog.logWarning(true, srvLocale.translations[errorCode], log);
                        }
                        failSynchronization(scope);
                        deferred.reject({error: srvLocale.translations[errorCode] + ' : ' + log});
                    });
                } else {//if (response.redirect)
                    // MUST BE TESTED BEFORE response.redirect
                    a4p.safeApply(scope, function() {
                        a4p.ErrorLog.log('ctrlNavigation', "loginUser urlBase changed to " + response.redirect + " => retry downloadFullMap");
                        //endSynchronization(scope);
                        doRefreshClient(scope, isDemo, userEmail, userPassword, c4pToken, true, deferred);
                    });
                }
            });
    }

    function downloadMindMap(scope, c4pToken, deferred) {
        //a4p.InternalLog.log('downloadMindMap');
        srvData.downloadFullMap(c4pToken)
            .then(function (fullmap) {
                a4p.safeApply(scope, function() {
                    a4p.InternalLog.log('ctrlNavigation', 'downloadFullMap done');
                    //MLE doublon ? scope.gotoWelcome();
                    scope.filteredContacts = [];
                    scope.filteredAccounts = [];
                    scope.filteredEvents = [];
                    scope.filteredOpportunities = [];
                    scope.filteredDocuments = [];
                    scope.setFirstConfigDone(!srvData.isDemo);
                    scope.$broadcast('mindMapLoaded');
                    endSynchronization(scope);
                    deferred.resolve();

                    //last Refresh done with success
                    // BEWARE : timestamps from Saleforce are in SECONDS, while timestamp in Javascript is in MILLI-SECONDS since 1/1/1970.
                    scope.lastRefresh = (srvData.lastRefreshMindMap ? srvData.lastRefreshMindMap || 0 : 0)*1000;

                    //GA : empty queue and push messages to GA
                    srvAnalytics.run();
                });
            }, function (response) {
                if (response.error) {
                    a4p.safeApply(scope, function() {
                        a4p.ErrorLog.log('ctrlNavigation', "downloadFullMap error " + response.error + ' ' + response.log);
                        var errorCode = response.error;
                        var log = response.log;
                        if (scope.page == scope.pageGuider) {
                            scope.setMessageGuider(errorCode);
                            scope.setSlideToTransferInGuider(scope.slideGuiderConnection);
                            scope.gotoSlide(scope.pageGuider, scope.slideGuiderValidationReceiveRes);
                        } else {
                            srvLog.logWarning(true, srvLocale.translations[errorCode], log);
                        }
                        failSynchronization(scope);
                        deferred.reject({error: srvLocale.translations[errorCode] + ' : ' + log});
                    });
                } else if (response.maintenance) {
                    a4p.safeApply(scope, function() {
                        a4p.ErrorLog.log('ctrlNavigation', "downloadFullMap failed because server is in maintenance " + response.maintenance + ' ' + response.log);
                        var errorCode = 'htmlMsgMaintenancePb';
                        var log = response.log;
                        if (scope.page == scope.pageGuider) {
                            scope.setMessageGuider(errorCode);
                            scope.setSlideToTransferInGuider(scope.slideGuiderConnection);
                            scope.gotoSlide(scope.pageGuider, scope.slideGuiderValidationReceiveRes);
                        } else {
                            srvLog.logWarning(true, srvLocale.translations[errorCode], log);
                        }
                        failSynchronization(scope);
                        deferred.reject({error: srvLocale.translations[errorCode] + ' : ' + log});
                    });
                } else if (response.redirect) {
                    a4p.ErrorLog.log('ctrlNavigation', "downloadFullMap redirect to " + response.redirect);
                    // TODO : TREAT possible infinite loop redirections between c4_fill and c4p_sf_connect
                    // if we have https://localhost/c4p_server/www/c4p_fill.php
                    // and https://127.0.0.1/c4p_server/www/c4p_sf_connect.php
                    // because cookie from localhost (c4p_fill.php $_SESSION['c4p.login'] for instance) will not be given by child browser to 127.0.0.1
                    var onClose = function () {
                        a4p.safeApply(scope, function() {
                            a4p.ErrorLog.log('ctrlNavigation', "onLoginCancel");
                            if (scope.page == scope.pageGuider) {
                                scope.gotoLogin();
                            }
                            failSynchronization(scope);
                            deferred.reject({error: 'User has cancelled Login'});
                        });
                    };
                    var onLocationChange = function () {
                        a4p.safeApply(scope, function() {
                            a4p.InternalLog.log('ctrlNavigation', "onLoginSuccess => retry downloadFullMap");
                            //endSynchronization(scope);
                            if (scope.page == scope.pageGuider) {
                                scope.gotoSlide(scope.pageGuider, scope.slideGuiderValidation);
                            }
                            downloadMindMap(scope, c4pToken, deferred);
                        });
                    };
                    openChildBrowser(response.redirect, 'url', onLocationChange, onClose);
                } else {// if (response.nop)
                    a4p.safeApply(scope, function() {
                        a4p.ErrorLog.log('ctrlNavigation', "downloadFullMap empty");
                        //MLE doublon ? scope.gotoWelcome();
                        scope.filteredContacts = [];
                        scope.filteredAccounts = [];
                        scope.filteredEvents = [];
                        scope.filteredOpportunities = [];
                        scope.filteredDocuments = [];
                        scope.setFirstConfigDone(!srvData.isDemo);
                        scope.$broadcast('mindMapLoaded');
                        // empty mindmap update
                        endSynchronization(scope);
                        deferred.resolve();
                    });
                }
            });
    }

    $scope.setMessageGuider = function(text){
        if (a4p.isUndefined(srvLocale.translations[text])) {
            a4p.ErrorLog.log('ctrlNavigation', 'setMessageGuider : key ' + text + ' does not exists => fall back to htmlMsgSynchronizationServerPb');
            text = 'htmlMsgSynchronizationServerPb';
        } else {
            a4p.InternalLog.log('ctrlNavigation', 'setMessageGuider : ' + text);
        }
    	$scope.messageGuider = text;
    };

    $scope.getMessageGuider = function(){

    	return $scope.messageGuider;
    };

    $scope.setSlideToTransferInGuider = function(slide){
    	$scope.slideToTransferInGuider = slide;
    };

    $scope.getSlideToTransferInGuider = function(){
    	return $scope.slideToTransferInGuider;
    };

    $scope.setItemCarousel = function(index){
    	$scope.itemCarousel = index;
    };


    /**
     * Storage of 'paused' page and slide to go to after finishing to go to a 'pause' page and slide.
     */
    $scope.pausedPage = null;
    $scope.pausedSlide = null;


    /**
     * Go to, another or not, page and slide.
     *
     * If we want to go to another slide before, pausePage and pauseSlide must not be null.
     * Then this 'pause' slide can decide WHEN to go really to the 'paused' slide by calling resumeSlide().
     *
     * @param nextPage Go to eventually to this page
     * @param nextSlide Go to eventually to this slide
     */
    $scope.gotoSlide = function (nextPage, nextSlide) {

        a4p.InternalLog.log('ctrlNavigation - gotoSlide','Begin '+ $scope.page + '/'+ $scope.slide + ' New:' +nextPage + '/'+nextSlide );

    	var changePage = (nextPage != $scope.page);
    	var changeSlide = changePage || ($scope.slide != nextSlide);
        if (changePage) {
            $scope.slide = '';// will deactivate page because of ng-show added with ng-include
            $scope.page = nextPage;
        }
        $scope.slide = nextSlide;
        $scope.windowSizeChanged();

    	// Broadcast changing slide
	    if (changeSlide){
	    	$scope.$broadcast('changeItemCategory', srvNav.item);
    	}

        $scope.updateScroller();
    };

    $scope.getSlide = function() {
        //a4p.InternalLog.log('ctrlNavigation - getSlide: '+$scope.slide);
    	return $scope.slide;
    };

    // Rename differently each call to getSlide to see in console which HTML page is $applied by AngularJS

    $scope.getSlideFromNavSidebarNav = function() {
        //a4p.InternalLog.log('ctrlNavigation - getSlideFromNavSidebarNav: '+$scope.slide);
    	return $scope.slide;
    };

    $scope.getSlideFromNavSidebarForm = function() {
        //a4p.InternalLog.log('ctrlNavigation - getSlideFromNavSidebarForm: '+$scope.slide);
    	return $scope.slide;
    };

    $scope.getSlideFromNavIndex = function() {
        //a4p.InternalLog.log('ctrlNavigation - getSlideFromNavIndex: '+$scope.slide);
    	return $scope.slide;
    };

    $scope.getSlideFromDetail = function() {
        //a4p.InternalLog.log('ctrlNavigation - getSlideFromDetail: '+$scope.slide);
    	return $scope.slide;
    };

    $scope.getSlideFromGuider = function() {
        a4p.InternalLog.log('ctrlNavigation - getSlideFromGuider: '+$scope.slide);
    	return $scope.slide;
    };

    $scope.getSlideFromFooter = function() {
        //a4p.InternalLog.log('ctrlNavigation - getSlideFromFooter: '+$scope.slide);
    	return $scope.slide;
    };

    $scope.getPage = function() {
        //a4p.InternalLog.log('ctrlNavigation - getPage: '+$scope.page);
    	return $scope.page;
    };

    // Rename differently each call to getPage to see in console which HTML page is $applied by AngularJS

    $scope.getPageFromIndex = function() {
        //a4p.InternalLog.log('ctrlNavigation - getPageFromIndex: '+$scope.page);
    	return $scope.page;
    };

    /**
     * Do not put current page in history (forgot it)
     * and shift back in history for 1+index positions (removing all intermediate pages from history)
     *
     * @param index Number from 0. If undefined, then we keep same object but go back in pages about this item (Detail/Meeting/Timeline)
     */
    $scope.gotoBack = function(index) {
        var back = srvNav.backInHistory(index);
        if (back != null) {
    		if (back.id) {
                $scope.setItemAndGoDetail(srvData.getObject(back.id));
            } else {
                $scope.gotoSlide(back.page, back.slide);
            }
    	} else {
    		// goto Calendar as fresh new
    		$scope.gotoSlide($scope.pageNavigation, $scope.slideNavigationCalendar);
    	}
    };

    /**
     * Put current page in history (save it)
     * and goto back in history for 1+index positions (keeping all intermediate pages in history)
     *
     * @param index
     */
    $scope.gotoIndex = function(index) {
        var back = srvNav.gotoInHistory(index);
        if (back != null) {
            if (back.id) {
                $scope.setItemAndGoDetail(srvData.getObject(back.id));
            } else {
                $scope.gotoSlide(back.page, back.slide);
            }
        } else {
            // goto Calendar as fresh new
            $scope.gotoSlide($scope.pageNavigation, $scope.slideNavigationCalendar);
        }
    };

    /**
     * Go to previously 'paused' page
     */
    $scope.resumeSlide = function () {
        $scope.gotoSlide($scope.pausedPage, $scope.pausedSlide);
    };

    $scope.gotoSlideWithSearchReset = function (nextPage, nextSlide) {
    	// Search reset
    	//??

        srvNav.goto(nextPage, nextSlide, null);
        $scope.gotoSlide(nextPage, nextSlide);
        $scope.setNavAside(false);
    };

    $scope.setCalendarView = function(view){
   		$scope.calendarView = view;
        $scope.windowSizeChanged();
        $scope.updateScroller();
   	};

    $scope.calculSelectDefault = function(elements,type,order){
    	if(!order){
    		return elements[0].dbid;
    	}
    	else{
    		var orderby = '';
			var dbid = '';
			var fullname = '';
			var companyName = '';
			var name = '';
			var direction = false;//MLE var direction = $scope.elementsOrderByAlphabet[type];
			for(var i = 0; i <elements.length ; i++){
				if(i == 0){
					if(type == 'contacts'){
						fullname = elements[i].first_name + ' ' + elements[i].last_name;
						orderby = fullname.toLowerCase();

					}
					else if(type == 'accounts'){
						companyName = elements[i].company_name;
						orderby = companyName.toLowerCase();
					}
					else{
						name = elements[i].name;
						orderby = name.toLowerCase();
					}
					dbid = elements[i].dbid;
				}
				else{
					if(type == 'contacts'){
						fullname = elements[i].first_name + ' ' + elements[i].last_name;
						fullname = fullname.toLowerCase();
						if(!direction){
							if(orderby >= fullname){
								orderby = fullname;
								dbid = elements[i].dbid;
							}
						}
						else{
							if(orderby <= fullname){
								orderby = fullname;
								dbid = elements[i].dbid;
							}
						}
					}
					else if(type == 'accounts'){
						companyName = elements[i].company_name;
						companyName = companyName.toLowerCase();
						if(!direction){
							if(orderby >= companyName){
								orderby = companyName;
								dbid = elements[i].dbid;
							}
						}
						else{
							if(orderby <= companyName){
								orderby = companyName;
								dbid = elements[i].dbid;
							}
						}
					}
					else{
						name = elements[i].name;
						name = name.toLowerCase();
						if(!direction){
							if(orderby >= name){
								orderby = name;
								dbid = elements[i].dbid;
							}
						}
						else{
							if(orderby <= name){
								orderby = name;
								dbid = elements[i].dbid;
							}
						}
					}

				}
			}
			return dbid;
    	}
    };

    $scope.cancelFiltreAccount = function(){
    	$scope.setAccountQuery('');
    	$scope.setSameElementQuery('');
    	$scope.gotoSlide($scope.page, $scope.slide);
    };

    $scope.cancelFiltreContact = function(){
    	$scope.setContactQuery('');
    	$scope.setSameElementQuery('');
    	$scope.gotoSlide($scope.page, $scope.slide);
    };

    $scope.cancelFiltreEvent = function(){
    	$scope.setEventQuery('');
    	$scope.setSameElementQuery('');
    	$scope.gotoSlide($scope.page, $scope.slide);
    };

    $scope.cancelFiltreOpportunity = function(){
    	$scope.setOpportunityQuery('');
    	$scope.setSameElementQuery('');
    	$scope.gotoSlide($scope.page, $scope.slide);
    };

    $scope.cancelFiltreDocument = function(){
    	$scope.setDocumentQuery('');
    	$scope.setSameElementQuery('');
    	$scope.gotoSlide($scope.page, $scope.slide);
    };
    //TODO lee besoin ou pas

    $scope.setRelatedCategoriesFilterId = function(id){
    	$scope.relatedCategoriesFilterId = id;
    };

    //functions of js

    //TODO rework all this to comply the new structure
    //done quick and dirty

    $scope.updateScrollerTimer = null;
    $scope.magnetWidth = $scope.baseMagnetWidth;
    $scope.toolbarWidth = $scope.baseToolbarWidth;
    $scope.onePageFormat = false;
    $scope.pageHeight = $scope.basePageHeight;
    $scope.pageWidth = $scope.basePageWidth;

    $scope.centralContainerWidth =  $scope.pageWidth - (2*$scope.toolbarWidth);

    $scope.asideWidth = Math.round($scope.centralContainerWidth * 0.4);// 40% viewscreen
    $scope.mainWidth = $scope.centralContainerWidth - $scope.asideWidth;// 60% viewscreen
    $scope.relatedWidth = $scope.asideWidth;
    $scope.detailWidth = $scope.centralContainerWidth - $scope.asideWidth; //TODO

    $scope.panel1X = -$scope.asideWidth;
    $scope.panel2X = $scope.panel1X - $scope.detailWidth;

    $scope.beforeWindowSizeChanged = function() {
        $scope.windowSizeChanged();
        // Wait at least one frame to update scroller and limit to one call every 200ms
        if ($scope.updateScrollerTimer != null) {
            window.clearTimeout($scope.updateScrollerTimer);
        }
        $scope.updateScrollerTimer = window.setTimeout(function () {
            a4p.safeApply($scope, function() {
                $scope.updateScroller();
            });
        }, 200);
    };

    $scope.windowSizeChanged = function() {
        var fontSizePx = window.getComputedStyle(document.body,null).getPropertyValue("font-size");
        fontSizePx = fontSizePx.substr(0, fontSizePx.length-2);

        var fontSizePxHtml = window.getComputedStyle(document.documentElement,null).getPropertyValue("font-size");
        fontSizePxHtml = fontSizePxHtml.substr(0, fontSizePxHtml.length-2);

        if (srvConfig.getSizeCss() == '') {
            //srvConfig.setSizeCss(fontSizePxHtml+'px');
            srvConfig.setSizeCss('75%');
        }

        $scope.toolbarWidth = Math.ceil(2.9*fontSizePx);

        $scope.onePageFormat = a4p.Resize.resizePortrait; //prefer One column Mode; srvConfig.c4pConfig.phoneFormatIfSmall ? a4p.Resize.resizeOneColumn : a4p.Resize.resizePortrait;
        $scope.pageHeight = a4p.Resize.resizeHeight;
        $scope.pageWidth = a4p.Resize.resizeWidth;


        if ($scope.onePageFormat) {
            //all the same size
            $scope.mainWidth = $scope.pageWidth - $scope.toolbarWidth;
            $scope.centralContainerWidth = $scope.mainWidth;
            $scope.asideWidth = $scope.mainWidth;
            $scope.relatedWidth = $scope.mainWidth;
            $scope.detailWidth = $scope.mainWidth;

            $scope.magnetWidth = Math.floor($scope.centralContainerWidth/2);

            if (!$scope.has3Pages()) {
                // 2 pages
                //$scope.detailWidth = $scope.pageWidth;
                //$scope.relatedWidth = 0;
                $scope.mainWidth = 0;
            }
        } else {
            $scope.centralContainerWidth = $scope.pageWidth - 2*$scope.toolbarWidth;
            // Page1 : asideWidth + mainWidth, Page2 : mainWidth + asideWidth
            $scope.asideWidth = Math.round($scope.centralContainerWidth * 0.4);// 40% viewscreen
            $scope.mainWidth = $scope.centralContainerWidth - $scope.asideWidth;// 60% viewscreen
            // Page1 : asideWidth + detailWidth + toolbarWidth, Page2 : detailWidth + relatedWidth
            $scope.relatedWidth = $scope.asideWidth;
            $scope.detailWidth = $scope.centralContainerWidth - $scope.relatedWidth;

            //magnet stuff
            $scope.magnetWidth = Math.floor($scope.asideWidth/2);
        }
        $scope.panel1X = -$scope.asideWidth;
        $scope.panel2X = $scope.panel1X - $scope.detailWidth;
    };

    $scope.isOnePageFormat = function() {return $scope.onePageFormat;};
    $scope.sumOrMax = function(value1, value2) {return ($scope.isOnePageFormat() ? (value1 + value2) : Math.max(value1, value2));};
    $scope.max = function(value1, value2) {return Math.max(value1, value2);};
    $scope.getToolbarWidth = function() {return $scope.toolbarWidth;};
    $scope.getAsideWidth = function() {return $scope.asideWidth;};
    $scope.getMainWidth = function() {return $scope.mainWidth;};
    $scope.getRelatedWidth = function() {return $scope.relatedWidth;};
    $scope.getDetailWidth = function() {return $scope.detailWidth;};
    $scope.getCentralContainerWidth = function() {return $scope.centralContainerWidth;};
    $scope.hasToolbar = function() {
        return (($scope.slide != $scope.slideNavigationConfig) && ($scope.slide != $scope.slideNavigationCalendar));
    };
    $scope.isTwoPagesFormat = function() {
        return (($scope.slide == $scope.slideNavigationConfig) || (($scope.slide == $scope.slideNavigationCalendar) && ($scope.calendarView != 'dayView')));
    };
    $scope.has3Pages = function() {
        return ($scope.onePageFormat && !$scope.isTwoPagesFormat());
    };


    $scope.getCalendarHeaderWidth = function(){
        if ($scope.has3Pages()) {
            return ($scope.mainWidth);
        }
        else if ($scope.navRelated) {
            return ($scope.centralContainerWidth);
        }
        else {
            return ($scope.mainWidth);
        }
    };


    $scope.closeAsidePage = false;// Config
    $scope.navPage = 1;
    $scope.navRelated = false;
    $scope.navAside = true;

    $scope.toggleNavRelated = function() {
        $scope.setNavRelated(!$scope.navRelated);
    };

    $scope.toggleNavAside = function() {
        $scope.setNavAside(!$scope.navAside);
    };

    $scope.setNavRelated = function(v) {
        $scope.navRelated  = v;
        $scope.navAside =  $scope.has3Pages() ? false :  !v;
        $scope.updateScroller();
    };

    $scope.setNavAside = function(v){
        $scope.navAside = v;
        $scope.navRelated =  $scope.has3Pages() ? false :  !v;
        $scope.updateScroller();
    };

    $scope.getPanelX = function() {
        var x = 0;
        if ($scope.navAside) {
            // Page1
            x = 0;
        } else if ($scope.has3Pages() && $scope.navRelated) {
            //Page3
            x = $scope.panel2X;
        } else {
            //Page2
            x = $scope.panel1X;
        }
        return x;
    };

    // Limit to one call every 200ms
    $scope.updateScroller = a4p.delay(function() {
        var relative = false;
        var timeMs = 500;
        var x = 0;
        var y = 0;
        if ($scope.navAside) {
            // Page1
            $scope.navPage = 1;
            x = 0;
            //console.log('sensePanel scrollTo 0');
        } else if ($scope.has3Pages() && $scope.navRelated) {
            //Page3
            $scope.navPage = 3;
            x = $scope.panel2X;
            //console.log('sensePanel scrollTo ' + width);
        } else {
            //Page2
            $scope.navPage = 2;
            x = $scope.panel1X;
            //console.log('sensePanel scrollTo ' + width);
        }
        if ($scope.sensePanel && $scope.sensePanel.scroll) {
            // Force a refresh of scroller size
            if ($scope.sensePanel.scroll.checkDOMChanges()) {
                $scope.sensePanel.scroll.refresh();
            }
            $scope.sensePanel.scroll.scrollTo(x, y, timeMs, relative);
        }
    }, 300);

    $scope.sensePanel = null;
    $scope.setSensePanel = function(sense) {
        $scope.sensePanel = sense;
    };
    $scope.onPanelAfterScrollEnd = function(x, y) {
        // Called after move end when momentum is finished
        //console.log('onPanelAfterScrollEnd : x=' + x + ', y=' + y);
        if (!$scope.sensePanel || !$scope.sensePanel.scroll) {
            return;
        }
        if ($scope.sensePanel.scroll.x > -$scope.magnetWidth) {
            // Page1
            a4p.safeApply($scope, function() {
                $scope.navRelated = false;
                $scope.setNavAside(true);
            });
        } else if ($scope.has3Pages() && ( $scope.panel2X-$scope.magnetWidth < $scope.sensePanel.scroll.x) &&  ($scope.sensePanel.scroll.x < $scope.magnetWidth + $scope.panel2X)) {
            //Page3
            a4p.safeApply($scope, function() {
                $scope.setNavRelated(true);
            });
        } else if ((!$scope.has3Pages() && ($scope.sensePanel.scroll.x < $scope.magnetWidth + $scope.panel1X))
            || ($scope.has3Pages() && Math.abs($scope.sensePanel.scroll.x - $scope.panel1X) < $scope.magnetWidth)) {
            //Page2
            a4p.safeApply($scope, function() {
                $scope.setNavAside(false);
            });
        }
    };

    $scope.getSensePanelScrollX = function() {
        if (!$scope.sensePanel || !$scope.sensePanel.scroll) return 0;
        return $scope.sensePanel.scroll.x;
    };

    $scope.navTitle = "";
    $scope.setNavTitle = function(v){
    	$scope.navTitle = v;
    };

    $scope.showCancelCopyEvent = function(){
    	if($scope.getCopyEvent()){
    		$('#c4pCancelCopyEvent').modal('show');
    	}
    };

    /**
     * @param type string define the type of object to create, (default get the current object type)
     */
    $scope.addItemDialog = function(type){
    	alert('TEST MLE redefine in sub controller ?'+type);
    };

    $scope.setItemAndGoDetail = function(item) {

        $scope.startSpinner();

        window.setTimeout(function () {
            a4p.safeApply($scope, function () {
                if (item) {
                    srvNav.goto($scope.pageNavigation, $scope.slideNavigationType[item.a4p_type], item);
                }
                $scope.gotoSlide($scope.pageNavigation, $scope.slideNavigationType[item.a4p_type]);
                if (item) $scope.$broadcast('setItemDetail', item);
            });
        }, 200);
        /*
        $timeout(function () {
            if (item) {
                srvNav.goto($scope.pageNavigation, $scope.slideNavigationType[item.a4p_type], item);
            }
            $scope.gotoSlide($scope.pageNavigation, $scope.slideNavigationType[item.a4p_type]);
            if (item) $scope.$broadcast('setItemDetail', item);
        }, 200 );
        */

        window.setTimeout(function () {
            a4p.safeApply($scope, function () {
                $scope.stopSpinner();
            });
        }, 1000);
        /*
        $timeout(function () {
            $scope.stopSpinner();
        }, 1000);
        */

    };

    $scope.setItemAndGoMeeting = function(item) {
        if (item) {
            srvNav.goto($scope.pageMeeting, $scope.slideMeetingMeeting, item);
        }
	    $scope.gotoSlide($scope.pageMeeting, $scope.slideMeetingMeeting);
        //if (item) $scope.$broadcast('setItemDetail', item);// used only by ctrlDetail for the moment
    };

    $scope.setItemAndGoTimeline = function(object) {
        if (object) {
            srvNav.goto($scope.pageTimeline, $scope.slideTimeline, object);
        }
	    $scope.gotoSlide($scope.pageTimeline, $scope.slideTimeline);
    };

    $scope.setItemAndGoCalendar = function(object) {
        if (object) {
            srvNav.goto($scope.pageNavigation, $scope.slideNavigationCalendar, object);
        }
	    $scope.gotoSlide($scope.pageNavigation, $scope.slideNavigationCalendar);
    };

    $scope.getTypeIcon = function (type){
        return c4p.Model.getTypeIcon(type);
    };

    $scope.getTypeColor = function (type){
        return c4p.Model.getTypeColor(type);
    };

    $scope.getFacetColor = function (facet){
        if (a4p.isUndefinedOrNull(facet)){
            return 'a';// 'noFacet'
        }
        switch (facet.key) {
            case 'objects' :
                return c4p.Model.getTypeColor(facet.value);
                break;
            case 'favorites':
                return c4p.Model.getTypeColor('Document');
            case 'top20':
                return c4p.Model.getTypeColor('Document');
            case 'mine':
                return c4p.Model.getTypeColor('Document');
            default :
                return 'a';// facet.key+'-nocolor';
        }
    };

    $scope.getObjectIcon = function (object){
        return c4p.Model.getItemIcon(object);
    };
    $scope.getObjectName = function (object){
        return srvConfig.getItemName(object);
    };
    $scope.getItemNameById = function (itemId){
        var result = '';
        var item = srvData.getObject(itemId);
        if (!item) return result;
        return srvConfig.getItemName(item);
    };
    $scope.getItemHtmlDescriptionById = function (itemId){
        var result = '';
        var item = srvData.getObject(itemId);
        if (!item) return result;
        return c4p.Model.getItemHtmlDescription(item);
    };

    $scope.getItemTitle = function (type){
        var result = '';
        if (!type) return result;
        result = srvLocale.translations.htmlTitle[type];
        return result;
    };

    $scope.getItemCount = function (type){
        if (!type) return '';
        var result = srvData.getObjectCount(type);
        return result;
    };



    $scope.getLastRefreshAsString = function(){
    	if (!$scope.lastRefresh) return srvLocale.translations.htmlTextLastRefreshNone;

    	return srvLocale.formatDate($scope.lastRefresh,'medium');
    };

    $scope.eventFullStartDate = function(event){
        return srvLocale.formatDate(a4pDateParse(event.date_start), 'fullDate')
    };

    $scope.eventFullEndDate = function(event){
        return srvLocale.formatDate(a4pDateParse(event.date_end), 'fullDate')
    };

    $scope.isMultiDayEvent = function(event){
    	var b = false;
        var evtStartDate = a4pDateParse(event.date_start);
        var evtEndDate = a4pDateParse(event.date_end);
    	if (	evtStartDate.getDate() < evtEndDate.getDate()
    		|| 	evtStartDate.getMonth() < evtEndDate.getMonth()
    		|| 	evtStartDate.getFullYear() < evtEndDate.getFullYear()){
        	b = true;
    	}

    	return b;
    };

    $scope.addEmailToParent = function(item, share, email, parent) {
        var targetDirPath = 'a4p/c4p/doc';
        var now = new Date();
        var itemName = srvConfig.getItemName(item);
        var parentName = srvConfig.getItemName(parent);
        var normalizedParentName = parentName.replace(/ /g, '_');
        var documentInsert = srvData.createObject('Document', {
            name: 'email_' + normalizedParentName + '_'
                + (srvLocale.formatDate(a4pDateParse(a4pDateFormat(now)), 'shortDate')).replace(/\//g, '-') + '.' + 'pdf',
            body: '',
            length: '0',
            path: targetDirPath,
            description: "Email" + (share ? " to share " + itemName : '') + " for " + parent.a4p_type + ' ' + parentName
        });
        email.editable = true;
        documentInsert.email = email;
        srvData.addObject(documentInsert);
        srvData.linkToItem('Document', 'parent', [documentInsert], parent);
        srvData.addObjectToSave(documentInsert.a4p_type, documentInsert.id.dbid);
        return documentInsert;
    };

    /**
     * Opening Dialog Methods
     */

    $scope.promiseDialog = function (dialogOptions) {
        return $dialog.dialog(dialogOptions).open();
    };

    $scope.openDialog = function (dialogOptions, onSuccess) {
        a4p.safeApply($scope, function() {
        	$scope.setBlur(true);
            $dialog.dialog(dialogOptions).open().then(
            	function(result) {
            		onSuccess(result);
            		$scope.setBlur(false);
            	}, function(diag) {
                	$scope.setBlur(false);
            	}
            );
        });
    };

    $scope.openDialogConfirm = function (text, array, fctConfirm) {
        $scope.openDialog(
            {
                backdropClick: false,
                dialogClass: 'modal c4p-modal-small c4p-modal-confirm',
                backdropClass: 'modal-backdrop c4p-modal-small',
                controller: 'ctrlDialogConfirm',
                templateUrl: 'partials/dialog/confirm.html',
                resolve: {
                    text: function () {
                        return text;
                    },
                    textArray: function () {
                        return array;
                    },
                    srvLocale: function () {
                        return srvLocale;
                    }
                }
            },
            function (result) {
                a4p.safeApply($scope, function () {
                    fctConfirm(result);
                });
            });
    };

    $scope.openDialogInitPinCode = function (fn) {
        //fctSuccess
        $scope.openDialog(
            {
                backdropClick: false,
                dialogClass: 'modal c4p-modal-small c4p-modal-confirm',
                backdropClass: 'modal-backdrop c4p-modal-small',
                controller: 'ctrlInitDialogPinCode',
                templateUrl: 'partials/dialog/pin_init.html',
                resolve: {
                    srvLocale: function () {
                        return srvLocale;
                    }
                }
            },
            function (result) {
                a4p.safeApply($scope, function () {
                    fn(result);
                });
            });
    };

    $scope.openDialogModifyPinCode = function (fctSuccess) {
        $scope.openDialog(
            {
                backdropClick: false,
                dialogClass: 'modal c4p-modal-small c4p-modal-confirm',
                backdropClass: 'modal-backdrop c4p-modal-small',
                controller: 'ctrlModifyDialogPinCode',
                templateUrl: 'partials/dialog/pin_modify.html',
                resolve: {
                    srvLocale: function () {
                        return srvLocale;
                    },
                    srvSecurity: function () {
                        return srvSecurity;
                    }
                }
            },
            function (result) {
                if (a4p.isDefined(result)) {
                    a4p.safeApply($scope, function () {
                        fctSuccess(result);
                    });
                }
            });
    };

    $scope.openDialogLocked = function (fctSuccess) {
        $scope.openDialog(
            {
                backdropClick: false,
                dialogClass: 'modal c4p-modal-small c4p-modal-confirm',
                backdropClass: 'modal-backdrop c4p-modal-small',
                controller: 'ctrlOpenDialogLocked',
                templateUrl: 'partials/dialog/pin_locked.html',
                resolve: {
                    srvLocale: function () {
                        return srvLocale;
                    },
                    srvSecurity: function () {
                        return srvSecurity;
                    }
                }
            },
            function () {
                a4p.InternalLog.log('ctrlNavigation', 'close page locked');
                if (fctSuccess) {
                    a4p.safeApply($scope, function () {
                        fctSuccess();
                    });
                }
            });
    };

    // Open a message as dialog
    $scope.openDialogMessage = function (text) {
        $scope.openDialog(
            {
                backdropClick: true,
                dialogClass: 'modal c4p-modal-small c4p-modal-confirm',
                backdropClass: 'modal-backdrop c4p-modal-small',
                controller: 'ctrlDialogConfirm',
                templateUrl: 'partials/dialog/message.html',
                resolve: {
                    text: function () {
                        return text;
                    },
                    textArray: function () {
                        return [];
                    },
                    srvLocale: function () {
                        return srvLocale;
                    }
                }
            },
            function () {
                // nothing
            });
    };

    // Open an image in a dialog
    $scope.openShowImageDialog = function(imageObject) {
        $scope.openDialog(
            {
                backdrop: false,
                dialogClass: 'modal',
                controller: 'ctrlShowImage',
                templateUrl: 'partials/dialog/dialogShowImage.html',
                resolve: {
                    imageData: function() {
                        return imageObject;
                    }
                }
            },
            function() {

            });
    };

    $scope.editObjectDialog = function(event, fctSuccess) {
        return $scope.openDialog(
            {
                dialogClass: 'modal c4p-modal-large c4p-dialog',
                backdropClass: 'modal-backdrop c4p-modal-large',
                controller: 'ctrlEditDialogObject',
                templateUrl: 'partials/dialog/edit_object.html',
                resolve: {
                    srvData: function () {
                        return srvData;
                    },
                    srvLocale: function () {
                        return srvLocale;
                    },
                    srvConfig: function () {
                        return srvConfig;
                    },
                    objectItem: function () {
                        //return angular.copy(event);
                        return event;
                    },
                    removeFct: function () {
                        return function (obj) {
                            srvData.removeAndSaveObject(obj);
                            $scope.gotoBack(0);
                        };
                    },
                    spinner: function () {
                        return $scope.spinnerContainer;
                    },
                    openDialogFct: function () {
                        return $scope.openDialog;
                    }    
                }
            },
            function (result) {
                if (a4p.isDefined(result)) {
                    a4p.safeApply($scope, function () {
                        fctSuccess(result);
                    });
                }
                else {
                   // a4p.safeApply($scope, function() {
                        //deferred.reject({error:'htmlMsgShareByEmailPb', log:'cancelled by user'});
                    //});
                }
            });
    };

    $scope.takePicture = function(parentObject) {
        var deferred = $q.defer();
        srvData.takePicture(parentObject, srvConfig.getItemName(parentObject)).then(function (document) {
            var msg = 'Picture file written to ' + document.filePath;
            if (srvData.isDemo) {
                msg = msg + '. In demo mode, the picture is not uploaded.';
            } else {
                msg = msg + '. It will be uploaded as soon as possible.';
            }
            a4p.safeApply($scope, function() {
                if (!window.device) srvLog.logSuccess(true, srvLocale.translations.htmlMsgDummyPicture);
                srvLog.logSuccess(true, srvLocale.translations.htmlMsgTakePictureOK, msg);
                srvData.addObject(document);
                srvData.linkToItem(document.a4p_type, 'parent', [document], parentObject);
                srvData.addObjectToSave(document.a4p_type, document.id.dbid);
                //$scope.selectItemAndCloseAside(document);

                //GA: user really interact with creation
                srvAnalytics.add('Once', 'Create '+document.a4p_type);

                deferred.resolve(document);
            });
        }, function (diag) {
            a4p.safeApply($scope, function() {
                srvLog.logInfo(true, srvLocale.translations[diag.error], diag.log);

                deferred.reject(diag);
            });
        });
        return deferred.promise;
    };

    $scope.takeNote = function(parentObject) {
        var deferred = $q.defer();
        var note = {
            'a4p_type' : 'Note',
            'title': '',
            'message': ''
        };
        $scope.openDialog(
            {
                dialogClass: 'modal c4p-modal-full c4p-dialog',
                backdrop: false,
                controller: 'ctrlEditDialogNote',
                templateUrl: 'partials/dialog/dialogNote.html',
                resolve: {
                    srvLocale: function () {
                        return srvLocale;
                    },
                    srvConfig: function () {
                        return srvConfig;
                    },
                    srvData: function () {
                        return srvData;
                    },
                    srvFacet: function () {
                        return srvFacet;
                    },
                    attendees: function () {
                        return [];
                    },
                    attachments: function () {
                        return [];
                    },
                    event: function () {
                        return parentObject;
                    },
                    note: function () {
                        return note;
                    },
                    editable: function () {
                        return true;
                    },
                    modeEdit: function () {
                        return true;
                    },
                    spinner: function () {
                        return $scope.spinnerContainer;
                    }
                }
            },
            function (result) {
                if (a4p.isDefined(result)) {
                    a4p.safeApply($scope, function() {
                        var object = $scope.addNewNote(result.note, parentObject);
                        if (object) {
                            if (result.share) {
                                if (result.byChatter) {
                                    $scope.shareByChatter(object, parentObject).then(function (document) {
                                        deferred.resolve(document);
                                    }, function (diag) {
                                        deferred.reject(diag);
                                    });
                                } else {
                                    $scope.shareByEmail(object, parentObject).then(function (document) {
                                        deferred.resolve(document);
                                    }, function (diag) {
                                        deferred.reject(diag);
                                    });
                                }
                            } else {
                                deferred.resolve(object);
                            }
                        } else {
                            deferred.reject({error:'htmlMsgMakeNotePb', log:'no parent'});
                        }
                    });
                } else {
                    a4p.safeApply($scope, function() {
                        deferred.reject({error:'htmlMsgMakeNotePb', log:'cancelled by user'});
                    });
                }
            }
        );
        return deferred.promise;
    };

    $scope.takeReport = function(parentObject) {
        var deferred = $q.defer();
        var attendees = srvData.getTypedDirectLinks(parentObject, 'attendee', 'Attendee');
        var attachments = srvData.getTypedDirectLinks(parentObject, 'child', 'Document');
        var note;
        var idsContact = [];
        var idsDocument = [];
        for (var attendeeIdx = 0; attendeeIdx < attendees.length; attendeeIdx++) {
            idsContact.push(attendees[attendeeIdx].relation_id);
        }
        for (var docIdx = 0; docIdx < attachments.length; docIdx++) {
            idsDocument.push(attachments[docIdx].id);
        }
        note = {
            'a4p_type' : 'Report',
            'contact_ids': idsContact,
            'document_ids': idsDocument,
            'ratings': [],
            'title': '',
            'description': '',
            'message': ''
        };
        $scope.openDialog(
            {
                dialogClass: 'modal c4p-modal-full c4p-dialog',
                backdrop: false,
                controller: 'ctrlEditDialogNote',
                templateUrl: 'partials/dialog/dialogNote.html',
                resolve: {
                    srvLocale: function () {
                        return srvLocale;
                    },
                    srvConfig: function () {
                        return srvConfig;
                    },
                    srvData: function () {
                        return srvData;
                    },
                    srvFacet: function () {
                        return srvFacet;
                    },
                    attendees: function () {
                        return attendees;
                    },
                    attachments: function () {
                        return attachments;
                    },
                    event: function () {
                        return parentObject;
                    },
                    note: function () {
                        return note;
                    },
                    editable: function () {
                        return true;
                    },
                    modeEdit: function () {
                        return true;
                    },
                    spinner: function () {
                        return $scope.spinnerContainer;
                    }
                }
            },
            function (result) {
                if (a4p.isDefined(result)) {
                    a4p.safeApply($scope, function() {
                        var object = $scope.addNewReport(result.note, parentObject);
                        if (object) {
                            if (result.share) {
                                if (result.byChatter) {
                                    $scope.shareByChatter(object, parentObject).then(function (document) {
                                        deferred.resolve(document);
                                    }, function (diag) {
                                        deferred.reject(diag);
                                    });
                                } else {
                                    $scope.shareByEmail(object, parentObject).then(function (document) {
                                        deferred.resolve(document);
                                    }, function (diag) {
                                        deferred.reject(diag);
                                    });
                                }
                            } else {
                                deferred.resolve(object);
                            }
                        } else {
                            deferred.reject({error:'htmlMsgMakeReportPb', log:'no parent'});
                        }
                    });
                } else {
                    a4p.safeApply($scope, function() {
                        deferred.reject({error:'htmlMsgMakeReportPb', log:'cancelled by user'});
                    });
                }
            }
        );
        return deferred.promise;
    };


    $scope.openDialogSendFeedback = function(title) {
        $scope.openDialog(
            {
                backdropClick: false,
                dialogClass: 'modal c4p-modal-large c4p-dialog',
                backdropClass: 'modal-backdrop c4p-modal-large',
                controller: 'ctrlEditDialogFeedback',
                templateUrl: 'partials/dialog/dialogFeedback.html',
                resolve: {
                    srvLocale: function () {
                        return srvLocale;
                    },
                    title: function () {
                        return title;
                    },
                    emailRequired: function () {
                        return (srvSecurity.getA4pLogin() ? false : true);
                    }
                }
            },
            function (result) {
                if (a4p.isDefined(result)) {
                    if (!result.feedback.message) {
                        alert(srvLocale.translations['htmlMsgFeedbackMessageEmpty']);
                        return;
                    }
                    if (!srvSecurity.getA4pLogin()) {
                        if ((a4p.isUndefined(result.feedback.email) || (result.feedback.email == ''))
                            && (a4p.isUndefined(result.feedback.phone) || (result.feedback.phone == ''))) {
                            alert(srvLocale.translations['htmlMsgFeedbackContactEmpty']);
                            return;
                        }
                        srvSecurity.setA4pLogin(result.feedback.email);
                    }
                    var fctOnHttpSuccess = function (response) {
                        //response.data, response.status, response.headers
                        var requestTitle = 'User feedback';
                        if (a4p.isUndefined(response.data)) {
                            srvLog.logWarning(srvConfig.c4pConfig.exposeUserFeedback,
                                'Received no data', requestTitle);
                        } else {
                            var errorCode = response.data['error'];
                            var responseOk = response.data['responseOK'];
                            var responseLog = response.data['responseLog'];
                            if (a4p.isUndefined(responseLog)) responseLog = response.data['log'];

                            if (a4p.isDefined(errorCode) && (errorCode != '')) {
                                if (a4p.isUndefined(srvLocale.translations[errorCode])) {
                                    srvLog.logWarning(srvConfig.c4pConfig.exposeUserFeedback,
                                        'Received error code ' + errorCode,
                                        requestTitle + ' : ' + (responseLog||a4pDumpData(responseData, 1)));
                                } else {
                                    srvLog.logWarning(srvConfig.c4pConfig.exposeUserFeedback,
                                        srvLocale.translations[errorCode],
                                        requestTitle + ' : ' + responseLog);
                                }
                            } else if (a4p.isUndefined(responseOk) || !responseOk) {
                                srvLog.logWarning(srvConfig.c4pConfig.exposeUserFeedback,
                                    'Received no OK',
                                    requestTitle + ' : ' + (responseLog||a4pDumpData(response.data, 1)));
                            } else {
                                //feedback success
                                srvLog.logSuccess(srvConfig.c4pConfig.exposeUserFeedback,
                                    'Your feedback has been sent',
                                    requestTitle + ' : ' + responseLog);
                            }
                        }
                    };

                    var fctOnHttpError = function (response) {
                        //response = {data:msg, status:'error'}
                        srvLog.logWarning(srvConfig.c4pConfig.exposeUserFeedback,
                            'Your feedback has failed', response.data);
                    };

                    var deviceName = '';
                    var deviceCordova = '';
                    var devicePlatform = '';
                    var deviceUuid = '';
                    var deviceVersion = '';
                    if (window.device) {
                        deviceName = window.device.name;
                        deviceCordova = window.device.cordova;
                        devicePlatform = window.device.platform;
                        deviceUuid = window.device.uuid;
                        deviceVersion = window.device.version;
                    } else {
                        deviceUuid = window.location.hostname;
                    }
                    var params = {
                        login: srvSecurity.getA4pLogin(),
                        title:title,
                        phone: result.feedback.phone||'',
                        deviceName: deviceName,
                        deviceCordova: deviceCordova,
                        devicePlatform: devicePlatform,
                        deviceUuid: deviceUuid,
                        deviceVersion: deviceVersion,
                        c4pBuildDate: srvConfig.c4pBuildDate,
                        language: srvLocale.getLanguage(),
                        appVersion:$scope.version,
                        feedback:result.feedback.message
                    };
                    /*
                    srvDataTransfer.sendData(srvConfig.c4pUrlFeedback, params, null, 30000)
                        .then(fctOnHttpSuccess, fctOnHttpError);
                    */
                    var requestCtx = {
                        type:'Feedback',
                        title:'Send user feedback'
                    };
                    srvSynchro.addRequest('config', requestCtx, srvConfig.c4pUrlFeedback, 'POST',
                        params, {'Content-Type': 'application/x-www-form-urlencoded'});
                }
            });
    };

    $scope.removeItemDialog = function(object) {
        if (!object) {
            object = srvNav.item;
        }//srvData.getObject($scope.itemDetailDBId);
        if (a4p.isDefined(object)) {
        	var name = [$scope.getItemNameById(object.id.dbid)];
            $scope.openDialogConfirm(srvLocale.translations.htmlTextConfirmDelete, name, function(confirm) {
            	if (confirm) {
                    a4p.safeApply($scope, function() {
                        srvData.removeAndSaveObject(object);
                    });
                }
            });
        }
    };

    /**
     * View an object related to the current object srvNav.item
     * @param item
     */
    $scope.viewDocument = function(item) {
        if (!item) item = srvNav.item;
        if ((item.a4p_type == 'Note') || (item.a4p_type == 'Report')) {
            $scope.viewNote(item, false);
        } else if ((item.a4p_type == 'Document') && (item.email)) {
            $scope.viewEmail(item);
        } else if((item.a4p_type == 'Document') && c4p.Model.isImage(item.extension)) {
            $scope.viewImage(item);
        }
        else {
            if (item.fileUrl && item.extension) {
                $scope.viewFile(item.fileUrl, item.extension);
            } else if (item.mimetype && item.extension) {
                // FIXME : track location change in ChildBrowser is looping infinitly
                var url = srvConfig.c4pUrlDownload
                    +'?type='+encodeURIComponent(item.a4p_type)
                    +'&dbid='+encodeURIComponent(item.id.dbid)
                    +'&sf_id='+encodeURIComponent(item.id.sf_id)
                    +'&mimetype='+encodeURIComponent(item.mimetype)
                    +'&c4pToken='+encodeURIComponent(srvSecurity.getHttpRequestToken());
                openChildBrowser(url, item.extension);
            }
        }
    };

    $scope.viewFile = function(url, extension) {
        openChildBrowser(url, extension);
    };

    $scope.viewImage = function(imageObject) {
        $scope.openShowImageDialog(imageObject);
    };

    /**
     * Import a file and link it via Document.parent to user
     * @param url
     */
    $scope.importNewFile = function(url) {
    	var filename = decodeURI(url.split('/')[url.split('/').length-1]);

        // Reject import if user not logged
        console.log('importNewFile userId = ' + a4pDumpData(srvData.userId, 2));
        a4p.InternalLog.log('ctrlNavigation.importNewFile', url + ' initialized=' + $scope.initAlreadyCalled + ' userId=' + a4pDumpData(srvData.userId, 2));
        if (a4p.isUndefined(srvData.userId.dbid)) {
            window.alert(srvLocale.translations.htmlMsgRejectImportNotLogged);
            return;
        }
        var contact = srvData.getObject(srvData.userId.dbid);
        if (a4p.isUndefined(contact)) {
            window.alert(srvLocale.translations.htmlMsgRejectImportNotLogged);
            return;
        }
        console.log('importNewFile dialog opening');
        var onConfirm = function() {
            console.log('importNewFile dialog confirmed');
            var targetDirPath = 'a4p/c4p/import';
            var onSuccess = function (document) {
                a4p.safeApply($scope, function() {
                    $scope.stopSpinner();
                    console.log('importNewFile importFile success');
                    var msg = 'File ' + document.name + ' imported and written to ' + document.filePath;
                    srvLog.logSuccess(true, srvLocale.translations.htmlMsgFileImportOK, msg);
                    srvData.addObject(document);
                    srvData.linkToItem(document.a4p_type, 'parent', [document], contact);
                    srvData.addObjectToSave(document.a4p_type, document.id.dbid);
                    $scope.setItemAndGoDetail(document);
                });
            };
            var onFailure = function (diag) {
                a4p.safeApply($scope, function() {
                    $scope.stopSpinner();
                    console.log('importNewFile importFile failure');
                    srvLog.logInfo(true, srvLocale.translations[diag.error], diag.log);
                });
            };
            a4p.promiseWakeup($scope, srvData.importFile(url, targetDirPath), onSuccess, onFailure);
            $scope.startSpinner();
        };
        //onConfirm();
        $scope.openDialogConfirm(srvLocale.translations.htmlMsgFileImport, [filename], function(confirm) {
            if (confirm) {
                a4p.safeApply($scope, function() {
                    onConfirm();
                });
            } else {
                console.log('importNewFile dialog cancelled');
            }
        });
    };

    /**
     * Create and Link a new Note via Document.parent to parent
     * @param note
     * @param parent
     */
    $scope.addNewNote = function(note, parent) {
        if (!parent) parent = srvNav.item;
        if (!parent) return undefined;

        var document = srvData.createObject('Note', note);
        srvData.addObject(document);
        srvData.linkToItem(document.a4p_type, 'parent', [document], parent);
        srvData.addObjectToSave(document.a4p_type, document.id.dbid);

        //GA: user really interact with creation
        srvAnalytics.add('Once', 'Create '+document.a4p_type);

        return document;
    };

    /**
     * Create and Link a new Report via Document.parent to parent
     * @param report
     * @param parent
     */
    $scope.addNewReport = function(report, parent) {
        if (!parent) parent = srvNav.item;
        if (!parent) return undefined;

        var document = srvData.createObject('Report', report);
        srvData.addObject(document);
        srvData.linkToItem(document.a4p_type, 'parent', [document], parent);
        srvData.addObjectToSave(document.a4p_type, document.id.dbid);

        //GA: user really interact with creation
        srvAnalytics.add('Once', 'Create '+document.a4p_type);

        return document;
    };

    $scope.shareByEmail = function(item, parent) {
        var deferred = $q.defer();
        var postTitle;
        var itemName = srvConfig.getItemName(item);
        var parentName = srvConfig.getItemName(parent);
        if (item.a4p_type == 'Note') {
            // TODO : do not share a note of type 'share'
            postTitle = 'Sharing ' + item.a4p_type + ' about ' + parent.a4p_type + ' ' + parentName;
        } else if (item.a4p_type == 'Report') {
            // TODO : do not share a note of type 'share'
            postTitle = 'Sharing ' + item.a4p_type + ' about ' + parent.a4p_type + ' ' + parentName;
        } else if (item.email) {
            // TODO : do not share an email
            postTitle = 'Sharing Email about ' + parent.a4p_type + ' ' + parentName;
        } else {
            postTitle = 'Sharing Document ' + itemName + ' about ' + parent.a4p_type + ' ' + parentName;
        }
        $scope.openDialog(
            {
                backdrop: false,
                dialogClass: 'modal c4p-modal-full c4p-modal-mail c4p-dialog',
                controller: 'ctrlEditDialogEmail',
                templateUrl: 'partials/dialog/dialogEmail.html',
                resolve: {
                    srvLocale: function () {
                        return srvLocale;
                    },
                    srvData: function () {
                        return srvData;
                    },
                    srvConfig: function () {
                        return srvConfig;
                    },
                    srvFacet: function () {
                        return srvFacet;
                    },
                    title: function() {
                        return srvLocale.translations.htmlTitleShareByEmail;
                    },
                    attendees: function () {
                        return srvData.getTypedDirectLinks(parent, 'attendee', 'Attendee');
                    },
                    attachments: function () {
                        return [];// Authorize NO more attachment
                    },
                    email: function () {
                        // TODO : add note title in email subject ?
                        return {
                            'emailType': 'share',
                            'subject': postTitle,
                            'body': '',
                            'contacts': [],
                            'documents': [item.id],
                            'emailsInput': []
                        };
                    },
                    emailId: function(){
                        return null;
                    },
                    editable: function () {
                        return true;
                    },
                    modeEdit: function () {
                        return true;
                    }
                }
            },
            function (result) {
                if (a4p.isDefined(result)) {

                    //GA: user really interact with creation
                    srvAnalytics.add('Once', 'Create Mail');

                    a4p.safeApply($scope, function() {
                        var document = $scope.addEmailToParent(item, true, result, parent);
                        deferred.resolve(document);
                    });
                } else {
                    a4p.safeApply($scope, function() {
                        deferred.reject({error:'htmlMsgShareByEmailPb', log:'cancelled by user'});
                    });
                }
            }
        );
        return deferred.promise;
    };

    $scope.shareByChatter = function(item, parent) {
        var deferred = $q.defer();
        if (!parent) parent = srvData.getObject(item.parent_id.dbid);
        //TODO CCN: using translation
        var postTitle;
        var itemName = srvConfig.getItemName(item);
        var parentName = srvConfig.getItemName(parent);
        if (item.a4p_type == 'Note' && parent) {
            // TODO : do not share a note of type 'share'
            postTitle = 'Sharing ' + item.a4p_type + ' about ' + parent.a4p_type + ' ' + parentName;
        } else if (item.a4p_type == 'Report' && parent) {
            // TODO : do not share a note of type 'share'
            postTitle = 'Sharing ' + item.a4p_type + ' about ' + parent.a4p_type + ' ' + parentName;
        } else if (item.email && parent) {
            // TODO : do not share an email
            postTitle = 'Sharing Email about ' + parent.a4p_type + ' ' + parentName;
        } else if (parent){
            postTitle = 'Sharing Document ' + itemName + ' about ' + parent.a4p_type + ' ' + parentName;
        }
        $scope.openDialog(
            {
                backdrop: false,
                dialogClass: 'modal c4p-modal-full c4p-modal-mail c4p-dialog',
                controller: 'ctrlEditDialogFeed',
                templateUrl: 'partials/dialog/dialogFeed.html',
                resolve: {
                    srvLocale: function () {
                        return srvLocale;
                    },
                    srvData: function () {
                        return srvData;
                    },
                    title: function() {
                        return srvLocale.translations.htmlTitleShareByChatter;
                    },
                    feed: function () {
                        return {
                            'title': postTitle,
                            'body': '',
                            'id': item.id
                        };
                    },
                    editable: function () {
                        return true;
                    },
                    modeEdit: function () {
                        return true;
                    }
                }
            },
            function (result) {
                if (a4p.isDefined(result)) {
                    a4p.safeApply($scope, function() {
                        // Share by Chatter
                        item.feed = result;
                        srvData.setAndSaveObject(item);
                        deferred.resolve(item);
                    });
                } else {
                    a4p.safeApply($scope, function() {
                        deferred.reject({error:'htmlMsgShareByChatterPb', log:'cancelled by user'});
                    });
                }
            }
        );
        return deferred.promise;
    };

    /**
     * View an email being srvNav.item or related to the current object srvNav.item
     * @param item
     */
    $scope.viewEmail = function(item) {
        var parent = srvData.getObject(item.parent_id.dbid);

        var dialogOptions = {
            backdrop: false,
            controller: 'ctrlEditDialogEmail',
            templateUrl: 'partials/dialog/dialogEmail.html'
        };
        var title;
        if (item.email.emailType == 'share') {
            dialogOptions.dialogClass = 'modal c4p-modal-full c4p-modal-mail c4p-dialog';
            title = srvLocale.translations.htmlTitleShareByEmail;
        } else {
            dialogOptions.dialogClass = 'modal c4p-modal-full c4p-modal-mail c4p-dialog';
            title = srvLocale.translations.htmlFormEmail;
        }
        $scope.openDialog(
            angular.extend(dialogOptions, {
                resolve: {
                    srvLocale: function () {
                        return srvLocale;
                    },
                    srvData: function () {
                        return srvData;
                    },
                    srvConfig: function () {
                        return srvConfig;
                    },
                    srvFacet: function () {
                        return srvFacet;
                    },
                    title: function() {
                        return title;
                    },
                    attendees: function () {
                        // Suggest only Contacts attended in this parent
                        return srvData.getTypedDirectLinks(parent, 'attendee', 'Attendee');
                    },
                    attachments: function () {
                        if (item.email.emailType == 'share') {
                            return [];// Suggest NO more attachment
                        } else {
                            var docs = srvData.getTypedDirectLinks(parent, 'child', 'Document');
                            var links = srvData.getTypedRemoteLinks(parent, 'attachee', 'Document');
                            for (var i = 0, nb = links.length; i < nb; i++) {
                                docs.push(links[i]);
                            }
                            return docs;
                        }
                    },
                    email: function () {
                        return item.email;
                    },
                    emailId: function(){
                        return item.id;
                    },
                    editable: function () {
                        if (srvData.isObjectOwnedByUser(parent)) {
                            return item.email.editable;
                        } else {
                            return false;
                        }
                    },
                    modeEdit: function () {
                        return false;
                    }
                }
            }),
            function (result) {
                if (a4p.isDefined(result)) {
                    a4p.safeApply($scope, function() {
                        item.email = result;
                        srvData.setAndSaveObject(item);
                    });
                }
            });
    };

    $scope.viewNote = function(item, modeEdit) {
        var parent = srvData.getObject(item.parent_id.dbid);
        var itemRefreshed = srvData.getObject(item.id.dbid);
        var editable = true;
        $scope.openDialog(
            {
                dialogClass: 'modal c4p-modal-full c4p-dialog',
                backdrop: false,
                controller: 'ctrlEditDialogNote',
                templateUrl: 'partials/dialog/dialogNote.html',
                resolve: {
                    srvLocale: function () {
                        return srvLocale;
                    },
                    srvConfig: function () {
                        return srvConfig;
                    },
                    srvData: function () {
                        return srvData;
                    },
                    srvFacet: function () {
                        return srvFacet;
                    },
                    attendees: function () {
                        return srvData.getTypedDirectLinks(parent, 'attendee', 'Attendee');
                    },
                    attachments: function () {
                        var docs = srvData.getTypedDirectLinks(parent, 'child', 'Document');
                        var links = srvData.getTypedRemoteLinks(parent, 'attachee', 'Document');
                        for (var i = 0, nb = links.length; i < nb; i++) {
                            docs.push(links[i]);
                        }
                        return docs;
                    },
                    event: function () {
                        return parent;
                    },
                    note: function () {
                        return angular.copy(itemRefreshed);
                    },
                    editable: function () {
                        if (srvData.isObjectOwnedByUser(parent)) {
                            return editable;
                        } else {
                            return false;
                        }
                    },
                    modeEdit: function () {
                        return modeEdit;
                    },
                    spinner: function () {
                        return $scope.spinnerContainer;
                    }
                }
            },
            function (result) {
                if (a4p.isDefined(result)) {
                    a4p.safeApply($scope, function() {
                        srvData.setAndSaveObject(result.note);
                        if (result.share) {
                            if (result.byChatter) {
                                $scope.shareByChatter(result.note, parent);
                            } else {
                                $scope.shareByEmail(result.note, parent);
                            }
                        }
                    });
                }
            });
    };

    $scope.showDetailMeetingBtn = function () {

        if ($scope.isOnePageFormat()) {
            if ($scope.hasToolbar()) {
                return (false);
            }
            else {
                return (true);
            }
        }
        else {
            if ($scope.hasToolbar()) {
                return (false);
            }
            else {
                // this one is a specific at the moment ... TODO should be changed later
                if ($scope.calendarView != "dayView") {
                    return (true);
                }
                if ($scope.navAside) {
                    return (true);
                } else {
                    return (false);
                }
            }
        }
    };

    $scope.modeLock = false;

    $scope.setModeLock = function(mode) {
        var oldMode = $scope.modeLock;

        if ((oldMode != mode) && !mode && srvSecurity.isSecured()) {
            // Unlocking requires a pincode
            return $scope.openDialogLocked(function() {
                a4p.safeApply($scope, function() {
                    $scope.modeLock = mode;
                });
            });
        }

        $scope.modeLock = mode;
        if (!oldMode && mode) {
            //Quit Unlock mode means quit mode Edit
            $scope.setModeEdit(false);
        }
    };

    /**
     * errKey: the generic message error key
     * args: the messages arguments to be replaced in generic error message
     */
    $scope.formError = function(errKey, args) {
    	return c4p.Model.createErrMsg($scope, errKey, args);
    };

    $scope.translate = function(key) {
    	var translation = srvLocale.translations[key];

    	return translation ? translation : key;
    };
    // ----------------------------------------------------
    // Related panel
    // ----------------------------------------------------

    $scope.linksTimestamp = 0;

    // Used in view_np1_links_item.html
    $scope.toggleShowGroup = function (group) {
        group.show = !group.show;
        $scope.linksTimestamp = (new Date()).getTime();
    };

    $scope.isDocumentGroup = function(groupType) {
        return groupType == 'Document';
    };


    $scope.showGallery = function() {
        $scope.openDialog(
            {
                backdrop: false,
                dialogClass: 'modal',
                controller: 'ctrlShowImage',
                templateUrl: 'partials/dialog/dialogShowImage.html',
                resolve: {
                    imageData: function () {
                        return srvNav.imageRelatedList;
                    }
                }
            },
            function () {

            });
    };

    // Used in view_np1_links_item.html
    $scope.setShowGroup = function (group, value) {
        group.show = value;
        $scope.linksTimestamp = (new Date()).getTime();
    };

    /*
     * Scroll spying
     */
    $scope.linksScroller = null;
    $scope.linksPageY = -1;

    $scope.setLinksScroller = function (sense) {
        $scope.linksScroller = sense;
    };

    $scope.getLinksScrollerPageY = function () {
        if ($scope.linksScroller == null) return (-1);
        if ($scope.linksScroller.scroll == null) return (-1);
        return $scope.linksScroller.scroll.currPageY;
    };

    $scope.setLinksScrollerPageY = function (index) {
        if ($scope.linksScroller == null) return (-1);
        if ($scope.linksScroller.scroll == null) return (-1);
        $scope.linksScroller.scroll.scrollToPage($scope.linksScroller.scroll.currPageX, index, 200);
        $scope.linksPageY = index;
    };
    $scope.onLinksScrollEnd = function (event) {
        a4p.safeApply($scope, function () {
            $scope.linksPageY = $scope.getLinksScrollerPageY();
        });
    };

    $scope.setBlur = function(isBlur) {
    	$scope.isBlurOn = isBlur;
    };

}
navigationCtrl.$inject = ['$scope', '$q', '$timeout', '$location', '$http', '$dialog', 'version',
    'srvLoad', 'srvLocalStorage', 'srvFileStorage', 'srvAnalytics', 'srvConfig',
    'srvLog', 'srvLocale', 'srvData', 'srvRunning', 'srvSecurity',
    'srvSynchro', 'cordovaReady', 'srvLink', 'srvNav', 'srvGuider', 'srvFacet', 'srvOpenUrl'];

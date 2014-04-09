'use strict';

// Declare app level module which depends on filters, and services
var appModule = angular.module('c4p', ['ngTouch', 'ngSanitize','textAngular', 'ui.bootstrap', 'c4p.filters', 'c4p.services', 'c4p.directives']);

appModule.value('version', '14S15'); //TODO cf BUILD_DATE

/*
appModule.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/contacts', {templateUrl:'partials/contacts.html', controller:ContactListCtrl})
        .when('/accounts', {templateUrl:'partials/accounts.html', controller:AccountListCtrl})
        .when('/accounts/:dbId', {templateUrl:'partials/accounts.html', controller:AccountDetailCtrl})
        .when('/accounts/:accountsId', {templateUrl:'partials/accounts.html', controller:AccountDetailCtrl})
        .when('/opportunities', {templateUrl:'partials/opportunities.html', controller:OpportunityListCtrl})
        .when('/documents', {templateUrl:'partials/documents.html', controller:DocumentListCtrl})
        .when('/events', {templateUrl:'partials/events.html', controller:EventListCtrl})
        .when('/favorites', {templateUrl:'partials/favorites.html', controller:FavoriteCtrl})
        .otherwise({redirectTo:'/contacts'})
    ;
}]);


angular.module('c4p.routes', [], function($routeProvider, $locationProvider) {
	  $routeProvider.when('/guider/:pageId', {
	    templateUrl: 'partials/guider/index.html',
	    controller: navigationCtrl
	  })
	  .when('/navigation/:pageId', {
		    templateUrl: 'partials/navigation/index.html',
		    controller: navigationCtrl
	  })
	  .when('/loading', {
		    templateUrl: 'partials/loading/index.html',
		    controller: navigationCtrl
	  })
	  .otherwise({redirectTo: '/navigation/events'});

	  //$locationProvider.html5Mode(true);
});
*/

// TextAngular
appModule.config(function($provide){
        // this demonstrates how to register a new tool and add it to the default toolbar
        $provide.decorator('taOptions', ['taRegisterTool', '$delegate', function(taRegisterTool, taOptions){ // $delegate is the taOptions we are decorating
            taRegisterTool('colorRed', {
                iconclass: "glyphicon glyphicon-pencil c4p-red",
                action: function(){
                    this.$editor().wrapSelection('forecolor', 'red');
                }
            });
            taRegisterTool('colorYellow', {
                iconclass: "glyphicon glyphicon-pencil c4p-yellow-back",
                action: function(){
                    this.$editor().wrapSelection('styleWithCSS','true');
                    this.$editor().wrapSelection('hilitecolor','yellow');
                }
            });
            // add the button to the default toolbar definition
            taOptions.toolbar[1].push('colorRed');
            //taOptions.toolbar[1].push('colorYellow');
            return taOptions;
        }]);
        // this demonstrates changing the classes of the icons for the tools for font-awesome v3.x
       
        $provide.decorator('taTools', ['$delegate', function(taTools){
            taTools.bold.iconclass = 'glyphicon glyphicon-bold';
            taTools.italics.iconclass = 'glyphicon glyphicon-italic';
            taTools.underline.iconclass = 'glyphicon glyphicon-underline';
            taTools.ul.iconclass = 'glyphicon glyphicon-list-ul';
            taTools.ol.iconclass = 'glyphicon glyphicon-list-ol';
            taTools.undo.iconclass = 'glyphicon glyphicon-undo';
            taTools.redo.iconclass = 'glyphicon glyphicon-repeat';
            taTools.justifyLeft.iconclass = 'glyphicon glyphicon-align-left';
            taTools.justifyRight.iconclass = 'glyphicon glyphicon-align-right';
            taTools.justifyCenter.iconclass = 'glyphicon glyphicon-align-center';
            taTools.clear.iconclass = 'glyphicon glyphicon-ban';
            taTools.quote.iconclass = 'glyphicon glyphicon-quote-right';
            // there is no quote icon in old font-awesome so we change to text as follows
            //delete taTools.quote.iconclass;
            //taTools.quote.buttontext = 'quote';

            taTools.html.disabled = function(){return true;};
            taTools.insertImage.disabled = function(){return true;};
            taTools.insertLink.disabled = function(){return true;};
            taTools.insertVideo.disabled = function(){return true;};
            return taTools;
        }]);

});




var serviceModule = angular.module('c4p.services', ['ngResource']);

//a4p.InternalLog.log('$exceptionHandler', 'creation');
appModule.factory('$exceptionHandler', ['$log',
    function ($log) {
        function formatError(arg) {
            if (arg instanceof Error) {
                if (arg.stack) {
                    arg = (arg.message && arg.stack.indexOf(arg.message) === -1)
                        ? 'Error: ' + arg.message + '\n' + arg.stack
                        : arg.stack;
                } else if (arg.sourceURL) {
                    arg = arg.message + '\n' + arg.sourceURL + ':' + arg.line;
                }
            }
            return arg;
        }

        return function (exception, cause) {
            try {
                a4p.ErrorLog.log(formatError(exception), formatError(cause)
                    + ", " + navigator.userAgent + ', ' + navigator.vendor + ', ' + navigator.platform);
                $log.error.apply($log, arguments);
            } catch (e) {
                // We do not want another exception
            }
        };
    }
]);

// This wrapper will queue up PhoneGap API calls if called before deviceready  and call them after deviceready fires.
// After deviceready has been called, the API calls will occur normally.
//a4p.InternalLog.log('cordovaReady', 'creation');
console.log('cordovaReady' + ' creation');
serviceModule.factory('cordovaReady', ['$window', '$rootScope',
    function ($window, $rootScope) {
        return function (userCallback) {
            var queue = [];
            // Initially queue up userCallbacks
            var impl = function () {
                // queue a function with following arguments a4pDumpData(arguments, 2)
                queue.push(Array.prototype.slice.call(arguments));
            };
            var readyCallback = function () {
                //a4p.InternalLog.log('cordovaReady', 'Cordova is ready');
                queue.forEach(function (args) {
                    // call queued function with following arguments a4pDumpData(args, 2)
                    userCallback.apply(this, args);
                });
                // next userCallbacks will be called directly for now
                impl = userCallback;
            };
            if ($window.navigator.userAgent.toLowerCase().match(/(iphone|ipod|ipad|android|blackberry|webos|symbian|ios|bada|tizen|windows phone)/) !== null) {
                //a4p.InternalLog.log('cordovaReady', 'Cordova : cordovaReady() will be called upon deviceready event');
                // if cordova : immediatly called if event 'deviceready' is already fired
                // FIXME : $window.addEventListener('deviceready', ...) does not work in Android
                $window.document.addEventListener('deviceready', function () {
                    //MLE because you could invoke app with string in an app. cf handleOpenURL & invokeString
                    a4p.safeApply($rootScope, function () {
                        if ('invokeString' in window) {
                            //alert('invokeString '+window.invokeString);
                            //a4p.InternalLog.log('onDeviceReady: ' + window.invokeString);
                            console.log('onDeviceReady: ' + window.invokeString);
                        } else {
                            //a4p.InternalLog.log('onDeviceReady: no invokeString');
                            console.log('onDeviceReady: no invokeString');
                        }
                        readyCallback();
                    });
                }, false);
            } else if ($window.navigator.userAgent.toLowerCase().match(/(firefox|msie|opera|chrome|safari|windows nt 6.2)/) !== null) {
                // windows nt 6.2 => windows 8
                //a4p.InternalLog.log('cordovaReady', 'No Cordova : cordovaReady() is called immediately');
                console.log('cordovaReady'+' No Cordova : cordovaReady() is called immediately');
                readyCallback();
            } else {
                //a4p.InternalLog.log('cordovaReady', 'Cordova or not : cordovaReady() is called in 10 seconds');
                console.log('cordovaReady'+' Cordova or not : cordovaReady() is called in 10 seconds');
                setTimeout(function () {
                    a4p.safeApply($rootScope, function () {
                        readyCallback();
                    });
                }, 10000);
            }
            return function () {
                return impl.apply(this, arguments);
            };
        };
    }
]);

// Will be unique per AngularJs injector

var srvOpenUrlSingleton = null;

//MLE because you could invoke app with string in an app. cf handleOpenURL & invokeString
function handleOpenURL(url) {
    //a4p.InternalLog.log('handleOpenURL', url);
    console.log('handleOpenURL '+url);
    window.setTimeout(function () {
        if (srvOpenUrlSingleton != null) {
            srvOpenUrlSingleton.openUrl(url);
        } else {
            window.alert('Application not yet started to import the file ' + url);
        }
    }, 200);
}

serviceModule.factory('srvOpenUrl', ['$exceptionHandler',
    function ($exceptionHandler) {
        srvOpenUrlSingleton = new SrvOpenUrl($exceptionHandler);
        return srvOpenUrlSingleton;
    }
]);

serviceModule.factory('srvTime', ['$exceptionHandler',
    function ($exceptionHandler) {
        return new SrvTime($exceptionHandler);
    }
]);

serviceModule.factory('srvModel', function () {
    return new SrvModel();
});


serviceModule.factory('srvLoad', function () {
    return new SrvLoad();
});

//a4p.InternalLog.log('srvRunning', 'creation');
serviceModule.factory('srvRunning', ['$window', '$rootScope', '$exceptionHandler', 'cordovaReady',
    function ($window, $rootScope, $exceptionHandler, cordovaReady) {
        var runningSingleton = new SrvRunning($exceptionHandler);

        if (a4p.isDefined($window.navigator) && a4p.isDefined($window.navigator.onLine)) {
            runningSingleton.setOnline($window.navigator.onLine);
        }

        // Add these listeners ONLY when cordova is ready
        cordovaReady(function () {
            //a4p.InternalLog.log('srvRunning', 'add listeners on pause, resume, online, offline, resign, active and backbutton');
            // DO NOT USE $window.addEventListener("pause", ..., true)
            $window.document.addEventListener("pause", function () {
                // console.log() is not executed in IOS until the application resume
                // see: http://stackoverflow.com/questions/8223020/pause-event-is-not-working-properly-in-phonegap-iphone
                // do not exit here because this event also appears when we take a picture
                console.log('srvRunning onPause');
                a4p.safeApply($rootScope, function () {
                    runningSingleton.setPause(true);
                });
            }, false);

            // DO NOT USE $window.addEventListener("resume", ..., true)
            $window.document.addEventListener("resume", function () {
                console.log('srvRunning onResume');
                a4p.safeApply($rootScope, function () {
                    runningSingleton.setPause(false);
                });
            }, false);

            $window.document.addEventListener("online", function () {
                a4p.safeApply($rootScope, function () {
                    //a4p.InternalLog.log('srvRunning', "Application is online");
                    runningSingleton.setOnline(true);
                });
            }, false);

            $window.document.addEventListener("offline", function () {
                a4p.safeApply($rootScope, function () {
                    //a4p.InternalLog.log('srvRunning', "Application is offline");
                    runningSingleton.setOnline(false);
                });
            }, false);

            $window.document.addEventListener("resign", function () {
                // Lock on IOS
                //a4p.InternalLog.log('srvRunning', "IOS lock");
            }, false);

            $window.document.addEventListener("active", function () {
                // Unlock on IOS
                //a4p.InternalLog.log('srvRunning', "IOS unlock");
            }, false);

            $window.document.addEventListener("backbutton", function () {
                // Exit application upon BACK button
                alert('srvRunning'+"Back button will exit the application");

                $window.navigator.notification.confirm(
                    "Are you sure you want to EXIT the program ?",
                    function checkButtonSelection(button) {
                        if((button == "1") || (button == 1)) {
                            $window.navigator.app.exitApp();//$window.history.back();
                        }
                    },
                    'EXIT :',
                    'OK,Cancel');
            }, false);
        })();

        return runningSingleton;
    }
]);

serviceModule.factory('srvLocalStorage', function () {
    var LocalStorage = a4p.LocalStorageFactory(window.localStorage);
    return new LocalStorage();
});

serviceModule.factory('srvFileStorage', ['$q', '$rootScope',
    function ($q, $rootScope) {
        return new a4p.FileStorage($q, $rootScope);
    }
]);
serviceModule.factory('srvAnalytics', ['srvLocalStorage',
    function (srvLocalStorage) {
        return new a4p.Analytics(srvLocalStorage,'UA-33541085-3');
    }
]);

serviceModule.factory('srvLog', ['srvLocalStorage',
    function (srvLocalStorage) {
        return new SrvLog(srvLocalStorage);
    }
]);

serviceModule.factory('srvSecurity', ['srvLocalStorage',
    function (srvLocalStorage) {
        return new SrvSecurity(srvLocalStorage);
    }
]);

serviceModule.factory('srvDataTransfer', ['$q', '$http', '$rootScope',
    function ($q, $http, $rootScope) {
        return new SrvDataTransfer($q, $http, $rootScope);
    }
]);

serviceModule.factory('srvFileTransfer', ['$q', '$http', 'srvFileStorage', '$rootScope',
    function ($q, $http, srvFileStorage, $rootScope) {
        return new SrvFileTransfer($q, $http, srvFileStorage, $rootScope);
    }
]);

serviceModule.factory('srvConfig', ['srvDataTransfer', 'srvLoad', 'srvLocalStorage', 'srvAnalytics',
    function (srvDataTransfer, srvLoad, srvLocalStorage, srvAnalytics) {
        return new SrvConfig(srvDataTransfer, srvLoad, srvLocalStorage, srvAnalytics);
    }
]);

serviceModule.factory('srvLocale', ['$http', 'srvLoad', 'srvLocalStorage',
    function ($http, srvLoad, srvLocalStorage) {
        return new SrvLocale($http, srvLoad, srvLocalStorage);
    }
]);

serviceModule.factory('srvSynchro', ['$q', 'srvDataTransfer', 'srvFileTransfer', '$exceptionHandler', 'srvRunning', 'srvLocalStorage', 'srvSecurity',
    function ($q, srvDataTransfer, srvFileTransfer, $exceptionHandler, srvRunning, srvLocalStorage, srvSecurity) {
        return new SrvSynchro($q, srvDataTransfer, srvFileTransfer, $exceptionHandler, srvRunning, srvLocalStorage, srvSecurity);
    }
]);

serviceModule.factory('srvData', ['$exceptionHandler', '$q', 'srvLocalStorage', 'srvConfig', 'srvLog', 'srvLocale', 'srvSecurity', 'srvDataTransfer', 'srvRunning', 'srvSynchro', 'srvFileStorage', '$rootScope',
    function ($exceptionHandler, $q, srvLocalStorage, srvConfig, srvLog, srvLocale, srvSecurity, srvDataTransfer, srvRunning, srvSynchro, srvFileStorage, $rootScope) {
        return new SrvData($exceptionHandler, $q, srvLocalStorage, srvConfig, srvLog, srvLocale, srvSecurity, srvDataTransfer, srvRunning, srvSynchro, srvFileStorage, $rootScope);
    }
]);

serviceModule.factory('srvFacet', ['srvData', 'srvLocale', 'srvConfig',
    function (srvData, srvLocale, srvConfig) {
        var srvFacet = new SrvFacet(srvData, srvLocale, srvConfig);
        srvFacet.addPossibleOrganizerFacet(c4p.Organizer.objects);
        //srvFacet.addPossibleOrganizerFacet(c4p.Organizer.recents);
        srvFacet.addPossibleOrganizerFacet(c4p.Organizer.top20);
        srvFacet.addPossibleOrganizerFacet(c4p.Organizer.mine);
        srvFacet.addPossibleOrganizerFacet(c4p.Organizer.favorites);
        srvFacet.addPossibleOrganizerFacet(c4p.Organizer.biblio);
        srvFacet.addPossibleOrganizerFacet(c4p.Organizer.month);
        srvFacet.addPossibleOrganizerFacet(c4p.Organizer.week);
        srvFacet.addPossibleOrganizerFacet(c4p.Organizer.fileDir);
        return srvFacet;
    }
]);

serviceModule.factory('srvNav', ['$exceptionHandler', 'srvData', 'srvLocale', 'srvConfig',
    function ($exceptionHandler, srvData, srvLocale, srvConfig) {
        return new SrvNav($exceptionHandler, srvData, srvLocale, srvConfig);
    }
]);

serviceModule.factory('srvLink', ['srvData', 'srvNav', 'srvLocale',
    function (srvData, srvNav, srvLocale) {
        return new SrvLink(srvData, srvNav, srvLocale);
    }
]);

serviceModule.factory('srvGuider', ['srvLocalStorage', 'srvLocale',
    function (srvLocalStorage, srvLocale) {
        return new SrvGuider(srvLocalStorage, srvLocale);
    }
]);

//a4p.InternalLog.log('serviceModule.factory', 'all factories created');

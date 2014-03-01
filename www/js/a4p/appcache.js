'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

/*
// Wait for document load event
a4p.initLoad = false;
a4p.initLoadCallbacks = [];
function a4pInitLoad() {
    a4p.InternalLog.log('appcache', "a4pInitLoad");
    a4p.initLoad = true;
    for (var i  = 0; i < a4p.initLoadCallbacks.length; i++) {
        a4p.initLoadCallbacks[i]();
    }
}
function a4pInitLoadAddCallback(callback) {
    if (a4p.initLoad) {
        callback();
    } else {
        a4p.initLoadCallbacks.push(callback);
    }
}
if (window.addEventListener) {
    a4p.InternalLog.log('appcache', 'window.addEventListener(load, a4pInitLoad)');
    window.addEventListener("load", a4pInitLoad, false);
} else if (document.addEventListener) {
    a4p.InternalLog.log('appcache', 'document.addEventListener(load, a4pInitLoad)');
    document.addEventListener("load", a4pInitLoad, false);
} else if (window.attachEvent) {
    a4p.InternalLog.log('appcache', 'window.attachEvent(onload, a4pInitLoad)');
    window.attachEvent("onload", a4pInitLoad);
} else {
    a4p.InternalLog.log('appcache', 'setTimeout(a4pInitLoad, 10s)');
    setTimeout("a4pInitLoad()", 10000);
}
*/

// Wait for cache ready event
a4p.initCache = false;
a4p.initCacheTimer = null;
/*
a4p.initCacheCallbacks = [];
*/
a4p.appCacheErrorFlag = false;

a4p.appCacheErrorCounter = window.localStorage.getItem('AppCacheErrorCounter');
if (a4p.appCacheErrorCounter == null) {
    a4p.appCacheErrorCounter = 0;
} else {
    a4p.appCacheErrorCounter = a4p.appCacheErrorCounter.valueOf();
}
window.localStorage.setItem('AppCacheErrorCounter', a4p.appCacheErrorCounter);
function a4pInitCacheErrorCounterClear() {
    a4p.appCacheErrorFlag = false;
    a4p.appCacheErrorCounter = 0;
    window.localStorage.setItem('AppCacheErrorCounter', a4p.appCacheErrorCounter);
}
function a4pInitCacheErrorCounterIncr() {
    a4p.appCacheErrorFlag = true;
    a4p.appCacheErrorCounter++;
    window.localStorage.setItem('AppCacheErrorCounter', a4p.appCacheErrorCounter);
}

a4p.appCacheReloadCounter = window.localStorage.getItem('AppCacheReloadCounter');
if (a4p.appCacheReloadCounter == null) {
    a4p.appCacheReloadCounter = 0;
} else {
    a4p.appCacheReloadCounter = a4p.appCacheReloadCounter.valueOf();
}
window.localStorage.setItem('AppCacheReloadCounter', a4p.appCacheReloadCounter);
function a4pInitCacheReloadCounterClear() {
    a4p.appCacheReloadCounter = 0;
    window.localStorage.setItem('AppCacheReloadCounter', a4p.appCacheReloadCounter);
}
function a4pInitCacheReloadCounterIncr() {
    a4p.appCacheReloadCounter++;
    window.localStorage.setItem('AppCacheReloadCounter', a4p.appCacheReloadCounter);
}

function a4pInitCache() {
    if (a4p.initCache) return;
    if (a4p.initCacheTimer) {
        clearTimeout(a4p.initCacheTimer);
        a4p.initCacheTimer = null;
    }
    a4p.InternalLog.log('appcache', "a4pInitCache");
    a4p.initCache = true;
    a4pInitCacheErrorCounterClear();
    a4pInitCacheReloadCounterClear();
    /*
    for (var i  = 0; i < a4p.initCacheCallbacks.length; i++) {
        a4p.initCacheCallbacks[i]();
    }
    */
}
/*
function a4pInitCacheAddCallback(callback) {
    if (a4p.initCache) {
        callback();
    } else {
        a4p.initCacheCallbacks.push(callback);
    }
}
*/

if (!$('html').attr('manifest')) {
    // in Apple there is NO cache (all js code is put in application)
    a4p.InternalLog.log('appcache', 'No Cache Manifest listed on the html tag.')
    a4pInitCache();
} else {
    var appCache = window.applicationCache;
    if (typeof appCache === 'undefined') {
        a4p.InternalLog.log('appcache', 'Cache undefined');
        a4pInitCache();
    } else {
        a4p.InternalLog.log('appcache', "Cache will be forced to ready state in 30 seconds");
        a4p.initCacheTimer = setTimeout(a4pInitCache, 30000);// TODO : forcer le cache n'active pas le onLoad() du DOM à priori => BUG ?

        appCache.addEventListener('error', function (e) {
            var msg = 'Cache error detected. Go on to force a reload. Error counter = ' + a4p.appCacheErrorCounter + ', error : ';
            for (var key in e) {
                if (!e.hasOwnProperty(key)) continue;
                msg += ' ' + key + '=' + e[key];
            }
            a4p.ErrorLog.log('appcache', msg);
            if (!a4p.appCacheErrorFlag) {
                // treat only first error
                if (a4p.appCacheErrorCounter < 5) {
                    a4pInitCacheErrorCounterIncr();
                    window.location.reload();
                } else {
                    a4pInitCacheErrorCounterClear();
                    if (window.confirm('Cache is not completely loaded. Server appcache invalid.' +
                        ' You can accept this incomplete cache or reload the page. Accept incomplete cache ?')) {
                        a4p.InternalLog.log('appcache', 'User accept this incomplete cache. Start application.');
                        // TODO : forcer le cache n'active pas le onLoad() du DOM à priori => BUG ?
                        a4pInitCache();
                    } else {
                        a4p.InternalLog.log('appcache', 'User reject this incomplete cache. Reload the page.');
                        window.location.reload();//a4pReload();
                    }
                }
            } else {
                // ignore repetitive errors
            }
        }, false);

        appCache.addEventListener('checking', function (e) {
            var msg = 'Cache checking :';
            for (var key in e) {
                if (!e.hasOwnProperty(key)) continue;
                msg += ' ' + key + '=' + e[key];
            }
            a4p.InternalLog.log('appcache', msg);
        }, false);

        appCache.addEventListener('progress', function (e) {
            var msg = 'Cache progress :';
            for (var key in e) {
                if (!e.hasOwnProperty(key)) continue;
                msg += ' ' + key + '=' + e[key];
            }
            a4p.InternalLog.log('appcache', msg);
            //a4p.InternalLog.log('appcache', 'Cache progress : lengthComputable=' + progressEvent.lengthComputable + ', loaded=' + progressEvent.loaded + ', total=' + progressEvent.total);
        }, false);

        appCache.addEventListener('noupdate', function (e) {
            a4p.InternalLog.log('appcache', 'Cache no update. Error counter ' + a4p.appCacheErrorCounter + ' cleared.');
            a4pInitCache();
        }, false);

        appCache.addEventListener('cached', function (e) {
            a4p.InternalLog.log('appcache', 'Cache cached. Error counter ' + a4p.appCacheErrorCounter + ' cleared.');
            a4pInitCache();
        }, false);

        appCache.addEventListener('updateready', function (e) {
            a4p.InternalLog.log('appcache', 'Cache update ready. Error counter ' + a4p.appCacheErrorCounter + ' cleared.');
            a4pInitCacheErrorCounterClear();
            if (appCache.status == appCache.UPDATEREADY) {
                if (window.confirm('A new version of this site is available. Load it ?')) {
                    a4p.InternalLog.log('appcache', 'User accept cache update. Go on to swap cache then reload.');
                    appCache.swapCache();
                    window.location.reload();//a4pReload();
                } else {
                    a4p.InternalLog.log('appcache', 'User reject cache update.');
                    a4pInitCache();
                }
            } else {
                a4p.InternalLog.log('appcache', 'No cache update ready.');
                a4pInitCache();
            }
        }, false);
    }
}

function traceCacheEvents() {
    // Convenience array of status values
    var cacheStatusValues = [];
    cacheStatusValues[0] = 'uncached';
    cacheStatusValues[1] = 'idle';
    cacheStatusValues[2] = 'checking';
    cacheStatusValues[3] = 'downloading';
    cacheStatusValues[4] = 'updateready';
    cacheStatusValues[5] = 'obsolete';

    function logEvent(e) {
        var online, status, type, message;
        var appCache = window.applicationCache;
        online = (navigator.onLine) ? 'yes' : 'no';
        status = cacheStatusValues[appCache.status];
        type = e.type;
        message = 'Cache event : online: ' + online;
        message += ', event: ' + type;
        message += ', status: ' + status;
        if (type == 'error' && navigator.onLine) {
            message += ' There was an unknown error, check your Cache Manifest.';
        }
        a4p.InternalLog.log('appcache', message);
    }

    appCache.addEventListener('cached', logEvent, false);
    appCache.addEventListener('checking', logEvent, false);
    appCache.addEventListener('downloading', logEvent, false);
    appCache.addEventListener('error', logEvent, false);
    appCache.addEventListener('noupdate', logEvent, false);
    appCache.addEventListener('obsolete', logEvent, false);
    appCache.addEventListener('progress', logEvent, false);
    appCache.addEventListener('updateready', logEvent, false);
}
// Activate the following line to trace all events
// traceCacheEvents();

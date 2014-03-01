'use strict';

/**
* @fileOverview Analytics functions
*
**/





//Namespace a4p
var a4p;
if (!a4p) a4p = {};

function successHandler(data) {
	console.log("analytics success"+data);
  	a4p.InternalLog.log('srvAnalytics', "initialization success : "+data);
}
function errorHandler(data) {
	console.error("analytics error"+data);
  	a4p.InternalLog.log('srvAnalytics', "initialization pb : "+data);
}


a4p.Analytics = (function() {


    //var Analytics = {};

    // Public API

    var mAnalyticsLS = 'a4p.Analytics';

	function Analytics(localStorage, googleAnalytics_UA_ID) {

        this.localStorage = null;
		if (a4p.isDefined(localStorage) && localStorage)
			this.localStorage = localStorage;

        this.mAnalyticsArray = [];
        if (this.localStorage) {
        	this.mAnalyticsArray = this.localStorage.get(mAnalyticsLS, this.mAnalyticsArray);
        }
        //this.uuid = '';
        //this.isDemo = false;
        //this.env = 'P';
        this.initDone = false;
        this.bEnabled = true;
        this.googleAnalytics_UA_ID = googleAnalytics_UA_ID; // GA UA-XXXXXXXX-X
        this.gaQueue = null;	// 	GA official queue
        this.gaPanalytics = null; 	// 	used ? todelete ?
        this.gaPlugin = null;	//	GAPlugin queue
	}

    if (!Analytics.prototype.init) Analytics.prototype.init = function() {
        if (this.initDone) return;

        // GA Official queue
        if(typeof _gaq !== 'undefined') {
        	a4p.InternalLog.log('srvAnalytics', 'googleAnalytics official launched.');
        	this.gaQueue = _gaq || [];
        	this.gaQueue.push(['_setAccount', this.googleAnalytics_UA_ID]);
			this.gaQueue.push(['_trackPageview']);
        }
        else {a4p.InternalLog.log('srvAnalytics', 'googleAnalytics not defined.');}

        // Plugin ? used ?
        /*if(typeof analytics !== 'undefined') {
        	console.log('srvAnalytics', "GA analytics? launched.");
            this.gaPanalytics = analytics;
            analytics.startTrackerWithId(this.googleAnalytics_UA_ID);
        }*/

        // GAPlugin
        if (typeof window.plugins !== 'undefined') {
            if(typeof window.plugins.gaPlugin !== 'undefined') {
            	a4p.InternalLog.log('srvAnalytics', "GAPlugin launched.");
    			this.gaPlugin = window.plugins.gaPlugin;
            	this.gaPlugin.init(successHandler, errorHandler, this.googleAnalytics_UA_ID, 10);
            }
        }

        this.initDone = true;
    };

    /*Analytics.prototype.setDemo = function(isDemo) {
        this.isDemo = isDemo;
    };

    Analytics.prototype.setEnv = function(env) {
        this.env = env;
    };*/
    Analytics.prototype.setEnabled = function(enable) {
        this.bEnabled = (enable == true);
    };

    Analytics.prototype.add = function(category, action, lbl, functionality, type) {

    		if (!this.bEnabled) return;
			// Add element to push only in PROD env
			//if (this.env == 'P') {
    		//var mode = this.isDemo ? 'Demo' : 'Free';

			//Store action and label into arr
			var params = {
                //mode: mode,
                category: category,
				action : action,
				label : lbl,
                type : type
			};

			// Push arr into message queue to be stored in local storage
			this.mAnalyticsArray.push(params);
	        a4p.InternalLog.log('Analytics', 'add ' + params.category + ', ' + params.action + ', ' + params.label);

	        // If functionality is not null, check in local storage that it has not already been pushed to GA
	        // If not pushed, then add it to message queue and store event in local storage
	        if (functionality) {
	        	if (this.localStorage) {

		        	if (this.localStorage.get(mAnalyticsLS + functionality + 'Funtionality', false) == false) {
	    	        	// Store variable to not send push multiple times
		        		this.localStorage.set(mAnalyticsLS + functionality + 'Funtionality', true);

	    	        	// Send push
		        		this.add('uses ' + functionality + ' funtionality', action, lbl, null);
	    	        }
	        	}
	        }

			if (this.localStorage) {
	            this.localStorage.set(mAnalyticsLS, this.mAnalyticsArray);
	        }
			//}
	};

	Analytics.prototype.run = function() {


    		if (!this.bEnabled) return;
			// Add element to push only in PROD env
			//if (this.env == 'P') {
	        a4p.InternalLog.log('Analytics', 'run - pushing ' + this.mAnalyticsArray.length + ' elements');
	        //if (this.uuid == '') {
	        //    this.uuid = (window.device) ? window.device.uuid : window.location.hostname;
	        //}
			var bOK = true;

			try {
				for(var i=0; i<this.mAnalyticsArray.length; i++) {
					var param = this.mAnalyticsArray[i];
                    if(param.type == 'view') {
                    	if (this.gaQueue) this.gaQueue.push(['_trackPageview', param.category]);
                        if (this.gaPanalytics) this.gaPanalytics.trackView(param.category);
						if (this.gaPlugin) this.gaPlugin.trackPage( successHandler, errorHandler, param.category);
                    } else  // if(param.type == 'event') 
                    {
                        if (this.gaQueue) this.gaQueue.push(['_trackEvent', param.category, param.action, param.label]);
                        //this.gaPanalytics.trackEvent(param.category, param.action, param.mode);
                        if (this.gaPanalytics) this.gaPanalytics.trackEvent(param.category, param.action, param.label);
                        if (this.gaPlugin) this.gaPlugin.trackEvent(successHandler, errorHandler, param.category, param.action, param.label);
                    }
				}
			}
			catch(e) {
	            a4p.ErrorLog.log('Analytics', ' run pb : ' + a4p.formatError(e));
				bOK = false;
			}

			if (bOK) {
				this.mAnalyticsArray = [];
				if (this.localStorage) {
	                this.localStorage.set(mAnalyticsLS, this.mAnalyticsArray);
	            }
			}

	};

    return Analytics;
})();

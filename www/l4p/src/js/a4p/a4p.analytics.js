'use strict';

/**
* @fileOverview Analytics functions
*
**/





//Namespace a4p
var a4p;
if (!a4p) a4p = {};

function successHandler(data) {
  	a4p.InternalLog.log('Analytics', "initialization success : "+data);
}
function errorHandler(data) {
  	a4p.InternalLog.log('Analytics', "initialization pb : "+data);
}


a4p.Analytics = (function() {

    var mAnalyticsLS = 'a4p.Analytics';
    var mAnalyticsFunctionnalitiesLS = 'a4p.Analytics.functionalities';


	function Analytics(localStorage, googleAnalytics_UA_ID) {

        this.localStorage = null;
		if (a4p.isDefined(localStorage) && localStorage)
			this.localStorage = localStorage;

        this.mAnalyticsArray = [];
        this.mAnalyticsFunctionnalitiesArray = [];
        if (this.localStorage) {
            this.mAnalyticsArray = this.localStorage.get(mAnalyticsLS, this.mAnalyticsArray);
            this.mAnalyticsFunctionnalitiesArray = this.localStorage.get(mAnalyticsFunctionnalitiesLS, this.mAnalyticsFunctionnalitiesArray);
        }
        //this.uuid = '';
        //this.isDemo = false;
        //this.env = 'P';
        this.vid = 'vid_undefined';
        this.uid = 'uid_undefined';
        this.initDone = false;
        this.bEnabled = true;
        this.googleAnalytics_UA_ID = googleAnalytics_UA_ID; // GA UA-XXXXXXXX-X
        this.gaQueue = null;	// 	GA official queue
        this.gaPanalytics = null; 	// 	used ? todelete ?
        this.gaPlugin = null;	//	GAPlugin queue
	}

    // Public API
    Analytics.prototype.init = function() {
        if (this.initDone) return;

        // GA Official queue
        if(typeof _gaq !== 'undefined') {
        	a4p.InternalLog.log('Analytics', 'googleAnalytics official launched.');
        	this.gaQueue = _gaq || [];
        	this.gaQueue.push(['_setAccount', this.googleAnalytics_UA_ID]);
			this.gaQueue.push(['_trackPageview']);
        }
        else {a4p.InternalLog.log('Analytics', 'googleAnalytics not defined.');}

        // Plugin ? used ?
        /*if(typeof analytics !== 'undefined') {
        	console.log('srvAnalytics', "GA analytics? launched.");
            this.gaPanalytics = analytics;
            analytics.startTrackerWithId(this.googleAnalytics_UA_ID);
        }*/

        // GAPlugin
        if (typeof window.plugins !== 'undefined') {
            if(typeof window.plugins.gaPlugin !== 'undefined') {
            	a4p.InternalLog.log('Analytics', "GAPlugin launched.");
    			this.gaPlugin = window.plugins.gaPlugin;
            	this.gaPlugin.init(successHandler, errorHandler, this.googleAnalytics_UA_ID, 10);
            }
        }

        this.initDone = true;
    };

    /*Analytics.prototype.setDemo = function(isDemo) {
        this.isDemo = isDemo;
    };*/

    Analytics.prototype.setVid = function(vid) {
        this.vid = vid;
        a4p.InternalLog.log('Analytics', 'set vid ' + this.vid);
    };
    Analytics.prototype.setUid = function(uid) {
        a4p.InternalLog.log('Analytics', 'set uid ' + uid);
        if (!uid || uid == '') return;
        this.uid = uid;
    };
    Analytics.prototype.setEnabled = function(enable) {
        this.bEnabled = (enable == true);
        a4p.InternalLog.log('Analytics', 'set enabled ' + this.bEnabled);
    };

    
    // 1)  category - This is the type of event you are sending :
    //          this.vid(14XXX - VERSION) + category(Once, Uses, Interest)
    // 2)  eventAction - This is the type of event you are sending :
    //          category(Once, Uses, Interest) + action(Login, Contact Creation, Meeting Show ...)
    // 3)  eventLabel - A label that describes the event :
    //          this.uid(user email)
    // 4)  eventValue - An application defined integer value :
    //          value(1 .. N)
    //
    // 
    // 1)  category - This is the type of event you are sending :
    //          this.vid(14XXX - VERSION) + category(Once, Uses, Interest)
   
    Analytics.prototype.add = function(category, action, value) {

		if (!this.bEnabled || !category || !action) return;

        //Check <action> functionnalities if Once.
        var shouldBeTrackedAsEvent = true;
        if (category == 'Once') {
            for (var i = 0; i < this.mAnalyticsFunctionnalitiesArray.length && shouldBeTrackedAsEvent; i++) {
                if (this.mAnalyticsFunctionnalitiesArray[i] === action) {
                    shouldBeTrackedAsEvent = false;
                }
            }
            if (shouldBeTrackedAsEvent) this.mAnalyticsFunctionnalitiesArray.push(action);
        }
        a4p.InternalLog.log('Analytics', 'shouldBeTrackedAsEvent ?' + shouldBeTrackedAsEvent);

		//Store event & view
        var paramEvent = {
            vid : this.vid,
            uid : this.uid,
            type : 'event',
            category: category,
            action : action,
            value : value || 1
        };
        var paramView = {
            vid : this.vid,
            uid : this.uid,
            type : 'view',
            category: category,
            action : action,
            value : value || 1
        };

        // Push arr into message queue to be stored in local storage
        a4p.InternalLog.log('Analytics', 'add ' + paramEvent.toString());
        if (shouldBeTrackedAsEvent) this.mAnalyticsArray.push(paramEvent);
        this.mAnalyticsArray.push(paramView);
        if (this.localStorage) this.localStorage.set(mAnalyticsLS, this.mAnalyticsArray);
        if (this.localStorage) this.localStorage.set(mAnalyticsFunctionnalitiesLS, this.mAnalyticsFunctionnalitiesArray);

        // online, we launch events
        if (checkConnection()) this.run();
	};

	Analytics.prototype.run = function() {

    		if (!this.bEnabled) return;
	        a4p.InternalLog.log('Analytics', 'run - pushing ' + this.mAnalyticsArray.length + ' elements');
	        //if (this.uuid == '') {
	        //    this.uuid = (window.device) ? window.device.uuid : window.location.hostname;
	        //}
			var bOK = true;

			try {
				for(var i=0; i<this.mAnalyticsArray.length; i++) {
					var param = this.mAnalyticsArray[i];
                    if(param.type == 'view') {
                        // this.vid(14XXX - VERSION) + category(Once, Uses, Interest) + action(Login, Contact Creation, Meeting Show ...)
                        var url = '' + this.vid + ' - ' + param.category + ' - ' + param.action;
                        a4p.InternalLog.log('Analytics', 'track view ' + url);
                    	if (this.gaQueue) this.gaQueue.push(['_trackPageview', url]);
                        if (this.gaPanalytics) this.gaPanalytics.trackView(url);
						if (this.gaPlugin) this.gaPlugin.trackPage( successHandler, errorHandler, url);
                    } else  // if(param.type == 'event') 
                    {
                        // cat : this.vid(14XXX - VERSION) + category(Once, Uses, Interest)
                        // act : category(Once, Uses, Interest) + action(Login, Contact Creation, Meeting Show ...)
                        var cat = this.vid +' - '+ param.category;
                        var act = param.category +' - '+ param.action;
                        var lab = param.uid;
                        var val = param.value;
                        a4p.InternalLog.log('Analytics', 'track event ' + cat + ', ' + act + ', ' + lab + ', ' + val);
                        if (this.gaQueue) this.gaQueue.push(['_trackEvent', cat, act, lab, val]);
                        //this.gaPanalytics.trackEvent(param.category, param.action, param.mode);
                        if (this.gaPanalytics) this.gaPanalytics.trackEvent(cat, act, lab, val);
                        if (this.gaPlugin) this.gaPlugin.trackEvent(successHandler, errorHandler, cat, act, lab, val);
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

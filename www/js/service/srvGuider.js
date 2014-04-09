'use strict';

var SrvGuider = (function() {
    function Service(srvLocalStorage,srvLocale) {
    	this.srvLocalStorage = srvLocalStorage;
    	this.srvLocale = srvLocale;
    	this.initDone = false;
    	this.guiderScreens = [];
    }
    /**
     * Init all screens and get in srvLocalStorage screens already seen
     */
    Service.prototype.init = function () {
        if (this.initDone) return;

        //var guiderSeen = this.srvLocalStorage.get('GuiderSeen', '');

        //TODO
        /*
        this.guiderScreens = [	'navigation-calendar':{	seen:	guiderSeen['navigation-calendar']?1:0,
        												screens:[{	img:'/img/guider/navi.png',
        															text: this.srvLocale.translations.htmlMsgSynchronizationServerPb}
        														]
        											},
        						'navigation-event':{}
        					];
        */
        this.initDone = true;
        a4p.InternalLog.log('guiderService', "initialized");
    };


    /**
     * @param page Navigation page
     * @param slide Navigation slide
     * @return true if you have to see this screen (already seen ?)
     */
    Service.prototype.hasToSee = function (page, slide) {
        if (!this.initDone) return false;

        //var hasToSee = false;
        var nav = page+'-'+slide;
        //TODO this.guiderScreens; // guiderSeen

        var ls = false;//this.srvLocalStorage.get('C4P_GuiderSeen_'+nav);

        if (nav == "navigation-calendar")
        	return !this.srvLocalStorage.get('C4P_GuiderSeen_'+nav);
        else if (nav == "navigation-events")
        	return !this.srvLocalStorage.get('C4P_GuiderSeen_'+nav);
        else if (nav == "meeting-meeting")
        	return !this.srvLocalStorage.get('C4P_GuiderSeen_'+nav);

        return false;
    };



    /**
     * @param page Navigation page
     * @param slide Navigation slide
     * @return screens Data of the guider to show
     */
    Service.prototype.screens = function (page, slide) {
        if (!this.initDone) return null;

        var nav = page+'-'+slide;

        var screens = [];

        if (nav == "navigation-calendar")
        	screens = [	{	img:'./img/guider/calendar_01.png',
							text: this.srvLocale.translations.htmlTextGuiderCalendar}
						];
        else if (nav == "navigation-events")
        	screens = [	{	img:'./img/guider/event_01.png',
							text: this.srvLocale.translations.htmlTextGuiderEvent}
					];
        else if (nav == "meeting-meeting")
        	screens = [	{	img:'./img/guider/meeting_01.png',
							text: this.srvLocale.translations.htmlTextGuiderMeeting}
					];


        return screens;
    };



    /**
     * Set navigation as screen seen and store it in srvLocalStorage
     * @param page Navigation page
     * @param slide Navigation slide
     */
    Service.prototype.hasSeen = function (page, slide) {
        if (!this.initDone) return;

        var hasSeen = true;
        var nav = page+'-'+slide;
        this.srvLocalStorage.set('C4P_GuiderSeen_'+nav, hasSeen);
    };

    return Service;
})();

'use strict';

function ctrlTimeline($scope, srvData, version) {

    /**
   	 * Injected Services
   	 */

    $scope.srvData = srvData;

    /**
   	 * Variables
   	 */


	/**
	 * Functions
	 */

    $scope.initTimeline = function () {
    };





    $scope.buildTimelineData = function(){

    	var dataObject = {};
        if (!$scope.srvNav || !$scope.srvNav.item) return dataObject;



        // Set Nav information
		$scope.setNavTitle($scope.getItemTitle($scope.srvNav.item.a4p_type));

        var itemDetailName = $scope.getItemNameById($scope.srvNav.item.id.dbid);
        var itemDetailDescription = $scope.getItemHtmlDescriptionById($scope.srvNav.item.id.dbid);

    	var main_headline = itemDetailName;
    	var main_descr = itemDetailDescription;
    	var main_thumb_url = $scope.srvNav.item.thumb_url;

    	var dates = [];
    	var eras = [];

    	for(var i=0; i < 10; i++){

    		var stardDate = "2011,12,0"+i;
    		var endDate = "2011,12,1"+i;

    		var date = {
	                "startDate":stardDate,
	                "endDate":endDate,
	                "headline":"Headline Goes Here",
	                "text":"<p>Body text goes here, some HTML is OK</p>",
	                "tag":"This is Optional",
	                "classname":"optionaluniqueclassnamecanbeaddedhere",
	                "asset": {
	                    "media":"http://twitter.com/ArjunaSoriano/status/164181156147900416",
	                    "thumbnail":"optional-32x32px.jpg",
	                    "credit":"Credit Name Goes Here",
	                    "caption":"Caption text goes here"
	                }
	           };
    		  var era = {
	                "startDate":stardDate,
	                "endDate":endDate,
	                "headline":"ERA Headline Goes Here",
	                "text":"<p>ERA Body text goes here, some HTML is OK</p>",
	                "tag":"This is Optional"
	            };

    		  dates.push(date);
    		  eras.push(era);
    	}


    	var timeline = {
    			"headline":main_headline,
    	        "type":"default",
    	        "text":main_descr,
    	        "asset": { "media":main_thumb_url},
    	        "date": dates,
    	        "era": eras};

    	dataObject = {"timeline": timeline};

/*
    	dataObject =
    	{
    	    "timeline":
    	    {
    	        "headline":headline,
    	        "type":"default",
    	        "text":"<p>Intro body text goes here, some HTML is ok</p>",
    	        "asset": {
    	            "media":"http://yourdomain_or_socialmedialink_goes_here.jpg",
    	            "credit":"Credit Name Goes Here",
    	            "caption":"Caption text goes here"
    	        },
    	        "date": [
    	            {
    	                "startDate":"2011,12,10",
    	                "endDate":"2011,12,11",
    	                "headline":"Headline Goes Here",
    	                "text":"<p>Body text goes here, some HTML is OK</p>",
    	                "tag":"This is Optional",
    	                "classname":"optionaluniqueclassnamecanbeaddedhere",
    	                "asset": {
    	                    "media":"http://twitter.com/ArjunaSoriano/status/164181156147900416",
    	                    "thumbnail":"optional-32x32px.jpg",
    	                    "credit":"Credit Name Goes Here",
    	                    "caption":"Caption text goes here"
    	                }
    	            }
    	        ],
    	        "era": [
    	            {
    	                "startDate":"2011,12,10",
    	                "endDate":"2011,12,11",
    	                "headline":"ERA Headline Goes Here",
    	                "text":"<p>ERA Body text goes here, some HTML is OK</p>",
    	                "tag":"This is Optional"
    	            }

    	        ]
    	    }
    	};*/

    	return dataObject;
    };





    /**
     * Initialization
     */
    $scope.initTimeline();

};
ctrlTimeline.$inject = ['$scope','srvData','version'];

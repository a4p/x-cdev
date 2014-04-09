'use strict';

function ctrlAddRatings($scope, srvLocale, ratings, $modalInstance) {

    /**
     * Variables
     */
	$scope.ratingsChosen = ratings;


    /**
     * Functions
     */
    $scope.initAddRatings = function () {
        $scope.ratingsDone = ratings.slice(0);
        $scope.srvLocale = srvLocale;
        //
        $scope.possibleRatings = [
            {code:'Feeling', name: $scope.srvLocale.translations.htmlTextRatingsFeeling, type: 'star', selected: false, value: 0},
            {code:'Quality', name: $scope.srvLocale.translations.htmlTextRatingsQuality, type: 'star', selected: false, value: 0},
            {code:'Environment', name: $scope.srvLocale.translations.htmlTextRatingsEnvironment, type: 'star', selected: false, value: 0},
            {code:'Achievement', name: $scope.srvLocale.translations.htmlTextRatingsObjectiveAchieved, type: 'check', selected: false, value: 0},
            {code:'Meeting', name: $scope.srvLocale.translations.htmlTextRatingsMeetingDone, type: 'check', selected: false, value: 0}
        ];

    };

    $scope.close = function () {
        $modalInstance.dismiss();
    };
    $scope.add = function () {
        $modalInstance.close($scope.ratingsChosen);
    };

    $scope.toggleItem = function (rating) {
    	if (!rating) return;
    	if (rating.selected) {
    		//remove from chosen
        	rating.selected = false;
        	var index = -1;
        	for (var i=0;i < $scope.ratingsChosen.length && index < 0; i++){
        		if ($scope.ratingsChosen[i].name == rating.name) {
        			index = i;
        		}
        	}
        	$scope.ratingsChosen.splice(index,1);
    	}
    	else {
    		//add to chosen
    		rating.selected = true;
	    	var rate = angular.copy(rating);
	    	$scope.ratingsChosen.push(rate);
    	}
    };

    /**
     * Initialization
     */
    $scope.initAddRatings();
}

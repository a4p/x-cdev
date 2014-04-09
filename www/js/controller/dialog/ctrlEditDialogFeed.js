'use strict';

function ctrlEditDialogFeed($scope, srvLocale, srvData, title, feed, editable, modeEdit, $modalInstance) {

    /**
     * Helpers
     */


    /**
     * Variables
     */
    $scope.title = title || $scope.srvLocale.translations.htmlTitleDialogFeed;
    $scope.feedLastUpdate = 0;
    $scope.modeEdit = modeEdit;
    $scope.editable = editable;

    $scope.srvLocale = srvLocale;
    $scope.srvData = srvData;
    $scope.feed = feed;
    $scope.feedObject = $scope.srvData.getObject(feed.id.dbid);

    // Watch on Feed Update
    $scope.$watch('feed.body', function () {
        $scope.setLastUpdate();
    });

    /**
     * Functions
     */
    $scope.getTypeColor = function() {
        return c4p.Model.getTypeColor('Document');
    };
    $scope.setLastUpdate = function () {
        $scope.feedLastUpdate = new Date();
    };

    //close dialog feed , init $scope.feed
    $scope.close = function () {
        $modalInstance.dismiss(undefined);
    };

    $scope.setSubject = function (subject) {
        $scope.feed.title = subject;
    };

    $scope.setBody = function (body) {
        $scope.feed.body = body;
    };

    //create feed
    $scope.createFeed = function () {
    	$scope.feed.editable = true;
        $modalInstance.close($scope.feed);
    };

    $scope.setModeEdit = function(modeEdit){
    	$scope.modeEdit = modeEdit;
    };
}

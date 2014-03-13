'use strict';

function ctrlEditDialogErrorReport($scope, srvLocale, $dialog, dialog) {

    /**
     * Variables
     */

    $scope.srvLocale = srvLocale;
    $scope.feedbackLastUpdate = 0; //used for scroll update
    $scope.feedback = {message:''};

    /**
     * Functions
     */

    $scope.submit = function () {
        dialog.close({feedback:$scope.feedback});
    };

    $scope.close = function () {
        dialog.close(undefined);
    };
}

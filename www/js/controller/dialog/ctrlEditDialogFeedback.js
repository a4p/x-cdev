'use strict';

function ctrlEditDialogFeedback($scope, srvLocale, emailRequired, title, $dialog, dialog) {

    /**
     * Variables
     */

    $scope.srvLocale = srvLocale;
    $scope.feedbackLastUpdate = 0; //used for scroll update
    $scope.feedback = {message:'', emailRequired:emailRequired, email:'', phone:'', title:title||srvLocale.translations.htmlTitleFeedback};

    /**
     * Functions
     */

    $scope.submit = function () {

    	if ($scope.feedback.emailRequired && !$scope.feedback.email) return;
        dialog.close({feedback:$scope.feedback});
    };

    $scope.close = function () {
        dialog.close(undefined);
    };
}

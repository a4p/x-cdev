'use strict';

function ctrlEditDialogFeedback($scope, srvLocale, title, message, onlyFeedback, emailRequired, $modalInstance) {

    /**
     * Variables
     */

    $scope.srvLocale = srvLocale;
    $scope.onlyFeedback = (onlyFeedback == true);
    $scope.feedback = {message:message, emailRequired:emailRequired, email:'', phone:'', title: title ||srvLocale.translations.htmlTitleFeedback};

    /**
     * Functions
     */

    $scope.submit = function () {

    	if ($scope.feedback.emailRequired && !$scope.feedback.email) return;
        $modalInstance.close({feedback:$scope.feedback});
    };

    $scope.close = function () {
        $modalInstance.dismiss('cancel');
    };
}

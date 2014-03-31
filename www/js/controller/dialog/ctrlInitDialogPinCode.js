'use strict';

function ctrlInitDialogPinCode($scope, srvLocale, $modalInstance) {

    /**
     * Constants
     */
    $scope.srvLocale = null;
    $scope.pinCode = "";
    $scope.warningEmptyPinCode = false;
    /**
     * Functions
     */

    $scope.init = function (srvLocale) {
        $scope.srvLocale = srvLocale;
    };

    $scope.closeDialog = function () {
        $modalInstance.dismiss();
    };


    $scope.setPinCode = function (pinCode) {
        $scope.pinCode = pinCode;
    };

    $scope.submit = function () {
        if ($scope.pinCode == "" || a4p.isUndefined($scope.pinCode)) {
            a4p.safeApply($scope, function() {
                $scope.warningEmptyPinCode = true;
            });
        }
        else {
            $modalInstance.close($scope.pinCode);
        }
    };

    /**
     * Initialization
     */
    $scope.init(srvLocale);
}

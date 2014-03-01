'use strict';

function ctrlInitDialogPinCode($scope, srvLocale, dialog) {

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
        dialog.close(undefined);
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
            dialog.close($scope.pinCode);
        }
    };

    /**
     * Initialization
     */
    $scope.init(srvLocale);
}

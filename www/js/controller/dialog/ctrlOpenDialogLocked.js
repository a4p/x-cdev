'use strict';

function ctrlOpenDialogLocked($scope, srvLocale, srvSecurity, dialog) {

    /**
     * Constants
     */
    $scope.srvLocale = srvLocale;
    $scope.srvSecurity = srvSecurity;
    $scope.pinCode = "";
    $scope.oldPinCodeError = false;
    
    /**
     * Functions
     */

    $scope.closeDialog = function () {
        dialog.close(undefined);
    };

    $scope.setPinCode = function (pinCode) {
        $scope.pinCode = pinCode;
    };

    $scope.submit = function () {
        a4p.safeApply($scope, function() {
            if (!$scope.oldPinIncorrect()) {
                dialog.close();
            }
        });
    };
    
    $scope.oldPinIncorrect = function() {
        $scope.oldPinCodeError = false;
        
    	if(a4p.isDefined($scope.pinCode) && $scope.pinCode != "") {
    		if(!srvSecurity.verify($scope.pinCode)) {
                $scope.oldPinCodeError = true;
    		}
    	}
    	
    	return $scope.oldPinCodeError;
    };
}

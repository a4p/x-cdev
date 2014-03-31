'use strict';

function ctrlOpenDialogLocked($scope, srvLocale, srvSecurity, $modalInstance) {

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
        $modalInstance.dismiss();
    };

    $scope.setPinCode = function (pinCode) {
        $scope.pinCode = pinCode;
    };

    $scope.submit = function () {
        a4p.safeApply($scope, function() {
            if (!$scope.oldPinIncorrect()) {
                $modalInstance.close();
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

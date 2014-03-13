'use strict';

function ctrlModifyDialogPinCode($scope, srvLocale, srvSecurity, dialog) {

    /**
     * Constants
     */
    $scope.srvLocale = srvLocale;
    $scope.srvSecurity = srvSecurity;
    $scope.newPinCode = "";
    $scope.oldPinCode = "";
    $scope.firstError = "";
    $scope.oldPinCodeError = false;
    $scope.newPinCodeError = false;

    /**
     * Functions
     */

    $scope.closeDialog = function () {
        dialog.close(undefined);
    };


    $scope.setNewPinCode = function (newPinCode) {
        $scope.newPinCode = newPinCode;
    };

    $scope.setOldPinCode = function (oldPinCode) {
        $scope.oldPinCode = oldPinCode;
    };

    $scope.submitNewPinCode = function () {
        a4p.safeApply($scope, function() {
            if (!$scope.oldPinIncorrect() && !$scope.sameAsOldPin()) {
                dialog.close($scope.newPinCode);
            }
        });
    };
    
    $scope.oldPinIncorrect = function() {
        $scope.oldPinCodeError = false;
        
    	if(a4p.isDefined($scope.oldPinCode) && $scope.oldPinCode != "") {
    		if(!srvSecurity.verify($scope.oldPinCode)) {
                $scope.oldPinCodeError = true;
    		}
    	}
    	
    	return $scope.oldPinCodeError;
    };
    
    $scope.sameAsOldPin = function() {
        $scope.newPinCodeError = false;
        
        if(a4p.isDefined($scope.oldPinCode) && $scope.oldPinCode != ""
        	&& a4p.isDefined($scope.newPinCode) && $scope.newPinCode != "") {
	        if($scope.newPinCode == $scope.oldPinCode) {
	            $scope.newPinCodeError = true;
	        }
        }
        
        return $scope.newPinCodeError;
    };
}
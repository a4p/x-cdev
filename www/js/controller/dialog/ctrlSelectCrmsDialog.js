'use strict';

/**
 * Dialog to select actions
 *
 * @param $scope
 * @param {Object} srvLocale Locale service
 * @param {Array} possibleCrms Array of possible CRMs (object of type {key:name, active:flag})
 * @param {boolean} multiple Can we select many actions or only one ?
 * @param {Object} dialog Dialog service (from ui-bootstrap)
 */
function ctrlSelectCrmsDialog($scope, srvLocale, possibleCrms, activeCrms, multiple, $modalInstance) {

    /**
     * Initialisation
     */

    $scope.srvLocale = srvLocale;// Pointer on srvLocale
    $scope.possibleCrms = possibleCrms;
    $scope.activeCrms = activeCrms;
    $scope.multiple = multiple;// Multiple selection activated

    $scope.selectedCrms = {};
    for (var i = 0; i < $scope.possibleCrms.length; i++) {
        var crm = $scope.possibleCrms[i];
        if (isValueInList($scope.activeCrms, crm)) {
            $scope.selectedCrms[crm] = true;
        } else {
            $scope.selectedCrms[crm] = false;
        }
    }

    /**
     * Functions
     */

    $scope.validateDialog = function () {
        var result = [];
        for (var i = 0; i < $scope.possibleCrms.length; i++) {
            var crm = $scope.possibleCrms[i];
            if ($scope.selectedCrms[crm]) {
                result.push(crm);
                if (!multiple) break;
            }
        }
        $modalInstance.close(result);
    };

    $scope.closeDialog = function () {
        $modalInstance.dismiss();
    };

    $scope.toggleItem = function (key) {
        if (a4p.isUndefined($scope.selectedCrms[key])) return;
        if ($scope.selectedCrms[key]) {
            $scope.selectedCrms[key] = false;
        } else {
            if (!multiple) {
                for (var i = 0; i < $scope.possibleCrms.length; i++) {
                    var crm = $scope.possibleCrms[i];
                    $scope.selectedCrms[crm] = false;
                }
            }
            $scope.selectedCrms[key] = true;
        }
    };
}

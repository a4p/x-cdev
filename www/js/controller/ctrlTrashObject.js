'use strict';

/**
 * Drop objects controller
 *
 * @param $scope
 */
function ctrlTrashObject($scope) {

    $scope.dndActive = false;
    $scope.dropOver = false;
    $scope.dragObject = null;

    $scope.dndStart = function (event) {
        if (event.dataTransfer) {
            a4p.safeApply($scope, function() {
                $scope.dndActive = true;
                $scope.dragObject = event.dataTransfer;
            });
        }
    };
    $scope.dndEnd = function (event) {
        if ($scope.dndActive) {
            a4p.safeApply($scope, function() {
                $scope.dndActive = false;
                $scope.dragObject = null;
            });
        }
    };
    $scope.dndCancel = function (event) {
        if ($scope.dndActive) {
            a4p.safeApply($scope, function() {
                $scope.dndActive = false;
                $scope.dragObject = null;
            });
        }
    };
    $scope.dropOverEnter = function (event) {
        if ($scope.dndActive && !$scope.dropOver) {
            a4p.safeApply($scope, function() {
                $scope.dropOver = true;
            });
        }
    };
    $scope.dropOverLeave = function (event) {
        if ($scope.dndActive && $scope.dropOver) {
            a4p.safeApply($scope, function() {
                $scope.dropOver = false;
            });
        }
    };
    $scope.dropEnd = function (event) {
        //alert("TODO - trash after confirmation " + a4pDumpData(event.dataTransfer, 1));
        $scope.removeItemDialog(event.dataTransfer);
    };
}

ctrlTrashObject.$inject = ['$scope'];





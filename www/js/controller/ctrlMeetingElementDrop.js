'use strict';

/**
 * Drop objects controller
 *
 * @param $scope
 */
function ctrlMeetingElementDrop($scope) {

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
    $scope.dropEnd = function (event, index) {
        // TODO : Drag and Drop over sub Plans : replace $scope.plans by plan list of parent Plan
        $scope.moveMeetingElement($scope.plans, $scope.dragMeetingElementIdx, index);
    };
}
ctrlMeetingElementDrop.$inject = ['$scope'];

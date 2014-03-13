'use strict';

/**
 * Drop objects controller
 *
 * @param $scope
 */
function ctrlMeetingObjLinkDrop($scope,  srvData, srvConfig) {

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
        var obj= event.dataTransfer;
        var aPlan = $scope.selectedMeetingPlan;

        srvData.newAttachment('Plannee', obj, aPlan);
        aPlan.title = srvConfig.getItemName(obj);

        //SEEMS Dirty BUT
        // it is needed to refresh correctly the update of the ng-include directive
        //
        a4p.safeApply($scope, function() {
            $scope.setMeetingObject(null);
        });

        a4p.safeApply($scope, function() {
            //set view to plan
            $scope.setActionItem('plan');
            $scope.setMeetingObject(aPlan);
        });
    };
}
ctrlMeetingObjLinkDrop.$inject = ['$scope', 'srvData', 'srvConfig'];





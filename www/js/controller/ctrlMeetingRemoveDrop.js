'use strict';

/**
 * Drop objects controller
 *
 * @param $scope
 */
function ctrlMeetingRemoveDrop($scope, srvLocale, srvData, srvNav, srvLink, srvConfig) {

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
        var obj = event.dataTransfer;
        if (a4p.isDefinedAndNotNull(obj) && (obj.a4p_type == 'Plan') && (obj.parent_id == srvNav.item.id.dbid)) {
            // remove meeting object
            // TODO : Remove in sub Plans : replace $scope.plans by plan list of parent Plan
            $scope.removeMeetingElement($scope.plans, obj.pos);

            a4p.safeApply($scope, function() {
                //set view to plan
                $scope.setActionItem('plan');
                $scope.setMeetingObject(null);
            });
        }
    };
}
ctrlMeetingRemoveDrop.$inject = ['$scope', 'srvLocale', 'srvData', 'srvNav', 'srvLink', 'srvConfig']

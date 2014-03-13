'use strict';

function ctrlNavObject($scope, srvNav, srvConfig) {

    $scope.closeAsidePage = false;
    $scope.item = srvNav.item;
    $scope.current = srvNav.current;
    if (srvNav.item) {
        $scope.itemIcon = c4p.Model.getItemIcon(srvNav.item);
        $scope.itemName = srvConfig.getItemName(srvNav.item);
    } else {
        $scope.itemIcon = '';
        $scope.itemName = '';
    }

    $scope.navListener = srvNav.addListenerOnUpdate(function (callbackId, action, page, slide, id) {
        if (action == 'clear') {
            a4p.safeApply($scope, function() {
                $scope.item = null;
                $scope.current = null;
                $scope.itemIcon = '';
                $scope.itemName = '';
            });
        } else if ((action == 'goto') || (action == 'update')) {
            a4p.safeApply($scope, function() {
                $scope.item = srvNav.item;
                $scope.current = srvNav.current;
                $scope.itemIcon = c4p.Model.getItemIcon($scope.item);
                $scope.itemName = srvConfig.getItemName($scope.item);
            });
        }
    });

    $scope.$on('$destroy', function (event) {
        srvNav.cancelListener($scope.navListener);
    });
}
ctrlNavObject.$inject = ['$scope', 'srvNav', 'srvConfig'];




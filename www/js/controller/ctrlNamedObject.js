'use strict';

function ctrlNamedObject($scope, srvConfig) {

    $scope.init = function (item) {
        $scope.item = item;
        $scope.itemIcon = c4p.Model.getItemIcon(item);
        $scope.itemName = srvConfig.getItemName(item);
   	};

}
ctrlNamedObject.$inject = ['$scope', 'srvConfig'];




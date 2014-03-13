'use strict';

function ctrlInlinedObject($scope, srvData, srvConfig) {

    // TODO : listen to srvData to update fields if item updated

    $scope.init = function (item) {
        $scope.item = item;
        $scope.itemIcon = c4p.Model.getItemIcon(item);
        $scope.itemName = srvConfig.getItemName(item);
   	};

}
ctrlInlinedObject.$inject = ['$scope', 'srvData', 'srvConfig'];




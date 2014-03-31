'use strict';

function ctrlInlinedObject($scope, srvData, srvConfig) {

    // TODO : listen to srvData to update fields if item updated

    $scope.init = function (item) {
        $scope.item = item;
        $scope.itemIcon = c4p.Model.getItemIcon(item);
        $scope.itemColor = c4p.Model.getItemColor(item);
        $scope.itemName = srvConfig.getItemName(item);

        //how many relation links
        var linked = $scope.srvData.getLinkedObjects(item);
        $scope.itemRelationCount = (linked && typeof linked != 'undefined') ? linked.length : 0;
   	};

}
ctrlInlinedObject.$inject = ['$scope', 'srvData', 'srvConfig'];




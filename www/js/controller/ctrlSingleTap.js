'use strict';

function ctrlSingleTap($scope) {

    $scope.singleTapFocusId = '';

    $scope.firstSingleTap = function (id) {
        if ($scope.singleTapFocusId == id) return false;// Already focus, do next action
        $scope.singleTapFocusId = id;
        return true;// Not yet focused, do NOT yet next action
    };

}
ctrlSingleTap.$inject = ['$scope'];


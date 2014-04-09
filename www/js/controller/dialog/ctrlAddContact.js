'use strict';

function ctrlAddContact($scope, srvLocale, contacts, $modalInstance) {

    /**
     * Initialisation
     */

    $scope.srvLocale = srvLocale;
    $scope.possibleContacts = contacts;
    $scope.idxChosen = -1;

    /**
     * Functions
     */

    $scope.add = function () {
        var result = undefined;
        if ($scope.idxChosen >= 0) {
            result = contacts[$scope.idxChosen];
        }
        $modalInstance.close(result);
    };

    $scope.close = function () {
        $modalInstance.dismiss();
    };

    $scope.toggleItem = function (idxChosen) {

        if ($scope.idxChosen == idxChosen) {
            $scope.idxChosen = -1;
        } else {
            $scope.idxChosen = idxChosen;
        }
    };
}

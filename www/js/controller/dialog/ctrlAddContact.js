'use strict';

function ctrlAddContact($scope, srvLocale, contacts, dialog) {

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
        dialog.close(result);
    };

    $scope.close = function () {
        dialog.close();
    };

    $scope.toggleItem = function (idxChosen) {

        if ($scope.idxChosen == idxChosen) {
            $scope.idxChosen = -1;
        } else {
            $scope.idxChosen = idxChosen;
        }
    };
}

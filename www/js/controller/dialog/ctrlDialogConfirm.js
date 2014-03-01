'use strict';

function ctrlDialogConfirm($scope, text, textArray, srvLocale, dialog) {
    /**
     * Variables
     */
    $scope.srvLocale = null;
    $scope.text = null;
    $scope.textArray = null;

    /**
     * Functions
     */

    $scope.init = function (text, textArray, srvLocale) {

        a4p.InternalLog.log('ctrlDialogConfirm',text);
        $scope.srvLocale = srvLocale;
        $scope.text = text;
        $scope.textArray = textArray;
    };

    $scope.submit = function () {
        console.log('ctrlDialogConfirm : submit');
        dialog.close(true);
    };

    $scope.close = function () {
        console.log('ctrlDialogConfirm : close');
        dialog.close(false);
    };

    /**
     * Initialization
     */
    $scope.init(text, textArray, srvLocale);
}

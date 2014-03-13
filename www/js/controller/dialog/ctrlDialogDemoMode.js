'use strict';

function ctrlDialogDemoMode($scope, textFunc, srvLocale, dialog) {
    /**
     * Variables
     */
    $scope.srvLocale = null;
    $scope.textFunc = null;
    $scope.textDemo = null;

    /**
     * Functions
     */

    $scope.init = function (textFunc, srvLocale) {
        $scope.srvLocale = srvLocale;
        $scope.textFunc = textFunc;
        $scope.textDemo = $scope.srvLocale.translations.htmlTextDemoModeImpossible;
    };

    $scope.login = function () {
        dialog.close('login');
    };
    $scope.register = function () {
        dialog.close('register');
    };

    $scope.close = function () {
        dialog.close(false);
    };

    /**
     * Initialization
     */
    $scope.init(textFunc, srvLocale);
}

'use strict';

function ctrlDialogDemoMode($scope, textFunc, srvLocale, $modalInstance) {
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
        $modalInstance.close('login');
    };
    $scope.register = function () {
        $modalInstance.close('register');
    };

    $scope.close = function () {
        $modalInstance.dismiss(false);
    };

    /**
     * Initialization
     */
    $scope.init(textFunc, srvLocale);
}

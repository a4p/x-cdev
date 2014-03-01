'use strict';

function ctrlGuiderDialog($scope, srvLocale, screens, height, width, dialog) {

    /**
     * Variables
     */
    $scope.slidesInterval = -1;
    $scope.slidesHeight = height - 30;
    $scope.slidesWidth = width - 40;
    $scope.slides = [];

    /**
     * Functions
     */
    $scope.init = function (srvLocale,screens) {
        $scope.srvLocale = srvLocale;

        //TODO screen integration
        $scope.slides = [];

        //[{text:"tessst", img:"./img/guider/calendar_01.png"},
        //                 {text:"tess2<br> avec super testtt", img:"./img/guider/calendar_02.png"}];
        for(var i=0; i<screens.length; i++){
        	var carousel = {};
        	carousel = {img:screens[i].img, text: screens[i].text};
        	$scope.slides.push(carousel);
        }

    };



    $scope.close = function () {
        dialog.close(true);
    };

    /**
     * Initialization
     */
    $scope.init(srvLocale,screens);
}

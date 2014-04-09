'use strict';

function ctrlGuiderDialog($scope, $sce, srvLocale) {
    //, srvLocale, screens, height, width, dialog) {

    /*
    $scope.slidesInterval = -1;
    $scope.slidesHeight = height - 30;
    $scope.slidesWidth = width - 40;
    $scope.slides = [];

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

    $scope.init(srvLocale,screens);
    */


    $scope.guider_interval = -1;//5000;
    $scope.guider_slides = [
        {image:'img/guider/c4p-guider-01.png', text:srvLocale.translations.htmlTextGuiderSlide01},
        {image:'img/guider/c4p-guider-02.png', text:srvLocale.translations.htmlTextGuiderSlide02},
        {image:'img/guider/c4p-guider-03.png', text:srvLocale.translations.htmlTextGuiderSlide03}
    ];


    $scope.to_trusted = function(html_code) {
        return $sce.trustAsHtml(html_code);
    }
}


ctrlGuiderDialog.$inject = ['$scope','$sce', 'srvLocale'];


'use strict';

function ctrlShowImage($scope, imageData, dialog) {
    /*
     * Variables
     */
    $scope.sensePanel = null;
    $scope.imageList = [];
    $scope.imageIndex = -1;
    $scope.imageObject = null;

    /*
     * Functions
     */
    $scope.init = function(imageData) {
        if(Array.isArray(imageData)) {
            $scope.imageList = imageData;
        }
        else {
            $scope.imageList.push(imageData);
        }
        $scope.documentIndex = 0;
        $scope.imageObject = $scope.imageList[0];
    };

    $scope.setSensePanel = function(sense) {
        $scope.sensePanel = sense;
    };

    $scope.close = function() {
        dialog.close();
    };

    $scope.onImageSwipe = function (event) {
        if ((event.side == 'left')) {
            a4p.safeApply($scope, function () {
                console.log('swipe left');
                $scope.nextImage();
            });
        } else if (event.side == 'right') {
            a4p.safeApply($scope, function () {
                console.log('swipe right');
                $scope.prevImage();
            });
        }
    };

    $scope.nextImage = function () {
        $scope.imageIndex++;
        if ($scope.imageIndex >= $scope.imageList.length) {
            $scope.imageIndex = 0;
        }
        console.log('Image index: ' + $scope.documentIndex);
        $scope.imageObject = $scope.imageList[$scope.imageIndex];
        if ($scope.sensePanel) {
            $scope.sensePanel.scroll.zoom(0, 0, 1, 300);
            $scope.sensePanel.sizeRefresh();
        }
    };

    $scope.prevImage = function () {
        $scope.imageIndex--;
        if ($scope.imageIndex < 0) {
            $scope.imageIndex = $scope.imageList.length - 1;
        }
        console.log('Image index: ' + $scope.imageIndex);
        $scope.imageObject = $scope.imageList[$scope.imageIndex];
        if ($scope.sensePanel) {
            $scope.sensePanel.scroll.zoom(0, 0, 1, 300);
            $scope.sensePanel.sizeRefresh();
        }
    };

    /*
     * Initialization
     */
    $scope.init(imageData);
}

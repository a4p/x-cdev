'use strict';

/**
 * Document Viewer controller
 *
 * @param $scope
 */
function ctrlViewer($scope, srvData, srvNav, srvLocale) {

    /**
     * Variables
     */
    $scope.sensePanel = null;
    $scope.documentList = [];
    $scope.documentIndex = -1;
    $scope.documentObject = null;

    $scope.isFullScreen = false;

    $scope.handleNavUpdate = srvNav.addListenerOnUpdate(function (callbackId, action, page, slide, id) {
        if ((action == 'goto') || (action == 'update')) {
            $scope.setDocumentListFromLinkItem(srvNav.itemRelatedList.Document);
        }
    });

    $scope.$on('$destroy', function (event) {
        srvNav.cancelListener($scope.handleNavUpdate);
    });


    /**
     * Init Methods
     */
    $scope.setSensePanel = function (sense) {
        $scope.sensePanel = sense;
    };


    $scope.setDocumentListFromLinkItem = function (documentList) {
        var oldDocDbid;
        if (($scope.documentIndex >= 0) && ($scope.documentIndex < $scope.documentList.length)) {
            oldDocDbid = $scope.documentList[$scope.documentIndex].id.dbid;
        }

        $scope.documentList = [];
        $scope.documentIndex = -1;
        $scope.documentObject = null;
        for (var i = 0, nb = documentList.length; i < nb; i++) {
            var doc = documentList[i];
                if (c4p.Model.isImage(doc.item.extension)) {
                    $scope.documentList.push(doc.item);
                    if (a4p.isDefined(oldDocDbid) && (oldDocDbid == doc.item.id.dbid)) {
                        $scope.documentIndex = i;
                        $scope.documentObject = doc.item;
                    }
                }
        }
        if (($scope.documentIndex == -1) && ( $scope.documentList.length > 0)) {
            $scope.documentIndex = 0;
            $scope.documentObject = $scope.documentList[0];
        }
    };


    $scope.setDocumentList = function (documentList) {

        $scope.documentList = [];
        $scope.documentIndex = -1;
        $scope.documentObject = null;
        for (var i = 0, nb = documentList.length; i < nb; i++) {
            var doc = documentList[i];

            $scope.documentList.push(doc);
        }
        if (($scope.documentIndex == -1) && ( $scope.documentList.length > 0)) {
            $scope.documentIndex = 0;
            $scope.documentObject = $scope.documentList[0];
        }

    };

    $scope.hideDocuments = function () {
        $scope.documentList = [];
        $scope.documentIndex = -1;
        $scope.documentObject = null;
    };

    $scope.showDocuments = function () {
        $scope.setDocumentListFromLinkItem(srvNav.itemRelatedList.Document);
    };

    $scope.onDocumentSwipe = function (event) {
        if ((event.side == 'left')) {
            a4p.safeApply($scope, function () {
                console.log('swipe left');
                $scope.nextDocument();
            });
        } else if (event.side == 'right') {
            a4p.safeApply($scope, function () {
                console.log('swipe right');
                $scope.prevDocument();
            });
        }
    };

    /**
     * Methods
     */
    $scope.nextDocument = function () {
        $scope.documentIndex++;
        if ($scope.documentIndex >= $scope.documentList.length) {
            $scope.documentIndex = 0;
        }
        console.log('Document index: ' + $scope.documentIndex);
        $scope.documentObject = $scope.documentList[$scope.documentIndex];
        if ($scope.sensePanel) {
            $scope.sensePanel.scroll.zoom(0, 0, 1, 300);
            $scope.sensePanel.sizeRefresh();
        }
    };

    $scope.prevDocument = function () {
        $scope.documentIndex--;
        if ($scope.documentIndex < 0) {
            $scope.documentIndex = $scope.documentList.length - 1;
        }
        console.log('Document index: ' + $scope.documentIndex);
        $scope.documentObject = $scope.documentList[$scope.documentIndex];
        if ($scope.sensePanel) {
            $scope.sensePanel.scroll.zoom(0, 0, 1, 300);
            $scope.sensePanel.sizeRefresh();
        }
    };

    $scope.isCurrentDocument = function (index) {
        return $scope.documentIndex === index;
    };

    $scope.toggleFullScreen = function () {
        $scope.isFullScreen = !$scope.isFullScreen;
    };

    $scope.showDocument = function (doc) {
        if (c4p.Model.isImage(doc.extension)) {
            $scope.documentObject = doc;
        }
        else {
            $scope.documentObject = doc;
        }
    };

    $scope.getViewerWidth = function () {
        if ($scope.isFullScreen) {
            return $scope.getResizeWidth();
        }
        else {
            if ($scope.isOnePageFormat()) {
                return ($scope.getAsideWidth());
            }
            else {
                return ($scope.getResizeWidth() - $scope.getAsideWidth()- $scope.getToolbarWidth());
            }

        }
    };

    $scope.getViewerHeight = function() {
        if ($scope.isFullScreen) {
            return $scope.getResizeHeight();
        }
        else {
            return $scope.getResizeHeight() - $scope.getResizePathValue('meeting_header', '', 'offsetHeight');
        }
    };

    $scope.getDocumentObject = function () {
        return $scope.documentObject;
    };

}
ctrlViewer.$inject = ['$scope', 'srvData', 'srvNav', 'srvLocale'];


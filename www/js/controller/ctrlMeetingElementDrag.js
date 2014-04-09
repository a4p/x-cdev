'use strict';

/**
 * Drag objects controller
 *
 * @param $scope
 */
function ctrlMeetingElementDrag($scope, $modal, srvLocale, srvData, srvNav, srvLink, srvConfig) {

    $scope.srvNav = srvNav;
    $scope.proxy = null;
	$scope.dragElementX = 32;
	$scope.dragElementY = 32;
	$scope.proxyover = false;
    $scope.meetingElem = null;
    $scope.meetingThumb = null;

    function setCursorToMove(scope, event) {
	    scope.proxy = document.createElement('img');
	    if ($scope.proxyover) {
            scope.proxy.setAttribute('src', 'img/dropPointer64.png');
	    } else {
            scope.proxy.setAttribute('src', 'img/dragPointer64.png');
	    }
        scope.proxy.setAttribute('style', 'position: fixed; top:'
                + (event.clientY - $scope.dragElementY) + 'px; left:'
                + (event.clientX - $scope.dragElementX) + 'px; transform:scale('
                + event.scale + ') rotate(' + event.rotate * 180 / Math.PI + 'deg); -ms-transform:scale('
                + event.scale + ') rotate(' + event.rotate * 180 / Math.PI + 'deg); -moz-transform:scale('
                + event.scale + ') rotate(' + event.rotate * 180 / Math.PI + 'deg); -webkit-transform:scale('
                + event.scale + ') rotate(' + event.rotate * 180 / Math.PI + 'deg); -o-transform:scale('
                + event.scale + ') rotate(' + event.rotate * 180 / Math.PI + 'deg);');
	    document.getElementsByTagName('body')[0].appendChild(scope.proxy);
	}

	function moveCursor(scope, event) {
	    if ($scope.proxyover) {
            scope.proxy.setAttribute('src', 'img/dropPointer64.png');
	    } else {
            scope.proxy.setAttribute('src', 'img/dragPointer64.png');
	    }
        scope.proxy.setAttribute('style', 'position: fixed; top:'
                + (event.clientY - $scope.dragElementY) + 'px; left:'
                + (event.clientX - $scope.dragElementX) + 'px; transform:scale('
                + event.scale + ') rotate(' + event.rotate * 180 / Math.PI + 'deg); -ms-transform:scale('
                + event.scale + ') rotate(' + event.rotate * 180 / Math.PI + 'deg); -moz-transform:scale('
                + event.scale + ') rotate(' + event.rotate * 180 / Math.PI + 'deg); -webkit-transform:scale('
                + event.scale + ') rotate(' + event.rotate * 180 / Math.PI + 'deg); -o-transform:scale('
                + event.scale + ') rotate(' + event.rotate * 180 / Math.PI + 'deg);');
	}

	function cancelMoveCursor(scope) {
	    scope.proxy.parentNode.removeChild(scope.proxy);
	    scope.proxy = null;
	}

    /**
     *
     * @param meetingElem Plan object
     */
    $scope.initMeetingElemDrag = function (meetingElem) {
        $scope.meetingElem = meetingElem;
        $scope.meetingThumb = null;
        if (a4p.isDefinedAndNotNull(meetingElem)) {
            var plannees = srvData.getTypedDirectLinks(meetingElem, 'plannee', 'Plannee');
            for (j = 0; j < plannees.length; j++) {
                var obj = srvData.getObject(plannees[0].object_id.dbid);
                if (a4p.isDefinedAndNotNull(obj)) {
                    var thumb = obj.thumb_url;
                    if (a4p.isDefinedAndNotNull(thumb)) {
                        $scope.meetingThumb = thumb;
                        break;
                    }
                }
            }
        }
    };

	$scope.dragOverEnter = function (event) {
	    $scope.proxyover = true;
	};
	$scope.dragOverLeave = function (event) {
	    $scope.proxyover = false;
	};
	$scope.dragStart = function (event, index) {
	    //$scope.dragElementX = event.elementX;
	    //$scope.dragElementY = event.elementY;
        // IMPORTANT : USER MUST SET event.dataTransfer UPON sense-dragstart EVENT
        $scope.setDragMeetingElementIdx(index);
        event.dataTransfer = $scope.meetingElem;
        a4p.safeApply($scope, function() {
            if (!$scope.proxy) setCursorToMove($scope, event);
        });
	};
	$scope.dragMove = function (event) {
	    if ($scope.proxy) moveCursor($scope, event);
	};

	$scope.dragEnd = function (event) {
        if ($scope.proxy) {
            a4p.safeApply($scope, function() {
                cancelMoveCursor($scope);
            });
        }
	};

	$scope.dragCancel = function (event) {
        if ($scope.proxy) {
            a4p.safeApply($scope, function() {
                cancelMoveCursor($scope);
            });
        }
	};

}
ctrlMeetingElementDrag.$inject = ['$scope', '$modal', 'srvLocale', 'srvData', 'srvNav', 'srvLink', 'srvConfig'];




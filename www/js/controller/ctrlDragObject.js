'use strict';

/**
 * Drag objects controller
 *
 * @param $scope
 */
function ctrlDragObject($scope, $dialog, srvLocale, srvData, srvNav, srvLink, srvConfig) {

    $scope.promiseDialog = function (dialogOptions) {
        return $dialog.dialog(dialogOptions).open();
    };

    $scope.openDialog = function (dialogOptions, onSuccess) {
        a4p.safeApply($scope, function() {
            $dialog.dialog(dialogOptions).open().then(onSuccess);
        });
    };

    $scope.srvNav = srvNav;

    $scope.proxy = null;
	$scope.dragElementX = 32;
	$scope.dragElementY = 32;
	$scope.proxyover = false;

    $scope.closeAsidePage = false;
    $scope.companyName = '';

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

    $scope.init = function (item, closeAsidePage) {
        $scope.item = item;
        $scope.itemIcon = c4p.Model.getItemIcon(item);
        $scope.itemName = srvConfig.getItemName(item);

        $scope.closeAsidePage = closeAsidePage || false;

        // Company name
        $scope.companyName = '';
        if ($scope.item && $scope.item.account_id) {
            var account = srvData.getObject($scope.item.account_id.dbid);
            if (account) {
                $scope.companyName = account.company_name;
            }
        }
   	};

    $scope.selectItem = function (firstSingleTap) {
        if (firstSingleTap) {
            a4p.safeApply($scope, function () {
                // To let Angular update singleTap status (chevron-right)
            });
            return;
        }
        a4p.InternalLog.log('ctrlDragObject - selectItem');
        if ($scope.isOnePageFormat()) {
            $scope.selectItemAndCloseAside();
        }
        else {
            a4p.safeApply($scope, function() {
                $scope.setItemAndGoDetail($scope.item);
                if ($scope.closeAsidePage && $scope.setNavAside) {
                    $scope.setNavAside(false);
                } else if ($scope.updateScroller) $scope.updateScroller();
            });
        }
    };
    $scope.selectItemAndCloseAside = function () {
        a4p.safeApply($scope, function() {
            $scope.setItemAndGoDetail($scope.item);
            $scope.setNavAside(false);
        });
    };
    $scope.holdStart = function (event) {
        if (!$scope.proxy) {
            a4p.safeApply($scope, function() {
                srvNav.holdStartItem($scope.item);
            });
        }
    };

    $scope.holdStop = function () {
        srvNav.holdStopItem();
   	};

	$scope.dragOverEnter = function (event) {
	    $scope.proxyover = true;
	};
	$scope.dragOverLeave = function (event) {
	    $scope.proxyover = false;
	};
	$scope.dragStart = function (event) {
	    //$scope.dragElementX = event.elementX;
	    //$scope.dragElementY = event.elementY;
        // IMPORTANT : USER MUST SET event.dataTransfer UPON sense-drag-start EVENT
        event.dataTransfer = $scope.item;
        a4p.safeApply($scope, function() {
            $scope.holdStop();
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
ctrlDragObject.$inject = ['$scope', '$dialog', 'srvLocale', 'srvData', 'srvNav', 'srvLink', 'srvConfig'];




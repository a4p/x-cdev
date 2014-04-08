'use strict';

/**
 * Drag objects controller
 *
 * @param $scope
 */
function ctrlDragObject($scope, $modal, srvLocale, srvData, srvNav, srvLink, srvConfig) {

    $scope.srvNav = srvNav;

    $scope.proxy = null;
	$scope.dragElementX = 70;//32;
	$scope.dragElementY = 60;//32;
	$scope.proxyover = false;

    $scope.closeAsidePage = false;
    $scope.companyName = '';

	function setCursorToMove(scope, event, element) {

        /*
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
        */

        scope.proxy = document.createElement('div');
        if ($scope.proxyover) {
            scope.proxy.setAttribute('class', 'popover top in c4p-popover-drop');
        } else {
            scope.proxy.setAttribute('class', 'popover top in c4p-popover-drag');
        }

        scope.proxy.setAttribute('style', 'display: block; top:'
                + (event.clientY - $scope.dragElementY) + 'px; left:'
                + (event.clientX - $scope.dragElementX) + 'px; ');


        var popArrow = document.createElement('div');
        popArrow.setAttribute('class','arrow');
        var popContent = document.createElement('div')
        popContent.setAttribute('class','popover-content');

        if (!element || typeof element == 'undefined' || !element[0].children[0]) {

            //var popArrow = document.createElement('div').setAttribute('class','arrow');
            // <h3 class="popover-title" style="display: none;"></h3>
            //var popContent = document.createElement('div').setAttribute('class','popover-content');
            //scope.proxy.innerHTML = "<div class='arrow'></div>";
            //scope.proxy.innerHTML += "<h3 class='popover-title'>"+ $scope.itemName +"</h3>";
            popContent.innerHTML += "<div class='popover-content'>";
            popContent.innerHTML += "<c4p-thumb width='30' height='30' ";
            popContent.innerHTML += "  text='"+$scope.itemName+"' indic=2 ";
            popContent.innerHTML += "    icon='glyphicon-"+$scope.itemIcon+" color='red' ";
            popContent.innerHTML += "    url='"+$scope.item.thumb_url+"'> ";
            popContent.innerHTML += "</c4p-thumb>";
            popContent.innerHTML += "</div>";
        
        }
        else {
            var el = element[0].children[0].cloneNode(true);

            //copy canvas
            var canvasOld = element[0].getElementsByTagName('canvas')[0];
            if (canvasOld) {
                var newCanvas = el.getElementsByTagName('canvas')[0];
                var context = newCanvas.getContext('2d');
                context.drawImage(canvasOld, 0, 0);
            }

            popContent.appendChild(el);
        }

        scope.proxy.appendChild(popArrow);
        scope.proxy.appendChild(popContent);

        document.getElementsByTagName('body')[0].appendChild(scope.proxy);

        /*
        <button popover-placement="top" popover="On the Top!" class="btn btn-default">Top</button>


        <div class="popover top in" style="display: block; top: 180; left: 278px;">
            <div class="arrow"></div>
            <h3 class="popover-title" style="display: none;"></h3>
            <div class="popover-content">Vivamus sagittis lacus vel augue laoreet rutrum faucibus.</div>
        </div> */
	}

	function moveCursor(scope, event) {
        /*
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
*/
        scope.proxy.setAttribute('style', 'display: block; top:'
                + (event.clientY - $scope.dragElementY) + 'px; left:'
                + (event.clientX - $scope.dragElementX) + 'px; ');
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
            $scope.setItemAndGoDetail($scope.item, true);
            //$scope.setNavAside(false);
        });
    };
    $scope.holdStart = function (event,element) {
        if (!$scope.proxy) {
            a4p.safeApply($scope, function() {
                srvNav.holdStartItem($scope.item);
                setCursorToMove($scope, event, element);
            });
        }
    };

    $scope.holdStop = function () {
        srvNav.holdStopItem();
        $scope.dragEnd();
   	};

	$scope.dragOverEnter = function (event) {
	    $scope.proxyover = true;
	};
	$scope.dragOverLeave = function (event) {
	    $scope.proxyover = false;
	};
	$scope.dragStart = function (event,element) {
	    //$scope.dragElementX = event.elementX;
	    //$scope.dragElementY = event.elementY;
        // IMPORTANT : USER MUST SET event.dataTransfer UPON sense-dragstart EVENT
        event.dataTransfer = $scope.item;
        a4p.safeApply($scope, function() {
            $scope.holdStop();
            if (!$scope.proxy) setCursorToMove($scope, event, element);
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
ctrlDragObject.$inject = ['$scope', '$modal', 'srvLocale', 'srvData', 'srvNav', 'srvLink', 'srvConfig'];




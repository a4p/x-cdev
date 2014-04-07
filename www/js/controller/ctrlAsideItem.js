'use strict';

/**
 * Aside objects controller
 *
 * @param $scope
 */
function ctrlAsideItem($scope, srvLocale, srvData, srvNav, srvLink, srvConfig) {

    $scope.srvNav = srvNav;

    $scope.proxy = null;
	$scope.dragElementX = 70;//32;
	$scope.dragElementY = 60;//32;
	$scope.proxyover = false;

    $scope.closeAsidePage = false;
    $scope.companyName = '';

	
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
}
ctrlAsideItem.$inject = ['$scope', 'srvLocale', 'srvData', 'srvNav', 'srvLink', 'srvConfig'];




'use strict';

/**
 * Aside pane controller
 *
 * @param $scope
 * @param srvFacet
 * @param srvLocale
 * @param srvData
 * @param srvAnalytics
 * @param srvNav
 * @param version
 */
function ctrlAside($scope, srvFacet, srvLocale, srvData, srvAnalytics, srvNav, version) {

	/**
	 * Constants
	 */

    $scope.srvFacet = srvFacet;
    $scope.srvLocale = srvLocale;
    $scope.srvNav = srvNav;

    $scope.rootMenuUp = true; // ((inputs.itemSearchQuery.length == 0) && (srvFacet.filterFacets.length == 0));
    $scope.activeSearch = false;
    $scope.showGroupSuggestion = true; // show aside suggestions

    // Filter
    $scope.inputs = {
        itemSearchQuery : ''
    };

    /**
     * Methods
     */

    $scope.toggleSearch = function () {
        $scope.activeSearch = !$scope.activeSearch;
    };

    $scope.tabClear = function () {
        var firstFacet = srvFacet.getFirstFacet();
        if ((firstFacet != null) && (firstFacet.key != 'top20') && (firstFacet.key != 'mine') && (firstFacet.key != 'favorites')) {
            // Keep First Facet if not Top20/Mine/Favorites
            while (srvFacet.filterFacets.length > 1) {
                srvFacet.removeLastFacet();
            }
        } else {
            srvFacet.clear();
        }
        $scope.removeGlobalSearch();
        $scope.activeSearch = false;
    };
    $scope.tabTop = function () {
        if (!srvFacet.isFacetActivable('top20')) {
            var firstFacet = srvFacet.getFirstFacet();
            if ((firstFacet != null) && (firstFacet.key != 'top20') && (firstFacet.key != 'mine') && (firstFacet.key != 'favorites')) {
                // Keep First Facet if not Top20/Mine/Favorites
                while (srvFacet.filterFacets.length > 1) {
                    srvFacet.removeLastFacet();
                }
            } else {
                srvFacet.clear();
            }
            srvFacet.addFacet('top20');
        } else {
            srvFacet.addFacet('top20');
            srvFacet.setFacet('');
        }
        $scope.activeSearch = false;
    };
    $scope.tabMine = function () {
        if (!srvFacet.isFacetActivable('mine')) {
            var firstFacet = srvFacet.getFirstFacet();
            if ((firstFacet != null) && (firstFacet.key != 'top20') && (firstFacet.key != 'mine') && (firstFacet.key != 'favorites')) {
                // Keep First Facet if not Top20/Mine/Favorites
                while (srvFacet.filterFacets.length > 1) {
                    srvFacet.removeLastFacet();
                }
            } else {
                srvFacet.clear();
            }
            srvFacet.addFacet('mine');
        } else {
            srvFacet.addFacet('mine');
            srvFacet.setFacet('');
        }
        $scope.activeSearch = false;
    };
    $scope.tabFavorites = function () {
        if (!srvFacet.isFacetActivable('favorites')) {
            var firstFacet = srvFacet.getFirstFacet();
            if ((firstFacet != null) && (firstFacet.key != 'top20') && (firstFacet.key != 'mine') && (firstFacet.key != 'favorites')) {
                // Keep First Facet if not Top20/Mine/Favorites
                while (srvFacet.filterFacets.length > 1) {
                    srvFacet.removeLastFacet();
                }
            } else {
                srvFacet.clear();
            }
            srvFacet.addFacet('favorites');
        } else {
            srvFacet.addFacet('favorites');
            srvFacet.setFacet('');
        }
        $scope.activeSearch = false;
    };
    $scope.addClear = function () {
        var name = srvFacet.getFirstFacetValue();
        srvFacet.clear();
        srvFacet.addFacet('objects', srvLocale.translations.htmlTitleType[name], name);
    };
    $scope.addTop = function () {
        srvFacet.addFacet('top20');
        srvFacet.setFacet('');
    };
    $scope.addMine = function () {
        srvFacet.addFacet('mine');
        srvFacet.setFacet('');
    };
    $scope.addFavorites = function () {
        srvFacet.addFacet('favorites');
        srvFacet.setFacet('');
    };

    $scope.selectItem = function (item) {
        a4p.InternalLog.log('ctrlAside - selectItem');
        var closeAside = false;
        if ($scope.closeAsidePage && $scope.setNavAside) {
            closeAside = true;

        $scope.setItemAndGoDetail(item,closeAside);
        
        } else if ($scope.updateScroller) $scope.updateScroller();
    };

    $scope.selectItemAndCloseAside = function (item) {
        $scope.setItemAndGoDetail(item,true);
        //$scope.setNavAside(false);
    };

    $scope.removeGlobalSearch = function () {
        $scope.inputs.itemSearchQuery = '';
        srvFacet.setFilterQuery($scope.inputs.itemSearchQuery);
    };

    $scope.objectCreatable = function(type){
        if(type == 'Note') {
            return a4p.isDefinedAndNotNull(srvData.userObject);
        }
        else if(type == 'Report') {
            return a4p.isDefinedAndNotNull(srvData.userObject);
        }
        else if(type == 'Document') {
            return a4p.isDefinedAndNotNull(srvData.userObject);
        }
        else {
            return (c4p.Model.a4p_types[type] && c4p.Model.a4p_types[type].isAutonomousType);
        }
    };

    $scope.addItemDialog = function(type){
        a4p.safeApply($scope, function() {
            if(type == 'Document') {
                $scope.takePicture(srvData.userObject).then(function (document) {
                    $scope.selectItemAndCloseAside(document);
                }, function (diag) {
                });
            }
            else if (type == 'Note') {
                $scope.takeNote(srvData.userObject).then(function (document) {
                    $scope.selectItemAndCloseAside(document);
                }, function (diag) {
                });
            }
            else if (type == 'Report') {
                $scope.takeReport(srvData.userObject).then(function (document) {
                    $scope.selectItemAndCloseAside(document);
                }, function (diag) {
                });
            }
            else {
                // Default object attrs
                var itemToCreate = $scope.srvData.createObject(type, {});
                $scope.editObjectDialog(itemToCreate,
                    function (result) {
                        if (a4p.isDefined(result)) {
                            a4p.safeApply($scope, function() {
                                $scope.srvData.addObject(result);
                                if(type == 'Note') {
                                    var parentObject = srvData.userObject;
                                    srvData.linkToItem(type, 'parent', [result], parentObject);
                                }
                                else if(type == 'Report') {
                                    var parentObject = srvData.userObject;
                                    srvData.linkToItem(type, 'parent', [result], parentObject);
                                }
                                $scope.srvData.addObjectToSave(result.a4p_type, result.id.dbid);
                                $scope.selectItemAndCloseAside(result);

                                //GA: user really interact with aside, he adds one object
                                srvAnalytics.add('Once', 'Aside - add ' + result.a4p_type);
                            });
                        }
                    }
                );
            }
        });
    };

    $scope.setShowGroupSuggestion = function(b){

        $scope.showGroupSuggestion = b;
    }


    /**
     * item for root menu
     */
    $scope.activeItem='';
    $scope.setSearchMenu= function (name) {

        a4p.safeApply($scope,function(){
            $scope.inputs = {
                itemSearchQuery : ''
            };
            $scope.rootMenuUp = false;
            $scope.setNavAside(true);
            srvFacet.clear();
            srvFacet.addFacet('objects', srvLocale.translations.htmlTitleType[name], name);
            $scope.activeItem=$scope.slideNavigationType[name];
        }, $scope.startSpinner, $scope.stopSpinner);
    }

    $scope.setCalendar = function () {
        $scope.rootMenuUp = true;
        $scope.gotoSlideWithSearchReset($scope.pageNavigation, $scope.slideNavigationCalendar);
        $scope.activeItem = $scope.slideNavigationCalendar;
    }

    $scope.setFavoriteSearchMenu = function () {
        $scope.rootMenuUp = false;
        $scope.setNavAside(true);
        srvFacet.clear();
        $scope.tabFavorites();
        $scope.activeItem = $scope.slideNavigationFavorite;
    }

    $scope.setRootMenu = function () {
        $scope.rootMenuUp = true;
        $scope.setNavAside(true);
        srvFacet.clear();
    }



}
ctrlAside.$inject = ['$scope', 'srvFacet', 'srvLocale', 'srvData', 'srvAnalytics', 'srvNav', 'version'];


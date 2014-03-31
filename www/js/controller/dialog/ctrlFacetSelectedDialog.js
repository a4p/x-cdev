'use strict';

/**
 *
 * @param $scope
 * @param $modal
 * @param {Object} srvData Data service
 * @param {Object} srvFacet Facet service
 * @param {Object} srvLocale Locale service
 * @param {string} type Type of objects to select/add (ex: 'Document', 'Contact', etc.)
 * @param {Function|null} initFilter Initial filter function on objects.
 *        By default all objects from rootItems are taken in list.
 *        This function take the object in argument and returns true to keep object in list or false to reject it.
 * @param {Function|null} initSelector Initial selecter function on objects.
 *        By default all objects are deselected.
 *        This function take the object in argument and returns true to select it or false to deselect it.
 * @param {boolean} multiple Can we select many objects or only one ?
 * @param {Array} addedOrganizers Array of contextual facets to add (each facet has following attributes : key, name, organizer)
 * @param {Function|null} createFct Function to call if user wants to create a new object of this type. This function must return a promise which gives the new object in resolve arguments.
 * @param {Object} dialog Dialog service (from ui-bootstrap)
 */
function ctrlFacetSelectedDialog($scope, $modalInstance, srvData, srvFacet, srvLocale, srvConfig,
                                 type, initFilter, initSelector, multiple, addedOrganizers,
                                 createFct) {

    $scope.srvLocale = srvLocale;
    $scope.type = type;
    $scope.typeColor = c4p.Model.getTypeColor(type);

    /**
     * Variables
     */

    /**
     * List of predefined facets accessible to the User
     * @type {Array}
     */
    $scope.definedFacetKeyes = [];

    /**
     * Map of predefined facets
     * @type {{}}
     */
    $scope.definedOrganizers = {};

    $scope.createPredefinedObjectEnabled = (createFct && type && (type != 'Document') && (!isValueInList(c4p.Model.attachTypes, type)));

    /**
     * Alphabetical ordering of facet keyes and objects
     * @type {boolean}
     */
    $scope.ascendingOrder = true;

    /**
     * Case sensitiveness of filterQuery
     * @type {boolean}
     */
    $scope.caseSensitive = false;

    /**
     * Word space separated list for filtering objects
     * @type {string}
     */
    $scope.filterQuery = '';

    /**
     * Stack of filtering facets (applied in order on parentItems)
     * @type {Array}
     */
    $scope.filterFacets = [];

    /**
     * Top facet applied to categorize final objects list
     * @type {string}
     */
    $scope.lastFacetKey = '';

    /**
     * Root object list
     * @type {Array}
     */
    $scope.rootItems = [];

    /**
     * Result object list after applying filterQuery, case sensitivity and ordering
     * @type {Array}
     */
    $scope.queryItems = [];

    /**
     * Final objects list.
     * items.keyes  : list of map keyes used in items.lists
     * items.lists : map of lists of objects keyed by top facet values
     * items.others : list of objects not put in any items.lists
     * @type {{keyes: Array, lists: {}, others: Array}}
     */
    $scope.items = {keyes:[], lists:{}, others:[]};

    /**
     *
     * Methods
     */

    /**
     * Create an object as specified in createFct parameter, supposedly of type type parameter.
     * We select automatically this new object and update items.
     */
    $scope.createPredefinedObject = function () {
        if (!$scope.createPredefinedObjectEnabled) return;
        a4p.safeApply($scope, function() {
            createFct().then(function(newObject) {
                // complete object creation and insert it into data service
                if (a4p.isDefined(newObject)) {
                    a4p.safeApply($scope, function() {
                        srvData.addAndSaveObject(newObject);
                        if (!multiple) {
                            // deselect all others
                            for (var i = 0, nb = $scope.rootItems.length; i < nb; i++) {
                                $scope.rootItems[i].selected = false;
                                $scope.rootItems[i].scrollTo = false;
                            }
                        }
                        $scope.rootItems.push({
                            object : newObject,
                            selected : true,
                            scrollTo: true //ScrollTo this element
                        });
                        $scope.updateItems(0);
                    });
                }
            }, function() {
                // no treatment if object creation cancelled
            });
        });
    };

    $scope.getTypeColor = function() {
        return c4p.Model.getTypeColor($scope.type);
    };

    $scope.getObjectIcon = function (object) {
        return c4p.Model.getItemIcon(object);
    };

    $scope.getObjectName = function (object) {
        return srvConfig.getItemName(object);
    };

    /**
     * Validate the dialog => close the modal and return the list of selected objects still here after filterFacets
     * If multiple is false, then only the FIRST object is returned in the array.
     */
    $scope.validateDialog = function () {
        var result = [];
        var parentItems = ($scope.filterFacets.length <= 0) ? $scope.queryItems : $scope.filterFacets[$scope.filterFacets.length - 1].items;
        for (var i = 0, nb = parentItems.length; i < nb; i++) {
            if (parentItems[i].selected) {
                result.push(parentItems[i].object);
                if (!multiple) break;
            }
        }
        $modalInstance.close(result);
    };

    /**
     * Cancel the dialog => close the modal and return nothing
     */
    $scope.closeDialog = function () {
        $modalInstance.dismiss();
    };

    /**
     * Configuration of the controller by adding a new possible Organizer Facet
     *
     * @param organizer
     */
    $scope.addPossibleOrganizerFacet = function(organizer) {
        if (a4p.isUndefined($scope.definedOrganizers[organizer.key])) {
            $scope.definedFacetKeyes.push(organizer.key);
        }
        $scope.definedOrganizers[organizer.key] = organizer;
        if ($scope.lastFacetKey == '') $scope.setFacet(organizer.key);
    };

    /**
     * User choose to change the active facet => change categories
     *
     * @param facetKey
     */
    $scope.setFacet = function(facetKey) {
        var updateFromLevel = -1;
        if ($scope.lastFacetKey == '') {
            $scope.lastFacetKey = facetKey;
            updateFromLevel = -1;
            //$scope.updateItems();
        } else {
            $scope.lastFacetKey = facetKey;
            updateFromLevel = $scope.filterFacets.length;
            //$scope.updateFinalItems();
        }
        /*
        if ($scope.items.keyes.length == 0) {
            // If no sub-categories, add automatically the facet (usefull for registering top20 for example)
            $scope.filterFacets.push({key: facetKey, title: '', value: undefined, items: $scope.items.others});
            // Remove useless facets
            for (var facetIdx = $scope.filterFacets.length-1; facetIdx >= 0; facetIdx--) {
                var filterFacet = $scope.filterFacets[facetIdx];
                var organizer = $scope.definedOrganizers[filterFacet.key];
                if (a4p.isDefined(organizer.keepValue)) {
                    if (!organizer.keepValue(filterFacet.title, filterFacet.value, $scope.filterFacets.slice(0, facetIdx))) {
                        $scope.filterFacets.splice(facetIdx, 1);
                        if (facetIdx <= updateFromLevel) updateFromLevel = (facetIdx - 1);
                    }
                }
            }
        }
        */
        // Reject active facet if needed
        if (!$scope.isFacetActivable(facetKey)) {
            // Return to the first defined Facet
            $scope.lastFacetKey = $scope.definedFacetKeyes[0];
        }
        $scope.updateItems(updateFromLevel);
    };

    /**
     * User select a value for the active facet => add this pair (facet:value) in filterFacets and reset active facet.
     * In doing this we NEVER select others objects, since they are at root level and in no sub category.
     *
     * @param facetKey
     * @param title
     * @param value
     */
    $scope.addFacet = function(facetKey, title, value) {
        var updateFromLevel = -1;
        if ($scope.lastFacetKey != facetKey) {
            if ($scope.lastFacetKey == '') {
                $scope.lastFacetKey = facetKey;
                updateFromLevel = -1;
                //$scope.updateItems();
            } else {
                $scope.lastFacetKey = facetKey;
                updateFromLevel = $scope.filterFacets.length;
                //$scope.updateFinalItems();
            }
        }
        if (a4p.isDefined(value)) {
            $scope.filterFacets.push({key:facetKey, title:title, value:value, items:$scope.items.lists[value]});
        } else {
            $scope.filterFacets.push({key:facetKey, title:title, value:value, items:$scope.items.others});
        }
        // Remove useless facets
        for (var facetIdx = $scope.filterFacets.length-1; facetIdx >= 0; facetIdx--) {
            var filterFacet = $scope.filterFacets[facetIdx];
            var organizer = $scope.definedOrganizers[filterFacet.key];
            if (a4p.isDefined(organizer) && a4p.isDefined(organizer.keepValue)) {
                if (!organizer.keepValue(filterFacet.title, filterFacet.value, $scope.filterFacets.slice(0, facetIdx))) {
                    $scope.filterFacets.splice(facetIdx, 1);
                    if (facetIdx <= updateFromLevel) updateFromLevel = (facetIdx - 1);
                }
            }
        }
        // Reject active facet if needed
        if (!$scope.isFacetActivable(facetKey)) {
            // Return to the first defined Facet
            $scope.lastFacetKey = $scope.definedFacetKeyes[0];
        }
        $scope.updateItems(updateFromLevel);
    };

    $scope.removeFacet = function(facetIdx) {
        var updateFromLevel = facetIdx - 1;
        $scope.filterFacets.splice(facetIdx, 1);
        // Remove useless facets
        for (var i = $scope.filterFacets.length-1; i >= 0; i--) {
            var filterFacet = $scope.filterFacets[i];
            var organizer = $scope.definedOrganizers[filterFacet.key];
            if (a4p.isDefined(organizer) && a4p.isDefined(organizer.keepValue)) {
                if (!organizer.keepValue(filterFacet.title, filterFacet.value, $scope.filterFacets.slice(0, i))) {
                    $scope.filterFacets.splice(i, 1);
                    if (i <= updateFromLevel) updateFromLevel = (i - 1);
                }
            }
        }
        // Reject active facet if needed
        this.lastFacetKey = this.getLastFacetKey();
        if ((this.lastFacetKey == '') || !$scope.isFacetActivable($scope.lastFacetKey)) {
            // Return to the first defined Facet
            $scope.lastFacetKey = $scope.definedFacetKeyes[0];
        }
        $scope.updateItems(updateFromLevel);
    };

    $scope.removeLastFacet = function () {
        if ($scope.filterFacets.length > 0) {
            $scope.removeFacet($scope.filterFacets.length - 1);
        }
    };

    $scope.getFacet = function (facetIdx) {
        return $scope.filterFacets[facetIdx];
    };

    $scope.getLastFacet = function () {
        if ($scope.filterFacets.length > 0) {
            return $scope.getFacet($scope.filterFacets.length - 1);
        } else {
            return null;
        }
    };

    $scope.isFacetActivable = function (facetKey) {
        var organizer = $scope.definedOrganizers[facetKey];
        if (a4p.isDefined(organizer) && a4p.isDefined(organizer.keepActive)) {
            return organizer.keepActive($scope.filterFacets);
        }
        return false;
    };

    $scope.isFacetAnObjectType = function (value) {
        return c4p.Model.allTypes.indexOf(value) >= 0;
    };

    $scope.isLastFacetAnObjectType = function () {
        if ($scope.filterFacets.length > 0) {
            return c4p.Model.allTypes.indexOf($scope.getLastFacet().value) >= 0;
        } else {
            return false;
        }
    };

    $scope.toggleOrder = function() {
        $scope.ascendingOrder = !$scope.ascendingOrder;
        $scope.updateItems(0);
    };

    $scope.toggleCaseSensitive = function() {
        $scope.caseSensitive = !$scope.caseSensitive;
        $scope.updateItems(0);
    };

    $scope.setFilterQuery = function(filterQuery) {
        $scope.filterQuery = filterQuery;
        $scope.updateItems(0);
    };

    $scope.clear = function() {
        $scope.ascendingOrder = true;
        $scope.caseSensitive = false;
        $scope.filterQuery = '';
        $scope.filterFacets = [];
        $scope.lastFacetKey = '';
        //$scope.rootItems = [];// We clear rootItems only on srvData update, not on User clear
        $scope.queryItems = [];
        $scope.items = {keyes: [], lists: {}, others: []};
        if ($scope.definedFacetKeyes.length) {
            $scope.lastFacetKey = $scope.definedFacetKeyes[0];
            $scope.updateItems(0);// do not update rootItems
        }
    };

    /**
     * Calculate root objects list : Objects from srvData ordered and filtered by filterQuery.
     * Then apply filter facets on parent objects list (starting from root objects list).
     * Then apply active facet on parent objects list to categorize objects and split them into sublists.
     *
     * @param from Level from which we must re-calculate items lists (-1=rootItems, 0=firstFilterFacet, etc.)
     */
    $scope.updateItems = function(from) {
        if ($scope.lastFacetKey == '') return;
        if (a4p.isUndefined(from)) from = -1;
        if (from < 0) $scope.updateRootItems();
        if (from <= 0) {
            $scope.queryItems = srvFacet.queryFilter($scope.rootItems, $scope.filterQuery, $scope.caseSensitive);
            srvFacet.sortItems($scope.queryItems, $scope.ascendingOrder, $scope.caseSensitive);
        }
        $scope.applyFilterFacets(from);
        $scope.updateFinalItems();
    };

    /**
     * Calculated root objects list : Objects from srvData ordered and filtered by filterQuery
     */
    $scope.updateRootItems = function() {
        $scope.rootItems = [];
        // Specific configuration from parameters
        if (type) {
            for (var i = 0, nb = srvData.currentItems[type].length; i < nb; i++) {
                var object = srvData.currentItems[type][i];
                if (initFilter && !initFilter(object)) continue;
                $scope.rootItems.push({
                    object : object,
                    selected : (initSelector && initSelector(object))
                });
            }
        } else {
            for (var typeIdx = 0; typeIdx < c4p.Model.objectTypes.length; typeIdx++) {
                var objectType = c4p.Model.objectTypes[typeIdx];
                for (var i = 0, nb = srvData.currentItems[objectType].length; i < nb; i++) {
                    var object = srvData.currentItems[objectType][i];
                    if (initFilter && !initFilter(object)) continue;
                    $scope.rootItems.push({
                        object : object,
                        selected : (initSelector && initSelector(object))
                    });
                }
            }
            // TODO : accept to show Attendees/Attachees in the future
            /*
            for (var typeIdx = 0; typeIdx < c4p.Model.attachTypes.length; typeIdx++) {
                var objectType = c4p.Model.attachTypes[typeIdx];
                for (var i = 0, nb = srvData.currentItems[objectType].length; i < nb; i++) {
                    var object = srvData.currentItems[objectType][i];
                    if (initFilter && !initFilter(object)) continue;
                    $scope.rootItems.push({
                        object : object,
                        selected : (initSelector && initSelector(object))
                    });
                }
            }
            */
        }
    };

    /**
     * Apply filter facets on parent objects list (starting from root objects list)
     * @param from Level from which we must re-calculate items lists (0=firstFilterFacet, etc.)
     */
    $scope.applyFilterFacets = function(from) {
        if (a4p.isUndefined(from)) from = 0;
        if (from < 0) from = 0;
        if (from < $scope.filterFacets.length) {
            var parentItems = (from <= 0) ? $scope.queryItems : $scope.filterFacets[from-1].items;
            for (var facetIdx=from; facetIdx < $scope.filterFacets.length; facetIdx++) {
                srvFacet.applyFilterFacet($scope.definedOrganizers, parentItems, $scope.filterFacets.slice(0, facetIdx), $scope.filterFacets[facetIdx]);
                parentItems = $scope.filterFacets[facetIdx].items;
            }
        }
    };

    /**
     * Apply active facet on parent objects list
     */
    $scope.updateFinalItems = function() {
        var parentItems = ($scope.filterFacets.length <= 0) ? $scope.queryItems : $scope.filterFacets[$scope.filterFacets.length - 1].items;
        $scope.items = srvFacet.applyFacet($scope.definedOrganizers, parentItems, $scope.filterFacets, $scope.lastFacetKey);
        srvFacet.sortKeyes($scope.items.keyes, $scope.ascendingOrder, $scope.caseSensitive);
    };

    /**
     * Events broadcasted
     */

    $scope.$on('mindMapUpdated', function () {
        $scope.updateItems();
    });

    $scope.$on('mindMapLoaded', function () {
        $scope.updateItems();
    });

    /**
     * Initialization
     */

    // Initialize definedFacetKeyes and definedOrganizers
    for (var i = 0, nb = srvFacet.definedFacetKeyes.length; i < nb; i++) {
        var facetKey = srvFacet.definedFacetKeyes[i];
        $scope.addPossibleOrganizerFacet(srvFacet.definedOrganizers[facetKey]);
    }
    if (a4p.isDefined(addedOrganizers)) {
        for (var i = 0, nb = addedOrganizers.length; i < nb; i++) {
            $scope.addPossibleOrganizerFacet(addedOrganizers[i]);
        }
    }
    if (isValueInList(c4p.Model.objectTypes, type)) {
        $scope.addFacet('objects', srvLocale.translations.htmlTitleType[type], type);
    }
}

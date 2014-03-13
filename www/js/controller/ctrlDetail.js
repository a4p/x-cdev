'use strict';

/**
 * Detail N view controller
 *
 * @param $scope
 * @param $dialog
 * @param version
 * @param srvData
 * @param srvFacet
 * @param srvLocale
 * @param srvLink
 * @param srvNav
 * @param srvConfig
 */
function ctrlDetail($scope, $dialog, version, srvData, srvFacet, srvLocale, srvLink, srvNav, srvConfig) {

    /**
     * Helpers
     */

    function createSameCompanyFilter(companyId) {
        return function (object) {
            return object.account_id.dbid == companyId;
        }
    }

    function createSameManagerFilter(managerId) {
        return function (object) {
            return object.manager_id.dbid == managerId;
        }
    }

    function createNotItselfFilter(itemId) {
        return function (object) {
            return object.id.dbid != itemId;
        }
    }


	/**
	 * Variables
	 */

	$scope.itemDetailDBId = undefined;
    //$scope.itemDetailName = '';

	//$scope.lastItemId = 0; // needed for update status

	// Audit fields
    $scope.auditCreator = '';
	$scope.auditCreatedDate = '';
    $scope.auditModifier = '';
	$scope.auditModifiedDate = '';

    // config
    $scope.configStateEdit 	= true;
    $scope.configStateAdd 	= true;
    //$scope.isEditMode = false;
    $scope.linkStateAdd = false;

    /*
     *
     */
    /*$scope.setEditMode = function(value) {
        $scope.isEditMode = value;
    };*/


    $scope.dataListener = srvData.addListenerOnUpdate(function (callbackId, action, type, id) {
        if ((srvNav.item) && (action == 'clear')) {
            a4p.safeApply($scope, function() {
                $scope.clear();
            });
        }
    });

    $scope.navListener = srvNav.addListenerOnUpdate(function (callbackId, action, page, slide, id) {
        if (action == 'clear') {
            a4p.safeApply($scope, function() {
                $scope.clear();
            });
        } else if (action == 'goto') {
            if (srvNav.item) {
                a4p.safeApply($scope, function() {
                    $scope._initDetail();
                });
            } else {
                a4p.safeApply($scope, function() {
                    $scope.clear();
                });
            }
        }
    });

    $scope.$on('$destroy', function (event) {
        srvNav.cancelListener($scope.navListener);
        srvData.cancelListener($scope.dataListener);
    });

	/**
	 * Methods
	 */

    $scope.clear = function () {
        $scope.itemDetailDBId = undefined;
        //$scope.itemDetailName = '';
        //$scope.lastItemId = 0; // needed for update status
        // Audit fields
        $scope.auditCreator = '';
        $scope.auditCreatedDate = '';
        $scope.auditModifier = '';
        $scope.auditModifiedDate = '';
        // config
        $scope.configStateEdit = true;
        $scope.configStateAdd = true;
        $scope.linkStateAdd = false;
    };

    $scope.objectTypes = function () {
        return c4p.Model.objectTypes
    };
    $scope.objectTypeIcon = function (objectType) {
        return c4p.Model.getTypeIcon(objectType);
    };

    $scope.objectTypeColor = function (objectType) {
        return c4p.Model.getTypeColor(objectType);
    };

    $scope.toggleLinkStateAdd = function () {
        $scope.linkStateAdd = !$scope.linkStateAdd;
    };

    $scope.getPossibleLinkActionList = function (fromType, toType) {
        if (a4p.isDefined(c4p.Model.linkActionMap[fromType])
            && a4p.isDefined(c4p.Model.linkActionMap[fromType][toType])) {
            return c4p.Model.linkActionMap[fromType][toType];
        }
        return [];
    };

    $scope.isPossibleLinkAction = function (fromType, toType) {
        if (a4p.isDefined(c4p.Model.linkActionMap[fromType])
            && a4p.isDefined(c4p.Model.linkActionMap[fromType][toType])) {
            return (c4p.Model.linkActionMap[fromType][toType].length > 0);
        }
        return false;
    };

    /**
     * Constructor
     */
    $scope.ctrlDetail = function() {
        a4p.InternalLog.log('ctrlDetail','new');

    	// Set Nav information
		$scope.setNavTitle('');

	    $scope._initDetail();

    };

    // Set item detail context (header, footer)
    $scope._initDetail = function () {

        a4p.InternalLog.log('ctrlDetail - initDetail',''+ version);
    	if (!$scope.srvNav.item) return;
        $scope.itemDetailDBId = $scope.srvNav.item.id.dbid;
        a4p.InternalLog.log('ctrlDetail - initDetail',''+ $scope.srvNav.item.id.dbid);

    	// Should we reload detail
    	// if ($scope.lastItemId == $scope.srvNav.item.id.dbid) return;
    	// $scope.lastItemId = $scope.srvNav.item.id.dbid;

		// Set item ids
		//if ($scope.itemDetail && !$scope.itemDetailDBId) {
		//	$scope.itemDetailDBId = $scope.itemDetail.id.dbid;
		//}
		//$scope.removeDoubleNavBack($scope.srvNav.item.id.dbid);
        $scope._refreshData();

        if ($scope.srvNav.item.a4p_type == 'Document')
            $scope.configStateAdd 	= false;

    };

    $scope._formatStringDateToDay = function(string) {

    	var date = a4pDateParse(string);
    	var val = $scope.srvLocale.formatDate(date,'shortDate');
    	return val;
    };

    $scope._formatStringDateToTime = function(string) {

    	var date = a4pDateParse(string);
    	var val = $scope.srvLocale.formatDate(date,'shortTime');
    	return val;
    };



    $scope._refreshData = function () {
        //$scope.item = $scope.srvData.getObject($scope.itemDetailDBId);
        //if (a4p.isUndefined($scope.item)) {//TODO ... }
        //$scope.itemDetailName = $scope.getItemNameById($scope.itemDetailDBId);

        // Set Nav information
		$scope.setNavTitle($scope.getItemTitle($scope.srvNav.item.a4p_type));

		// N+1 details
		$scope.getDetailCompanyName();

		// Audit fields
        if (a4p.isDefined($scope.srvNav.item.created_by_id)
            && a4p.isDefined($scope.srvNav.item.created_by_id.dbid)
            && ($scope.srvNav.item.created_date)) {
            $scope.auditCreator = $scope.getItemNameById($scope.srvNav.item.created_by_id.dbid);
    		$scope.auditCreatedDate = $scope._formatStringDateToDay($scope.srvNav.item.created_date);
        } else {
            $scope.auditCreator = '';
    		$scope.auditCreatedDate = '';
        }
        if (a4p.isDefined($scope.srvNav.item.last_modified_by_id)
            && a4p.isDefined($scope.srvNav.item.last_modified_by_id.dbid)
            && ($scope.srvNav.item.last_modified_date)) {
            $scope.auditModifier = $scope.getItemNameById($scope.srvNav.item.last_modified_by_id.dbid);
    		$scope.auditModifiedDate = $scope._formatStringDateToDay($scope.srvNav.item.last_modified_date);
        } else {
            $scope.auditModifier = '';
    		$scope.auditModifiedDate = '';
        }
        //show origin of event
        if ((($scope.srvNav.item.a4p_type =='Event') || ($scope.srvNav.item.a4p_type =='Task'))
            && a4p.isDefined($scope.srvNav.item.assigned_contact_id)
            && a4p.isDefined($scope.srvNav.item.assigned_contact_id.dbid)) {
                $scope.leader = $scope.getItemNameById($scope.srvNav.item.assigned_contact_id.dbid);
                $scope.leaderType = '';
                if ($scope.leader != '') $scope.leaderType = $scope.leader.a4p_type;
            } else {
                $scope.leader = '';
                $scope.leaderType = '';
        }
    };

    function c4pItemHasOnlyOneLinkWithTypeFilter(itemList, linkTypeToExcludeArray) {
    	var items = [];
        itemList = itemList || [];
        for (var j = 0; j < itemList.length; j++) {
            var link = itemList[j];
            var item = link.item;
            var links = link.linkNames;
            // Filter on documentQuery
            for (var i = 0; links && i < links.length; i++) {
                var excluded = false;
                for (var k = 0; linkTypeToExcludeArray && k < linkTypeToExcludeArray.length; k++) {
                    if (links[i] === linkTypeToExcludeArray[k]) {
                        excluded = true;
                        break;
                    }
                }
                if (!excluded) {
                    items.push(link);
                    break;
                }
            }
        }
        return items;
    }

	$scope.getHtmlLinkName = function(linkname) {
		var name = $scope.getItemNameById($scope.srvNav.item.id.dbid);
        return a4pFormat($scope.srvLocale.translations.htmlLinkName[linkname], name);
    };

    $scope.selectItem = function (item) {

    	//setTimeout(function(){
        a4p.InternalLog.log('ctrlDetail - selectItem',''+item.a4p_type+item.id.dbid);
	    	$scope.setItemAndGoDetail(item);
    //	});
    };

    /**
     * special N+1 values
     */
    $scope.getDetailCompanyName = function() {

        $scope.companyName = '';

    	if (	!$scope.srvNav.item
    		|| 	!$scope.srvNav.item.account_id) {
    		return $scope.companyName;
    	}

		for (var j = 0; j < $scope.srvData.currentItems.Account.length; j++) {
			var account = $scope.srvData.currentItems.Account[j];
	        if (account.id.dbid == $scope.srvNav.item.account_id.dbid) {
	        	$scope.companyName = account.company_name;
	            break;
	        }
	    }

		return $scope.companyName;
    };

    /**
     *  N+1 dialogs
     */

    $scope.addItemDialog = function(type) {
        if ($scope.srvNav.item) {
    		var type = $scope.srvNav.item.a4p_type;
            var object = $scope.srvNav.item;//$scope.srvData.getObject($scope.itemDetailDBId);
            if (a4p.isDefined(object)) {
                var itemToCreate = $scope.srvData.createObject(type, {});
                a4p.safeApply($scope, function() {
                    $scope.editObjectDialog(itemToCreate,
                        function (result) {
                            if (a4p.isDefined(result)) {
                                a4p.safeApply($scope, function() {
                                    $scope.srvData.addAndSaveObject(result);
                                    // 'Event' == type
                                    srvLink.linkObjectsToItem(type, '', [result], object);
                                    if ('Event' == type) {
                                        $scope.setItemAndGoMeeting(result);
                                    } else {
                                        $scope.setItemAndGoDetail(result);
                                    }
                                });
                            }
                        }
                    );
                });
            }
        }
    };

    /**
     * Link item to one created object
     */
    $scope.createAndLinkDialog = function (item, fromLink, toType) {
        if (!item) {
            $scope.linkStateAdd = false;
            return;
        }
        var newObject = $scope.srvData.createObject(toType, {});
        // dialog to edit a new Contact
        $scope.openDialog(
            {
                backdropClick: false,
                dialogClass: 'modal c4p-modal-full c4p-dialog',
                backdropClass: 'modal-backdrop c4p-modal-full',
                controller: 'ctrlEditDialogObject',
                templateUrl: 'partials/dialog/edit_object.html',
                resolve: {
                    srvData: function () {
                        return $scope.srvData;
                    },
                    srvLocale: function () {
                        return $scope.srvLocale;
                    },
                    srvConfig: function () {
                        return $scope.srvConfig;
                    },
                    objectItem: function () {
                        //return angular.copy(newObject);
                        return newObject;
                    },
                    removeFct: function () {
                        return function (obj) {
                            $scope.srvData.removeAndSaveObject(obj);
                        };
                    },
                    spinner: function () {
                        return $scope.spinnerContainer;
                    },
                    openDialogFct: function () {
                        return $scope.openDialog;
                    }                    
                }
            },
            function (result) {
                if (a4p.isDefined(result)) {
                    a4p.safeApply($scope, function () {
                        srvData.addAndSaveObject(result);
                        srvLink.linkItemToObjects(fromLink, item, toType, [result]);
                        $scope.linkStateAdd = false;
                    });
                } else {
                    a4p.safeApply($scope, function () {
                        $scope.linkStateAdd = false;
                    });
                }
            });
    };

    /**
     * Link item to selected/created objects
     */
    $scope.linkAddDialog = function (item, fromLink, toType) {
        if (!item) {
            $scope.linkStateAdd = false;
            return;
        }
        var multipleChoice = true;
        var menus = [];
        var addedOrganizers = [];

        // Special cases not referenced into c4p.Model.a4p_types[item.a4p_type].linkDescs
        if ((toType == 'Event') && (fromLink == 'attended')) {
            // Pas de suggestions pour le moment
        } else if ((toType == 'Event') && (fromLink == 'parent')) {
            // Pas de suggestions pour le moment
        } else if ((toType == 'Event') && (fromLink == 'attached')) {
            // Pas de suggestions pour le moment
        } else if ((toType == 'Contact') && (fromLink == 'attendee')) {
            if (a4p.isDefined(item.what_id.dbid)) {
                var whatObject = $scope.srvData.getObject(item.what_id.dbid);
                if ((whatObject.a4p_type == 'Opportunity') && a4p.isDefined(whatObject.account_id.dbid)) {
                    menus.push({
                        icon: 'chevron-right',
                        name: 'sameCompany',
                        filterFct: createSameCompanyFilter(whatObject.account_id.dbid)
                    });
                    addedOrganizers.push(srvFacet.createSameCompanyOrganizer(whatObject.account_id.dbid));
                } else if (whatObject.a4p_type == 'Account') {
                    menus.push({
                        icon: 'chevron-right',
                        name: 'sameCompany',
                        filterFct: createSameCompanyFilter(whatObject.id.dbid)
                    });
                    addedOrganizers.push(srvFacet.createSameCompanyOrganizer(whatObject.id.dbid));
                }
            }
            if (a4p.isDefined(item.owner_id) && a4p.isDefined(item.owner_id.dbid)) {
                var ownerObject = $scope.srvData.getObject(item.owner_id.dbid);
                if (a4p.isDefined(ownerObject.manager_id.dbid)) {
                    var managerObject = $scope.srvData.getObject(ownerObject.manager_id.dbid);
                    menus.push({
                        icon:'chevron-right',
                        name:'sameManager',
                        filterFct:createSameManagerFilter(managerObject.id.dbid)
                    });
                    addedOrganizers.push(srvFacet.createSameManagerOrganizer(managerObject.id.dbid));
                }
                menus.push({
                    icon:'chevron-right',
                    name:'sameTeam',
                    filterFct:createSameManagerFilter(ownerObject.id.dbid)
                });
                addedOrganizers.push(srvFacet.createSameTeamOrganizer(ownerObject.id.dbid));
            }
        } else if ((toType == 'Document') && (fromLink == 'attachee')) {
            // Pas de suggestions pour le moment
        } else if ((toType == 'Document') && (fromLink == 'child')) {
            // Pas de suggestions pour le moment
        } else {
            // Pas de suggestions pour le moment
            var done = false;
            for (var fromFieldIdx=0; fromFieldIdx<c4p.Model.a4p_types[item.a4p_type].linkFields.length; fromFieldIdx++) {
                var linkModel = c4p.Model.a4p_types[item.a4p_type].linkFields[fromFieldIdx];
                var fromField = linkModel.key;
                var isArrayField = a4p.isDefined(c4p.Model.objectArrays[item.a4p_type][fromField]);
                if (!isArrayField) {
                    if (linkModel.one == fromLink) {
                        for (var toTypeIdx=0; toTypeIdx<linkModel.types.length; toTypeIdx++) {
                            if (linkModel.types[toTypeIdx] == toType) {
                                multipleChoice = false;
                                done = true;
                                break;
                            }
                        }
                        if (done) break;
                    }
                } else {
                    if (linkModel.one == fromLink) {
                        for (var toTypeIdx=0; toTypeIdx<linkModel.types.length; toTypeIdx++) {
                            if (linkModel.types[toTypeIdx] == toType) {
                                multipleChoice = true;
                                done = true;
                                break;
                            }
                        }
                        if (done) break;
                    }
                }
            }
            if (!done) {
                for (var fromFieldIdx=0; fromFieldIdx<c4p.Model.a4p_types[toType].linkFields.length; fromFieldIdx++) {
                    var linkModel = c4p.Model.a4p_types[toType].linkFields[fromFieldIdx];
                    var fromField = linkModel.key;
                    var isArrayField = a4p.isDefined(c4p.Model.objectArrays[toType][fromField]);
                    if (!isArrayField) {
                        if (linkModel.many == fromLink) {
                            for (var toTypeIdx=0; toTypeIdx<linkModel.types.length; toTypeIdx++) {
                                if (linkModel.types[toTypeIdx] == item.a4p_type) {
                                    multipleChoice = true;
                                    done = true;
                                    break;
                                }
                            }
                            if (done) break;
                        }
                    } else {
                        // TODO : manage multi-links : facets_ids, items_ids, contact_ids, document_ids
                        if (linkModel.many == fromLink) {
                            for (var toTypeIdx=0; toTypeIdx<linkModel.types.length; toTypeIdx++) {
                                if (linkModel.types[toTypeIdx] == item.a4p_type) {
                                    multipleChoice = true;
                                    done = true;
                                    break;
                                }
                            }
                            if (done) break;
                        }
                    }
                }
            }
            // TODO : should throw Exception because asked link does not exists in model
            if (!done) return;
        }

        var dialogOptions = {
            backdropClick: true,
            dialogClass: 'modal c4p-modal-left c4p-modal-search c4p-dialog',
            backdropClass: 'modal-backdrop c4p-modal-left'
        };
        var resolve = {
            srvData: function () {
                return srvData;
            },
            srvConfig: function() {
                return srvConfig;
            },
            srvLocale: function () {
                return srvLocale;
            },
            type: function () {
                return toType;
            },
            initFilter: function () {
                return function (object) {
                    if (object.id.dbid == item.id.dbid) return false;
                    if (srvData.isObjectOwnedByUser(object) && srvData.isObjectOwnedByUser(item)) {
                        return !srvLink.hasNamedLinkTo(item.a4p_type, fromLink, item, object);
                    }
                    return false;
                }
            },
            initSelector: function () {
                return function (object) {
                    return false
                };
            },
            multiple: function () {
                return multipleChoice;
            },
            createFct: function () {
                // DO NOT USE scope.editObjectDialog() because it does $scope.gotoBack(0); in removeFct.
                return function () {
                    var newObject = srvData.createObject(toType, {});
                    // dialog to edit a new Contact
                    return promiseDialog({
                        backdropClick: false,
                        dialogClass: 'modal c4p-modal-full c4p-dialog',
                        backdropClass: 'modal-backdrop c4p-modal-full',
                        controller: 'ctrlEditDialogObject',
                        templateUrl: 'partials/dialog/edit_object.html',
                        resolve: {
                            srvData: function () {
                                return srvData;
                            },
                            srvLocale: function () {
                                return srvLocale;
                            },
                            srvConfig: function () {
                                return srvConfig;
                            },
                            objectItem: function () {
                                //return angular.copy(newObject);
                                return newObject;
                            },
                            removeFct: function () {
                                return function (obj) {
                                    srvData.removeAndSaveObject(obj);
                                };
                            },
                            spinner: function () {
                                return $scope.spinnerContainer;
                            },
                            openDialogFct: function () {
                                return $scope.openDialog;
                            }    
                        }
                    });
                };
            }
        };
        if (srvConfig.c4pConfig.exposeFacetDialog) {
            dialogOptions.controller = 'ctrlFacetSelectedDialog';
            dialogOptions.templateUrl = 'partials/dialog/dialogFacetSelected.html';
            resolve.srvFacet = function () { return srvFacet; };
            resolve.addedOrganizers = function () { return addedOrganizers; };
        } else {
            dialogOptions.controller = 'ctrlSelectObjectsDialog';
            dialogOptions.templateUrl = 'partials/dialog/dialogSelectObjects.html';
            resolve.suggestedMenus = function () { return menus; };
        }
        dialogOptions.resolve = resolve;
        $scope.openDialog(dialogOptions, function (result) {
            if (a4p.isDefined(result)) {
                a4p.safeApply($scope, function () {
                    srvLink.linkItemToObjects(fromLink, item, toType, result);
                    $scope.linkStateAdd = false;
                });
            } else {
                a4p.safeApply($scope, function () {
                    $scope.linkStateAdd = false;
                });
            }
        });
    };

    /**
     * Events catch
     */
    $scope.$on('setItemDetail', function (event, item) {
        a4p.InternalLog.log('ctrlDetail - Broadcast setItemDetail',''+item.id.dbid);
        // Escape a second call to _initDetail() after creation of ctrlDetail
        if ($scope.itemDetailDBId != item.id.dbid) {
            $scope._initDetail();
        }
    });

    $scope.$on('mindMapUpdated', function (event) {
        $scope._refreshData();
    });

    $scope.$on('mindMapLoaded', function (event) {
        $scope._refreshData();
    });

    /**
     * Initialization
     */
	$scope.ctrlDetail();


	/**
	 * !!!!!!!!!!!!!
	 */
	//TODO MLE google map
	$scope.google = false;
	if (typeof google != 'undefined') {

		$scope.google = true;
		// Enable the new Google Maps visuals until it gets enabled by default.
	    // See http://googlegeodevelopers.blogspot.ca/2013/05/a-fresh-new-look-for-maps-api-for-all.html
	    google.maps.visualRefresh = true;
	}

	angular.extend($scope, {

	    position: {
	      coords: {
	        latitude: 45,
	        longitude: -73
	      }
	    },

		/** the initial center of the map */
		centerProperty: {
			latitude: 45,
			longitude: -73
		},

		/** the initial zoom level of the map */
		zoomProperty: 4,

		/** list of markers to put in the map */
		markersProperty: [ {
				latitude: 45,
				longitude: -74
			}],

		// These 2 properties will be set when clicking on the map
		clickedLatitudeProperty: null,
		clickedLongitudeProperty: null,

		eventsProperty: {
		  click: function (mapModel, eventName, originalEventArgs) {
		    // 'this' is the directive's scope
		    console.log("user defined event on map directive with scope", this);
		    console.log("user defined event: " + eventName, mapModel, originalEventArgs);
		  }
		}
	});

	$scope.findGMLocation = function(){

		function success(position) {
		  var mapcanvas = document.createElement('div');
		  mapcanvas.id = 'mapcontainer';
		  mapcanvas.style.height = '400px';
		  mapcanvas.style.width = '600px';
		  document.querySelector('article').appendChild(mapcanvas);
		  var coords = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
		  var options = {
		    zoom: 15,
		    center: coords,
		    mapTypeControl: false,
		    navigationControlOptions: {
		    	style: google.maps.NavigationControlStyle.SMALL
		    },
		    mapTypeId: google.maps.MapTypeId.ROADMAP
		  };
		  var map = new google.maps.Map(document.getElementById("mapcontainer"), options);
		  var marker = new google.maps.Marker({
		      position: coords,
		      map: map,
		      title:"You are here!"
		  });
		}
		if (navigator.geolocation) {
		  navigator.geolocation.getCurrentPosition(success);
		} else {
		  error('Geo Location is not supported');
		}
	};

	 var geocoder;
	  var map;
	  function initialize() {
	    geocoder = new google.maps.Geocoder();
	    var latlng = new google.maps.LatLng(-34.397, 150.644);
	    var mapOptions = {
	      zoom: 8,
	      center: latlng,
	      mapTypeId: google.maps.MapTypeId.ROADMAP
	    }
	    map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
	  };

	function codeAddress() {
	    var address = document.getElementById("address").value;
	    geocoder.geocode( { 'address': address}, function(results, status) {
	      if (status == google.maps.GeocoderStatus.OK) {
	        map.setCenter(results[0].geometry.location);
	        var marker = new google.maps.Marker({
	            map: map,
	            position: results[0].geometry.location
	        });
	      } else {
	        alert("Geocode was not successful for the following reason: " + status);
	      }
	    });
	  };

/*
	//streetview
	var map;
	var panorama;
	var astorPlace = new google.maps.LatLng(40.729884, -73.990988);
	var busStop = new google.maps.LatLng(40.729559678851025, -73.99074196815491);
	var cafe = new google.maps.LatLng(40.730031233910694, -73.99142861366272);
	var bank = new google.maps.LatLng(40.72968163306612, -73.9911389350891);

	function initialize() {

	  // Set up the map
	  var mapOptions = {
	    center: astorPlace,
	    zoom: 18,
	    mapTypeId: google.maps.MapTypeId.ROADMAP,
	    streetViewControl: false
	  };
	  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

	  // Setup the markers on the map
	  var cafeMarker = new google.maps.Marker({
	      position: cafe,
	      map: map,
	      icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_icon&chld=cafe|FFFF00',
	      title: 'Cafe'
	  });

	  var bankMarker = new google.maps.Marker({
	      position: bank,
	      map: map,
	      icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_icon&chld=dollar|FFFF00',
	      title: 'Bank'
	  });

	  var busMarker = new google.maps.Marker({
	      position: busStop,
	      map: map,
	      icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_icon&chld=bus|FFFF00',
	      title: 'Bus Stop'
	  });

	  // We get the map's default panorama and set up some defaults.
	  // Note that we don't yet set it visible.
	  panorama = map.getStreetView();
	  panorama.setPosition(astorPlace);
	  panorama.setPov({
	    heading: 265,
	    pitch:0}
	  );
	}

	function toggleStreetView() {
	  var toggle = panorama.getVisible();
	  if (toggle == false) {
	    panorama.setVisible(true);
	  } else {
	    panorama.setVisible(false);
	  }
	}
	*/
}
ctrlDetail.$inject = ['$scope', '$dialog', 'version', 'srvData', 'srvFacet', 'srvLocale', 'srvLink', 'srvNav', 'srvConfig'];


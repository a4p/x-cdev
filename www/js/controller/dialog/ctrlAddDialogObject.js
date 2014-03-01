'use strict';

function ctrlAddDialogObject($scope, srvData, srvLocale, srvConfig, item, createLinks, dialog) {

    /**
     * Constants
     */
    $scope.srvLocale = null;
    $scope.item = null;
    $scope.targetTypes = [];
    $scope.sameLinks = [];
    $scope.linkedTargetTypes = [];
    $scope.createLinks = false;

    /**
     * Functions
     */

    $scope.init = function (srvLocale, item, createLinks) {
        $scope.srvLocale = srvLocale;
        $scope.item = item;// object from which we create a linked object (it is the srvNav.item)
        $scope.createLinks = (createLinks && createLinks == true);

        // Calculate itemName (cf. CtrlNavigation.getItemNameById)
        $scope.itemName = srvConfig.getItemName(item);
        // Calculate possible links
        $scope.targetTypes = [];
        $scope.sameLinks = [];
        $scope.linkedTargetTypes = [];

        // Add N object creation
        if (!$scope.createLinks)
        	$scope.targetTypes.push(item.a4p_type);

        // Add N object with 1 same link
        if (item != null && $scope.createLinks) {
            for (var m = 0, len5 = c4p.Model.a4p_types[item.a4p_type].linkFields.length; m < len5; m++) {
                var linkModel = c4p.Model.a4p_types[item.a4p_type].linkFields[m];
                var sameLink = linkModel.key;
                var sameLinkName = linkModel.one;
                var isArrayField = a4p.isDefined(c4p.Model.objectArrays[item.a4p_type][sameLink]);
                if (!isArrayField) {
                    if (a4p.isDefined(item[sameLink]) && a4p.isDefined(item[sameLink].dbid)) {
                        $scope.sameLinks.push({
                            type: item.a4p_type,
                            name: sameLinkName,
                            title: a4pFormat($scope.srvLocale.translations.htmlLinkName[sameLinkName], $scope.itemName)
                        });
                    }
                } else {
                    // TODO : manage multi-links : facets_ids, items_ids, contact_ids, document_ids
                }
            }
        }

        // Add N+1 object
        if ($scope.createLinks) {
            // Exclude attachTypes (we have not the addContat2Event available for example)
            //for (var i = 0, len = c4p.Model.attachTypes.length; i < len; i++) {
            //   	var type = c4p.Model.attachTypes[i];
            //}
            for (var i = 0, len = c4p.Model.objectTypes.length; i < len; i++) {
                   	var type = c4p.Model.objectTypes[i];

	            // Exclude 'Document' types (we have not the takePicture available for example)
                if (type == 'Document') continue;

	            for (var j = 0, len2 = c4p.Model.a4p_types[type].linkFields.length; j < len2; j++) {
                    var linkModel = c4p.Model.a4p_types[type].linkFields[j];
                    var targetLink = linkModel.key;
	                var targetLinkName = linkModel.one;
                    // Exclude 'owner' links
                    if (targetLinkName == 'owner') continue;
                    if (targetLinkName == 'creator') continue;
                    if (targetLinkName == 'modifier') continue;
                    var isArrayField = a4p.isDefined(c4p.Model.objectArrays[type][targetLink]);
                    if (!isArrayField) {
                        var reverseTargetLinkName = linkModel.many;
                        for (var k = 0, len3 = linkModel.types.length; k < len3; k++) {
                            var targetType = linkModel.types[k];
                            if ((item == null) || (targetType == item.a4p_type)) {
                                var typeAdded = false;
                                var links = [];
                                for (var l = 0, len4 = $scope.linkedTargetTypes.length; l < len4; l++) {
                                    if ($scope.linkedTargetTypes[l].type == type) {
                                        typeAdded = true;
                                        links = $scope.linkedTargetTypes[l].links;
                                        break;
                                    }
                                }
                                links.push({
                                    name: targetLinkName,
                                    title: a4pFormat($scope.srvLocale.translations.htmlLinkName[reverseTargetLinkName], $scope.itemName)
                                });
                                if (!typeAdded) {
                                    $scope.linkedTargetTypes.push({type: type, links: links});
                                }
                            }
                        }
                    } else {
                        // TODO : manage multi-links : facets_ids, items_ids, contact_ids, document_ids
                    }
	           }
	        }
        }
    };

    $scope.close = function (type, sameLinks, linkName) {
        dialog.close({type: type, sameLinks: sameLinks, linkedBy: linkName});
    };

    $scope.getItemNameById = function (dbid) {
        var item = srvData.getObject(dbid);
        if (!item) return '';
        return srvConfig.getItemName(item);
    };

    /**
     * Initialization
     */
    $scope.init(srvLocale, item, createLinks);
}

'use strict';

/**
 * Object action controller
 *
 * @param $scope
 * @param $q
 * @param $dialog
 * @param srvData
 * @param srvNav
 * @param srvFacet
 * @param srvConfig
 * @param srvLocale
 */
function ctrlAction($scope, $q, $dialog, srvData, srvNav, srvFacet, srvConfig, srvLocale) {

    /**
     * Helpers
     */

    function promiseDialog(dialogOptions) {
        return $dialog.dialog(dialogOptions).open();
    }

    function openDialog(dialogOptions, onSuccess) {
        a4p.safeApply($scope, function() {
            $dialog.dialog(dialogOptions).open().then(onSuccess);
        });
    }

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

    $scope.currentObject = null;
    $scope.actionList = [];
    $scope.actionMap = {};

    $scope.methodList = [
        'toggleFavorite',
        'viewDocument',
        'setItemAndGoTimeline',
        'setItemAndGoCalendar',
        'setItemAndGoMeeting',
        'shareDocumentByChatter',
        'addDocuments',
        'addContacts',
        'createNewEmail',
        'sendICal',
        'createNewPicture',
        'createNewNote',
        'createNewReport',
        'editItem',
        'dupMeeting'

    ];

    $scope.dataListener = srvData.addListenerOnUpdate(function (callbackId, action, type, id) {
        if ((action == 'set') && (id == $scope.currentObject.id.dbid)) {
            a4p.safeApply($scope, function() {
                $scope.update();
            });
        } else if ((action == 'remove') && (id == $scope.currentObject.id.dbid)) {
            a4p.safeApply($scope, function() {
                $scope.clear();
            });
        } else if (action == 'clear') {
            a4p.safeApply($scope, function() {
                $scope.clear();
            });
        }
    });

    $scope.navListener = null;

    $scope.$on('$destroy', function (event) {
        if ($scope.navListener) srvNav.cancelListener($scope.navListener);
        srvData.cancelListener($scope.dataListener);
    });

	/**
	 * Methods
	 */

    $scope.clear = function () {
    };

    /**
     * Instruct this controller to watch the object pointed by srvNav
     */
    $scope.watchSrvNav = function () {
        // Remove previously set listener
        if ($scope.navListener) srvNav.cancelListener($scope.navListener);
        $scope.navListener = srvNav.addListenerOnUpdate(function (callbackId, action, page, slide, id) {
            if (action == 'goto') {
                if (srvNav.item) {
                    a4p.safeApply($scope, function() {
                        $scope.init(srvNav.item);
                    });
                } else {
                    a4p.safeApply($scope, function() {
                        $scope.clear();
                    });
                }
            }
        });
        if (srvNav.item) $scope.init(srvNav.item);
    };

    /**
     * Instruct this controller to watch only the object passed in argument
     */
    $scope.watchObject = function (object) {
        // Remove previously set listener
        if ($scope.navListener) {
            srvNav.cancelListener($scope.navListener);
            $scope.navListener = null;
        }
        $scope.init(object);
    };

    $scope.init = function (object) {
        $scope.currentObject = object;
        $scope.actionList = [];
        $scope.actionMap = {};
        for (var i= 0, nb=$scope.methodList.length; i < nb; i++) {
            var methodName = $scope.methodList[i];
            var methodDesc = srvData.a4p_methods[methodName];
            if (srvData.isMethodPossibleForObject(methodName, object)) {
                var icon = srvData.getMethodIcon(methodName, object);
                var disabled = srvData.isMethodDisabledForObject(methodName, object);
                $scope.actionList.push({
                    id:methodName,
                    icon:icon,
                    disabled:disabled
                });
                $scope.actionMap[methodName] = {
                    id:methodName,
                    icon:icon,
                    disabled:disabled
                };
            }
        }
    };

    $scope.update = function () {
        var object = $scope.currentObject;
        var actionIdx = 0;
        for (var i= 0, nb=$scope.methodList.length; i < nb; i++) {
            var methodName = $scope.methodList[i];
            var methodDesc = srvData.a4p_methods[methodName];
            if (methodDesc.objectTypes[object.a4p_type]) {
                // $scope.actionList size and order depends only on a4p_type => ease the update !
                var currentMethod = $scope.actionList[actionIdx];
                var icon = methodDesc.icon;
                if (a4p.isDefined(methodDesc.iconeToggle)) {
                    if ($scope[methodDesc.iconeToggle.when]($scope.currentObject)) {
                        icon = methodDesc.iconeToggle.icon;
                    }
                }
                var disabled = false;
                if (methodDesc.mustBeOwner && !srvData.isObjectOwnedByUser(object)) {
                    disabled = true;
                } else if (a4p.isDefined(methodDesc.mustHaveFavorite) && !srvData.favoritesObject) {
                    disabled = true;
                } else if (a4p.isDefined(methodDesc.mustHaveBetaOption) && !srvConfig.c4pConfig[methodDesc.mustHaveBetaOption]) {
                    disabled = true;
                } else if (a4p.isDefined(methodDesc.mustBeCreated) && (object.c4p_synchro.creating || object.c4p_synchro.reading)) {
                    disabled = true;
                } else if (a4p.isDefinedAndNotNull(methodDesc.possibleCrms)) {
                    var enabled = false;
                    for (var j= 0, max=methodDesc.possibleCrms.length; j < max; j++) {
                        var crm = methodDesc.possibleCrms[j];
                        if (isValueInList(srvConfig.getActiveCrms(), crm)) {
                            enabled = true;
                            break;
                        }
                    }
                    if (!enabled) disabled = true;
                }
                currentMethod.icon = icon;
                currentMethod.disabled = disabled;
                $scope.actionMap[methodName].icon = icon;
                $scope.actionMap[methodName].disabled = disabled;
                actionIdx++;
            }
        }
    };

    $scope.doAction = function(methodName) {
        var deferred = $q.defer();
        var promise = $scope[methodName]($scope.currentObject);
        if (a4p.isDefined(promise)) {
            promise.then(function(obj) {
                deferred.resolve(obj);
            }, function(diag){
                deferred.reject(diag);
            });
        }
        return deferred.promise;
    };

    $scope.doActionObj = function(methodName, obj) {
        var deferred = $q.defer();
        var promise = $scope[methodName](obj);
        if (a4p.isDefined(promise)) {
            promise.then(function(obj) {
                deferred.resolve(obj);
            }, function(diag){
                deferred.reject(diag);
            });
        }
        return deferred.promise;
    };

    $scope.isTaggedFavorite = function(object) {
        return srvData.isTaggedFavorite(object);
    };

    $scope.toggleFavorite = function(object) {
        if (srvData.toggleFavorite(object)) {
            $scope.update();
        }
    };

    // $scope.viewDocument() exists into ctrlNavigation

    $scope.setItemAndGoTimeline = function(object) {
        /*if (object) {
            srvNav.goto($scope.pageTimeline, $scope.slideTimeline, object);
        }
	    $scope.gotoSlide($scope.pageTimeline, $scope.slideTimeline);*/
        openDialog(
            {
                backdrop: false,
                dialogClass: 'modal c4p-modal-full c4p-dialog',
                controller: 'ctrlTimeline',
                templateUrl: 'partials/dialog/timeline.html',
                resolve: {
                    srvData: function () {
                        return srvData;
                    },
                    srvLocale: function () {
                        return srvLocale;
                    },
                    srvConfig: function() {
                        return srvConfig;
                    },
                    objectItem: function () {
                        return object;
                    }
                }
            },
            function () {});
    };

    $scope.setItemAndGoCalendar = function(object) {
        if (object) {
            srvNav.goto($scope.pageNavigation, $scope.slideNavigationCalendar, object);
        }
	    $scope.gotoSlide($scope.pageNavigation, $scope.slideNavigationCalendar);
    };

    // $scope.gotoSlide() exists into ctrlNavigation
    // $scope.setItemAndGoMeeting() exists into ctrlNavigation

    $scope.shareDocumentByChatter = function(object) {
        var parentObject = srvData.getObject(object.parent_id.dbid);
        $scope.shareByChatter(object, parentObject).then(function (document) {
            //$scope.selectItemAndCloseAside(document);
        }, function (diag) {
        });
    };

    $scope.shareDocumentByEmail = function(object) {
        var parentObject = srvData.getObject(object.parent_id.dbid);
        $scope.shareByEmail(object, parentObject).then(function (document) {
            //$scope.selectItemAndCloseAside(document);
        }, function (diag) {
        });
    };

    $scope.addDocuments = function(parentObject) {
        // TODO : event must not be in saving state (no yet syncrhonized with Salesforce)
        //if ($scope.srvData.isObjectToSave(parentObject.id.dbid)) {// wait for object synchronized} else {// ok}

        var attachments = srvData.getTypedDirectLinks(parentObject, 'child', 'Document');
        var attachees = srvData.getTypedRemoteLinks(parentObject, 'attachee', 'Document');

        var dialogOptions = {
            backdropClick: false,
            dialogClass: 'modal modal-left c4p-modal-search c4p-dialog',
            backdropClass: 'modal-backdrop c4p-modal-search-backdrop'
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
                return 'Document';
            },
            initFilter: function () {
                return function (object) {
                    // reject documents already attached to this parentObject
                    for (var i = 0; i < attachments.length; i++) {
                        if (attachments[i].id.dbid == object.id.dbid) return false;
                    }
                    for (var j = 0; j < attachees.length; j++) {
                        if (attachees[j].id.dbid == object.id.dbid) return false;
                    }
                    return true
                };
            },
            initSelector: function () {
                return function (object) {
                    return false
                };
            },
            multiple: function () {
                return true;
            },
            createFct: function () {
                return null;
            }
        };
        if (srvConfig.c4pConfig.exposeFacetDialog) {
            dialogOptions.controller = 'ctrlFacetSelectedDialog';
            dialogOptions.templateUrl = 'partials/dialog/dialogFacetSelected.html';
            resolve.srvFacet = function () { return srvFacet; };
            resolve.addedOrganizers = function () { return []; };
        } else {
            dialogOptions.controller = 'ctrlSelectObjectsDialog';
            dialogOptions.templateUrl = 'partials/dialog/dialogSelectObjects.html';
            resolve.suggestedMenus = function () { return []; };
        }
        dialogOptions.resolve = resolve;
        openDialog(dialogOptions, function (result) {
            if (a4p.isDefined(result)) {
                a4p.safeApply($scope, function () {
                    for (var d = 0; d < result.length; d++) {
                        srvData.newAndSaveAttachment('Attachee', result[d], parentObject);
                    }
                });
            }
        });
    };

    $scope.addContacts = function(parentObject) {
        // TODO : event must not be in saving state (no yet synchronized with Salesforce)
        //if ($scope.srvData.isObjectToSave(parentObject.id.dbid)) {// wait for object synchronized} else {// ok}

        var contacts = srvData.getTypedRemoteLinks(parentObject, 'attendee', 'Contact');
        var menus = [];
        var addedOrganizers = [];

        if (a4p.isDefined(parentObject.what_id.dbid)) {
            var whatObject = $scope.srvData.getObject(parentObject.what_id.dbid);
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
        if (a4p.isDefined(parentObject.owner_id) && a4p.isDefined(parentObject.owner_id.dbid)) {
            var ownerObject = $scope.srvData.getObject(parentObject.owner_id.dbid);
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
        var dialogOptions = {
            backdropClick: false,
            dialogClass: 'modal modal-left c4p-modal-search c4p-dialog',
            backdropClass: 'modal-backdrop c4p-modal-search-backdrop'
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
                return 'Contact';
            },
            initFilter: function () {
                return function (object) {
                    // reject owner of this event
                    if (a4p.isDefined(parentObject.owner_id) && (parentObject.owner_id.dbid == object.id.dbid)) return false;
                    // reject contacts already attached to this event
                    for (var i = 0; i < contacts.length; i++) {
                        if (contacts[i].id.dbid == object.id.dbid) return false;
                    }
                    return true
                };
            },
            initSelector: function () {
                return function (object) {
                    return false
                };
            },
            multiple: function () {
                return true;
            },
            createFct: function () {
                // DO NOT USE scope.editObjectDialog() because it does $scope.gotoBack(0); in removeFct.
                return function() {
                    var newObject = $scope.srvData.createObject('Contact', {});
                    // dialog to edit a new Contact
                    return promiseDialog({
                        backdropClick: false,
                        dialogClass: 'modal c4p-modal-full c4p-dialog',
                        backdropClass: 'modal-backdrop c4p-modal-create',
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
        openDialog(dialogOptions, function (result) {
            if (a4p.isDefined(result)) {
                a4p.safeApply($scope, function () {
                    for (var c = 0; c < result.length; c++) {
                        srvData.newAndSaveAttachment('Attendee', result[c], parentObject);
                    }
                });
            }
        });
    };


    $scope.createNewEmail = function(parentObject) {
        var postTitle = 'Email about ' + parentObject.a4p_type + ' ' + srvConfig.getItemName(parentObject);
        var idsContact = [];
        var idsDocument = [];
        var attendees = srvData.getTypedDirectLinks(parentObject, 'attendee', 'Attendee');
        var attachments = srvData.getTypedDirectLinks(parentObject, 'child', 'Document');
        // TODO : add note title in email subject ?
        var email = {
            'emailType': 'normal',
            'subject': postTitle,
            'body': '',
            'contacts': idsContact,
            'documents': idsDocument,
            'emailsInput': []
        };
        openDialog(
            {
                backdrop: false,
                dialogClass: 'modal c4p-modal-full c4p-modal-mail c4p-dialog',
                controller: 'ctrlEditDialogEmail',
                templateUrl: 'partials/dialog/dialogEmail.html',
                resolve: {
                    srvLocale: function () {
                        return srvLocale;
                    },
                    srvData: function () {
                        return srvData;
                    },
                    srvConfig: function () {
                        return srvConfig;
                    },
                    srvFacet: function () {
                        return srvFacet;
                    },
                    title: function() {
                        return srvLocale.translations.htmlTitleDialogEmail;
                    },
                    attendees: function () {
                        return attendees;
                    },
                    attachments: function () {
                        return attachments;
                    },
                    email: function () {
                        return email;
                    },
                    emailId: function(){
                        return null;
                    },
                    editable: function () {
                        return true;
                    },
                    modeEdit: function () {
                        return true;
                    }
                }
            },
            function (result) {
                if (a4p.isDefined(result)) {
                    a4p.safeApply($scope, function() {
                        $scope.addEmailToParent(null, false, result, parentObject);
                    });
                }
            });
    };

    $scope.sendICal = function(parentObject) {
        var event = parentObject;
        var idsContact = [];
        var attendees = srvData.getTypedDirectLinks(parentObject, 'attendee', 'Attendee');
        var organizer = srvData.userObject;
        var startDate = a4pDateParse(event.date_start).getTime();
        var endDate = a4pDateParse(event.date_end).getTime();

        var ical = {
            title: event.name,
            description: event.description,
            emailsInput:[],
            contacts:idsContact,
            startDate:startDate,
            endDate:endDate,
            organizer:organizer.first_name + ' ' + organizer.last_name,
            location:event.location
        };

        openDialog(
            {
                backdrop: false,
                dialogClass: 'modal c4p-modal-full c4p-modal-mail c4p-dialog',
                controller: 'ctrlDialogICal',
                templateUrl: 'partials/dialog/dialogICal.html',
                resolve: {
                    srvLocale: function () {
                        return srvLocale;
                    },
                    srvData: function () {
                        return srvData;
                    },
                    srvConfig: function () {
                        return srvConfig;
                    },
                    srvFacet: function () {
                        return srvFacet;
                    },
                    ical: function() {
                        return ical;
                    },
                    attendees: function () {
                        return attendees;
                    }
                }
            },
            function (result) {
                if (a4p.isDefined(result)) {
                    a4p.safeApply($scope, function() {
                        srvData.sendICal(result);
                    });
                }
            });
    };

    $scope.createNewPicture = function(parentObject) {
        var deferred = $q.defer();

        $scope.takePicture(parentObject).then(function (document) {
            //$scope.selectItemAndCloseAside(document);
            deferred.resolve(document);
        }, function (diag) {
            deferred.reject(diag);
        });

        return deferred.promise;
    };

    $scope.createNewNote = function(parentObject) {
        $scope.takeNote(parentObject).then(function (document) {
            //$scope.selectItemAndCloseAside(document);
        }, function (diag) {});
    };

    $scope.createNewReport = function(parentObject) {
        $scope.takeReport(parentObject).then(function (document) {
            //$scope.selectItemAndCloseAside(document);
        }, function (diag) {
        });
    };

    $scope.editItem = function(object) {
        if (a4p.isDefined(object)) {
            if ((object.a4p_type == 'Note') || (object.a4p_type == 'Report')) {
                $scope.viewNote(object, true);
            } else if ((object.a4p_type == 'Document') && (object.email)) {
                $scope.viewEmail(object);
            } else {
                a4p.safeApply($scope, function() {
                    //$scope.setEditMode(true);
                    $scope.editObjectDialog(object).then(
                        function (result) {
                            if (a4p.isDefined(result)) {
                                a4p.safeApply($scope, function() {
                                    srvData.setAndSaveObject(result);
                                    //$scope.setItemAndGoDetail(result);
                                });
                            }
                        }
                    );
                });
            }
        }
    };

    $scope.dupMeeting = function(object) {

            var oneDayMs = (24 * 60 * 60) * 1000;// 1 day in ms
            var startDate = new Date(a4pDateParse(object.date_start).getTime() + oneDayMs);
            var endDate = new Date(a4pDateParse(object.date_end).getTime() + oneDayMs);

        var meeting = {
            'a4p_type' : 'Event',
            'name':object.name,
            'location': object.location,
            'date_start': a4pDateFormat(startDate),
            'date_end': a4pDateFormat(endDate),
            'description': object.description,
            'status': object.status,
            'type': object.type,
            'displayed_url': object.displayed_url
        };
        meeting = srvData.createObject('Event', meeting);

        openDialog(
            {
                backdrop: false,
                dialogClass: 'modal modal-left c4p-modal-search c4p-dialog',
                controller: 'ctrlDupMeeting',
                templateUrl: 'partials/dialog/dialogDupMeeting.html',
                resolve: {
                    srvLocale: function () {
                        return srvLocale;
                    },
                    srvData: function () {
                        return srvData;
                    },
                    mEvent: function () {
                        return meeting;
                    },
                    mEventSrc: function () {
                        return object;
                    }
                }
            },
        function (result) {
            if (a4p.isDefined(result)) {
                a4p.safeApply($scope, function() {

                    srvData.addObject(meeting);
                    if (result.dupWhat && a4p.isDefined(object.what_id.dbid)) {
                        var whatObject = srvData.getObject(object.what_id.dbid);
                        if (a4p.isDefined(whatObject)) {
                            srvData.linkToItem('Event', 'affecter', [meeting], whatObject);
                        }
                    }
                    if (result.dupAssignedContact && a4p.isDefined(object.assigned_contact_id.dbid)) {
                        var assignedObject = srvData.getObject(object.assigned_contact_id.dbid);
                        if (a4p.isDefined(assignedObject)) {
                            srvData.linkToItem('Event', 'leader', [meeting], assignedObject);
                        }
                    }
                    if (result.dupAttachment) {
                        var attachments = srvData.getTypedDirectLinks(object, 'child', 'Document');
                        // Create attachee instead of attachment
                        for (var attachmentIdx = 0, attachmentNb = attachments.length; attachmentIdx < attachmentNb; attachmentIdx++) {
                            srvData.newAndSaveAttachment('Attachee', attachments[attachmentIdx], meeting);
                        }
                        var attachees = srvData.getTypedRemoteLinks(object, 'attachee', 'Document');
                        for (var attacheeIdx = 0, attacheeNb = attachees.length; attacheeIdx < attacheeNb; attacheeIdx++) {
                            srvData.newAndSaveAttachment('Attachee', attachees[attacheeIdx], meeting);
                        }
                    }
                    if (result.dupAttendee) {
                        var attendees = srvData.getTypedRemoteLinks(object, 'attendee', 'Contact');
                        for (var attendeeIdx = 0, attendeeNb = attendees.length; attendeeIdx < attendeeNb; attendeeIdx++) {
                            srvData.newAndSaveAttachment('Attendee', attendees[attendeeIdx], meeting);
                        }
                    }
                    srvData.addObjectToSave(meeting.a4p_type, meeting.id.dbid);
                });
            }
        });

    };


}
ctrlAction.$inject = ['$scope', '$q', '$dialog', 'srvData', 'srvNav', 'srvFacet', 'srvConfig', 'srvLocale'];


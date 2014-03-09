'use strict';

/**
 * Meeting pane controller
 *
 * @param $scope
 * @param $dialog
 * @param srvData
 * @param srvConfig
 * @param srvNav
 */
function ctrlMeeting($scope, $dialog, srvData, srvConfig, srvNav, srvLocale, srvAnalytics) {

    /**
     * Injected Services
     */

    $scope.srvData = srvData;
    $scope.srvNav = srvNav;
    $scope.srvConfig = srvConfig;

    /**
     *
     * Members
     */
    $scope.scrollXCoord = 0;
    $scope.meetingSidePanelWidth = 0;
    $scope.hasScroller = false;
    $scope.onePageFormat = true;
    $scope.pageHeight = 320;
    $scope.pageWidth = 240;
    $scope.showMenu = true;
    $scope.updateScrollerTimer = null;

    $scope.meetingSensePanel = null;
    $scope.setMeetingSensePanel = function (sense) {
        $scope.meetingSensePanel = sense;
    };

    /*
     Only Plan objects possess an order attribute named 'pos'.
     A Plan object can possess an ordered list of sub Plan objects (order given by 'pos' attribute of sub Plan objects) : none for the moment.
     A sub Plan object has a Plan as parent while a Plan object has an Event as parent.
     A Plan object possess an unordered list of Plannee objects : only 1 for the moment.
     Only Plannee objects possess a pointer on Document/Note/Report object.
     */
    $scope.plans = [];

    $scope.viewerDocList = [];
    $scope.selectedMeetingPlan = null; // selected Plan object
    $scope.currentMeetingItem = null; // first Document/Note/Report linked to Plan via a Plannee
    $scope.editorType = "Document"; //currently we have only only document editable un editor view

    $scope.modeEdit = false;
    $scope.meetingView = 'meetingSplitView';

    $scope.itemNameEditable = false;
    $scope.isPresentationOn = false;

    $scope.sidePanel = 'partials/meeting/meeting_plan.html';
    $scope.mainPanel = 'partials/meeting/meeting_plan_viewer.html';

    $scope.actionItems = {
        'plan': {
            icon: 'globe',
            side: 'partials/meeting/meeting_plan.html',
            main: 'partials/meeting/meeting_plan_viewer.html'
        },
        'others': {
            icon: 'link',
            side: 'partials/meeting/meeting_linked_object.html',
            main: 'partials/meeting/meeting_object_viewer.html'
        },
        'select': { // Drag & Drop mode
            icon: 'link',
            side: 'partials/meeting/meeting_linked_object.html',
            main: 'partials/meeting/meeting_plan_viewer.html'
        }
    };

    $scope.selectedActionItem = 'plan';
    $scope.actionItem = $scope.actionItems[$scope.selectedActionItem];

    $scope.updateScroller = a4p.throttle(function () {
        var relative = false;
        var timeMs = 500;
        var x = 0;
        var y = 0;

        x = $scope.scrollXCoord;
        console.log('meetingSensePanel scrollTo ' + x);

        if ($scope.meetingSensePanel && $scope.meetingSensePanel.scroll) {
            $scope.meetingSensePanel.scroll.scrollTo(x, y, timeMs, relative);
        }

    }, 200);

    /**
     * Handler called when AngularJS destroy this controller
     */
    $scope.$on('$destroy', function (event) {
        $scope.savePlans();
    });

    /**
     * Handler called when a4p.resize detects a change in window size
     */
    $scope.beforeWindowSizeChanged = function () {
        $scope.windowSizeChanged();

        if ($scope.hasScroller) {
            // Wait at least one frame to update scroller and limit to one call every 200ms
            if ($scope.updateScrollerTimer != null) {
                window.clearTimeout($scope.updateScrollerTimer);
            }
            $scope.updateScrollerTimer = window.setTimeout(function () {
                a4p.safeApply($scope, function () {
                    $scope.updateScroller();
                });
            }, 200);
        }
    };

    /**
     * Helpers
     */

    function promiseDialog(dialogOptions) {
        return $dialog.dialog(dialogOptions).open();
    }

    function openDialog(dialogOptions, onSuccess) {
        a4p.safeApply($scope, function () {
            $dialog.dialog(dialogOptions).open().then(onSuccess);
        });
    }

    /**
     * Functions
     */

    $scope.initMeetingElements = function () {

        //GA: user really interact with meeting, he shows meeting to N attendees
        srvAnalytics.add('Once', 'Meeting Show');
        var attendee = srvData.getTypedDirectLinks($scope.srvNav.item, 'child', 'Attendee');
        if (attendee) srvAnalytics.add('Uses', 'Meeting Show - N',attendee.length);

        $scope.plans = srvData.getTypedDirectLinks($scope.srvNav.item, 'child', 'Plan');
        $scope.plans = $scope.plans.sort(function(planA, planB) {
            // sort numerically by ascending order of position attribute
            return (planA.pos - planB.pos);
        });
        //re-index plans
        for (var i = 0; i < $scope.plans.length; i++) {
            $scope.plans[i].pos = i;
        }

        if ($scope.plans.length == 0) {
            // Create a new default Note when Plan is empty
            var note = {
                'a4p_type' : 'Note',
                'title': srvLocale.translations.htmlFormTitle,
                'description': srvLocale.translations.htmlFormDescription
            };
            var object = $scope.addNewNote(note);
            $scope.addMeetingElement (object);
        }

    };

    $scope.savePlans = function (plans) {
        if (a4p.isUndefinedOrNull(plans)) {
            plans = $scope.plans;
        }
        for (var i = 0; i < plans.length; i++) {
            //re-index plans
            plans[i].pos = i;
            srvData.setAndSaveObject(plans[i]);
            var plannees = srvData.getTypedDirectLinks(plans[i], 'plannee', 'Plannee');
            for (var j = 0; j < plannees.length; j++) {
                srvData.setAndSaveObject(plannees[j]);
            }
            var subPlans = srvData.getTypedDirectLinks(plans[i], 'child', 'Plan');
            subPlans = subPlans.sort(function (planA, planB) {
                // sort numerically by ascending order of position attribute
                return (planA.pos - planB.pos);
            });
            $scope.savePlans(subPlans);
        }
    };

    $scope.windowSizeChanged = function () {
        $scope.onePageFormat = a4p.Resize.resizePortrait; //prefer One column Mode; srvConfig.c4pConfig.phoneFormatIfSmall ? a4p.Resize.resizeOneColumn : a4p.Resize.resizePortrait;
        $scope.pageHeight = a4p.Resize.resizeHeight;
        $scope.pageWidth = a4p.Resize.resizeWidth;
        $scope.hasScroller = $scope.onePageFormat;
    };

    $scope.setModeEdit = function (mode) {
        var oldMode = $scope.modeEdit;
        $scope.modeEdit = mode;
        if (mode == true) {
            // Edit mode means Unlock
            //$scope.modeLock = false;
        }

        if (oldMode && mode == false) {
            //Quit edit mode means save ?
            $scope.srvData.setAndSaveObject($scope.srvNav.item);
        }
    };


    $scope.setMeetingView = function (newView) {
        $scope.meetingView = newView;
    };

    $scope.quitMeetingView = function () {
        // Can not go back if Auth is required
        if ($scope.srvSecurity.isSecured() && $scope.modeLock) {
            $scope.openDialogLocked(function () {
                a4p.safeApply($scope, function () {
                    $scope.savePlans();
                    $scope.setItemAndGoDetail($scope.srvNav.item);
                });
            });
        } else {
            $scope.savePlans();
            $scope.setItemAndGoDetail($scope.srvNav.item);
        }
    };

    /**
     *
     */
    $scope.getContentPanelWidth = function () {
        return  ($scope.hasScroller ? $scope.pageWidth : ($scope.pageWidth * 0.6));
    };

    $scope.getSidePanelWidth = function () {
        return  ($scope.hasScroller ? $scope.pageWidth : ($scope.pageWidth * 0.4));
    };

    /**
     *
     * @param event
     */
    $scope.onMeetingScrollMove = function (event) {};

    /**
     *
     * @param event
     */
    $scope.onMeetingScrollEnd = function (event) {};

    /**
     *
     * @param x
     * @param y
     */
    $scope.onMeetingAfterScrollEnd = function (x, y) {
        if ($scope.hasScroller && $scope.meetingSensePanel && $scope.meetingSensePanel.scroll) {
            if ($scope.meetingSensePanel.scroll.x > -(100)) {
                $scope.scrollXCoord = 0;
                a4p.safeApply($scope, function () {
                    $scope.updateScroller();
                });
            }
            else if ($scope.meetingSensePanel.scroll.x < ((100) - $scope.pageWidth)) {
                $scope.scrollXCoord = -$scope.pageWidth;
                a4p.safeApply($scope, function () {
                    $scope.updateScroller();
                });
            }
            else {
                $scope.scrollXCoord = $scope.meetingSensePanel.scroll.x;
            }
        }
    };

    $scope.tapOnLinkedObject = function (item, firstSingleTap) {
        if (firstSingleTap) {
            a4p.safeApply($scope, function () {
                // To let Angular update singleTap status (chevron-right)
            });
            return;
        }
        a4p.safeApply($scope, function () {
            $scope.setActionItem('others', 'side');
            $scope.showDocument(item);
        });
    };

        /**
     *
     * @param type
     * @param part is for onePage format, give the part to update
     */
    $scope.setActionItem = function (type, part) {
        $scope.selectedActionItem = type;
        $scope.actionItem = $scope.actionItems[$scope.selectedActionItem];
        if ($scope.isOnePageFormat())
        {
            if (part == 'side'){
                $scope.sidePanel = $scope.actionItem.side;
            }
            else {
                $scope.sidePanel = $scope.actionItem.main;
            }
        }
        else {
            $scope.sidePanel = $scope.actionItem.side;
            $scope.mainPanel = $scope.actionItem.main;
        }

    };

    /**
     *
     */
    $scope.editMeetingTitle = function () {
        $scope.itemNameEditable = true;
    };

    /**
     *
     * @param value
     */
    $scope.saveItemName = function (value) {

        if (value != "") {
            $scope.itemNameEditable = false;
            $scope.srvNav.item.name = value;
            $scope.srvData.setAndSaveObject($scope.srvNav.item);
        }
        else {
            $scope.itemNameEditable = false;
        }
    };

    /**
     *
     */
    $scope.hideMenuMeeting = function () {
        $scope.showMenu = false;
    };

    /** ******************************************************************************************
     * Add a new Plan at the end of the list
     *
     * @param object Object linked to the new Plan via a Plannee object
     */
    $scope.addMeetingElement = function (object) {
        var plan = srvData.createObject('Plan', {
            parent_id: $scope.srvNav.item.id,
            title: srvLocale.translations.htmlMeetingNoTitle
        });
        plan.pos = $scope.plans.length;
        srvData.addObject(plan);
        $scope.plans.push(plan);
        if (a4p.isDefinedAndNotNull(object)) {
            // TODO : object must abide c4p.Model restrictions : object type must be Document/Note/Report
            plan.title = srvConfig.getItemName(object);
            srvData.newAttachment('Plannee', object, plan);
        }
    };

    /**
     * Add a new Plan just after current meeting object selected if any or at the end of the list
     *
     * @param object Object linked to the new Plan via a Plannee object
     */
    $scope.insertAfterMeetingElement = function (object) {
        var plan = srvData.createObject('Plan', {
            parent_id: $scope.srvNav.item.id,
            title: srvLocale.translations.htmlMeetingNoTitle
        });
        if (($scope.plans.length == 0) || ($scope.selectedMeetingPlan == null)) {
            plan.pos = $scope.plans.length;
            srvData.addObject(plan);
            $scope.plans.push(plan);
        } else {
            plan.pos = $scope.selectedMeetingPlan.pos + 1;
            srvData.addObject(plan);
            $scope.plans.splice(plan.pos, 0, plan);
            //re-index other plans
            for (var i = plan.pos+1; i < $scope.plans.length; i++) {
                $scope.plans[i].pos = i;
            }
        }
        if (a4p.isDefinedAndNotNull(object)) {
            // TODO : object must abide c4p.Model restrictions : object type must be Document/Note/Report
            plan.title = srvConfig.getItemName(object);
            srvData.newAttachment('Plannee', object, plan);
        }
    };

    $scope.moveMeetingElement = function (plans, old_index, new_index) {
        if ((old_index >= 0) && (old_index < plans.length)) {
            var plan = plans.splice(old_index, 1)[0];
            // Do not update new_index, because we WANT to insert after it if move down
            // if (new_index > old_index) {
                // Move down, i.e. AFTER new_index object
            //} else {
                // Move up, i.e. BEFORE new_index object
            //}
            if ((new_index >= 0) && (new_index < plans.length)) {
                plans.splice(new_index, 0, plan);
            } else {
                plans.push(plan);
            }
            //re-index elements
            for (var i = 0; i < plans.length; i++) {
                plans[i].pos = i;
            }
        }
    };

    $scope.removeMeetingElement = function (plans, index) {
        if ((index >= 0) && (index < plans.length)) {
            var plan = plans.splice(index, 1)[0];
            srvData.removeAndSaveObject(plan);// Save now because we do not save removed object upon QUIT
            //re-index elements
            for (var i = index; i < plans.length; i++) {
                plans[i].pos = i;
            }
        }
    };

    /** ******************************************************************************************
     *
     * @param index
     * index 0 is up
     */
    $scope.moveUpMeetingElement = function (index) {
        if (index <= 0) {
            return
        }
        $scope.moveMeetingElement($scope.plans, index, index - 1);
    };

    /** ******************************************************************************************
     *
     * @param index
     *       index max is down
     */
    $scope.moveDownMeetingElement = function (index) {
        if (index >= ($scope.plans.length - 1)) {
            return;
        }
        $scope.moveMeetingElement($scope.plans, index, index + 1);
    };

    /**
     *
     * @param val
     */
    $scope.setDragMeetingElementIdx = function (val) {
        $scope.dragMeetingElementIdx = val;
    };

    /** ******************************************************************************************
     *
     */
    $scope.meetingTakePictureObj = function () {
        $scope.doAction('createNewPicture').then(function (obj) {
            a4p.safeApply($scope, function () {
                if (a4p.isDefinedAndNotNull(obj)) {
                    // TODO : obj must abide c4p.Model restrictions : obj type must be Document/Note/Report
                    $scope.selectedMeetingPlan.title = srvConfig.getItemName(obj);
                    srvData.newAttachment('Plannee', obj, $scope.selectedMeetingPlan);
                }
            });
        });

        $scope.updateMeetingObj($scope.selectedMeetingPlan);
    };

    $scope.meetingTakePicture = function () {
        $scope.doAction('createNewPicture');
    };

    /**
     *  Meeting planer
     *
     * @param meetingObj Plan object to select
     */
    $scope.setMeetingObject = function (meetingObj) {

        $scope.selectedMeetingPlan = meetingObj;
        if (a4p.isDefinedAndNotNull(meetingObj)){
            var plannees = srvData.getTypedDirectLinks(meetingObj, 'plannee', 'Plannee');
            // TODO : reference ALL Document/Note/Report attached to this Plan ?
            if (plannees.length > 0) {
                $scope.currentMeetingItem = srvData.getObject(plannees[0].object_id.dbid);
            } else {
                $scope.currentMeetingItem = null;
            }
        }
        else {
            $scope.currentMeetingItem = null;
        }
    };

    /**
     *
     */
    $scope.togglePresentation = function () {
        $scope.isPresentationOn = !$scope.isPresentationOn;

        if ($scope.isPresentationOn) {
            $scope.setViewerDocList();
        }
    };

    /**
     *
     * @returns {*}
     */
    $scope.getMeetingViewMode = function () {
        if ($scope.isPresentationOn) {
            return 'presentation';
        }
        if ($scope.selectedMeetingPlan != null) {
            return 'editor';
        }
        return null;
    };

    /**
     *
     */
    $scope.setViewerDocList = function  () {

        var i;
        $scope.viewerDocList = [];
        for (i=0 ; i < $scope.plans.length; i++ ) {
            var plannees = srvData.getTypedDirectLinks($scope.plans[i], 'plannee', 'Plannee');
            for (j = 0; j < plannees.length; j++) {
                $scope.viewerDocList.push(srvData.getObject(plannees[j].object_id.dbid));
            }
            // TODO : add recursive Plans (view code in savePlans() for example) ?
        }
        //function in ctrlViewer scope
        $scope.setDocumentList($scope.viewerDocList);
    };

    /**
     *
     * @param newMeetingObject
     */
    $scope.updateMeetingObj = function (newMeetingObject) {

        if ($scope.selectedMeetingPlan != null) {
            a4p.safeApply($scope, function() {
                $scope.setMeetingObject(null);
            });
        }

        a4p.safeApply($scope, function() {
            $scope.setMeetingObject(newMeetingObject);
        });
    };

    /**
     *
     */
    $scope.windowSizeChanged();
    $scope.initMeetingElements();

    $scope.setObjectLinkNav = function (newMeetingObject) {
        if ($scope.selectedMeetingPlan == null)
        {
            $scope.setActionItem('others', 'side');
        }
        else {
            $scope.setActionItem('select', 'side');
        }
    }



}
ctrlMeeting.$inject = ['$scope', '$dialog', 'srvData', 'srvConfig', 'srvNav', 'srvLocale', 'srvAnalytics'];

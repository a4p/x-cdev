'use strict';

function ctrlGoToMeetingDialog($scope, item, version, srvData, srvNav, srvLink, srvLocale, srvConfig, srvAnalytics, $modalInstance) {
    /**
     * Variables
     */
    $scope.item = item;
    $scope.itemName = srvConfig.getItemName(item);
    $scope.relatedEvents = [];
    $scope.selectedEvent = null;
    $scope.srvLocale = srvLocale;

    /**
     * Functions
     */
    $scope.init = function () {
        if(a4p.isDefinedAndNotNull(srvNav.itemRelatedList.Event)) {
            for(var i = 0, nbEvent = srvNav.itemRelatedList.Event.length; i < nbEvent; i++) {
                $scope.relatedEvents.push(srvNav.itemRelatedList.Event[i].item);
            }
            $scope.selectedEvent = $scope.relatedEvents[0];
        }
    };

    $scope.createNewMeeting = function(linkItem) {
        // create a "on fly" meeting
        var meeting = srvData.createObject('Event', {name:srvLocale.translations.htmlTextDefaultEventName});
        srvData.addAndSaveObject(meeting);

        //GA: user really interact with creation
        srvAnalytics.add('Once', 'Create Meeting');

        if (a4p.isDefinedAndNotNull(linkItem)){
            var linkType = linkItem.a4p_type;
            var newLinkList = [linkItem];
            var linkName = '';
            if(linkType == 'Contact') linkName = 'attended';// MANY link : Event -> Attendee (-> Contact)
            else if (linkType == 'Account') linkName = 'affected';// ONE link : Event -> Account
            else if (linkType == 'Opportunity') linkName = 'affected';// ONE link : Event -> Opportunity
            else if (linkType == 'Document') linkName = 'attached';// MANY link : Event -> Document
            srvLink.linkObjectsToItem(linkType, linkName, newLinkList, meeting);
        }

        $modalInstance.close(meeting);
    };

    $scope.gotoMeeting = function() {
        $modalInstance.close($scope.selectedEvent);
    };

    $scope.close = function () {
        console.log('ctrlGoToMeetingDialog : close');
        $modalInstance.dismiss();
    };

    /**
     * Initialization
     */
    $scope.init();
}
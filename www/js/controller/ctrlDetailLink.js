'use strict';

function ctrlDetailLink($scope, srvData, srvLocale, srvNav) {

    $scope.item = null;
    $scope.linkName = '';

    $scope.init = function (obj) {
        $scope.item = obj;
        // Link name : not the real link name, but the most important one
        $scope.linkName = srvLocale.translations.htmlTitle[obj.a4p_type];
        if (srvNav.item && (obj.a4p_type == "Contact")) {
            if (srvNav.item.a4p_type == "Contact") {
                if (srvNav.item.manager_id.dbid == obj.id.dbid) {
                    $scope.linkName = srvLocale.translations.htmlTextManager;
                } else if (obj.manager_id.dbid == srvNav.item.id.dbid) {
                    $scope.linkName = srvLocale.translations.htmlTextTeam;
                }
            } else if (srvNav.item.a4p_type == "Event") {
                if (srvData.getAttachment('Attendee', obj, srvNav.item)) {
                    $scope.linkName = srvLocale.translations.htmlTextAttendee;
                }
            }
        }
   	};
}
ctrlDetailLink.$inject = ['$scope', 'srvData', 'srvLocale', 'srvNav'];


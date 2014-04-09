'use strict';

function ctrlTimeline($scope, srvData, srvLocale, srvConfig, srvNav, objectItem, $modalInstance, $filter) {

    /**********************************************************
     *
     * 				CONSTANTS DECLARATION START
     *
     *********************************************************/
    $scope.objectName = srvConfig.getItemName(objectItem);

    /**********************************************************
     *
     * 				CONSTANTS DECLARATION END
     *
     *********************************************************/

    $scope.close = function () {
        $modalInstance.dismiss();
    };

    $scope.buildTimelineData = function(){

        var dataObject = {};
        if (!objectItem) return dataObject;

        var main_headline = $scope.objectName;
        var main_descr = c4p.Model.getItemHtmlDescription(objectItem);
        var main_thumb_url = objectItem.thumb_url;

        var dates = [];

        if(a4p.isTrueOrNonEmpty(objectItem.created_date) && (objectItem.a4p_type != 'Event')) {
            var itemCreated = {
                'startDate': $filter('date')(a4pDateParse(objectItem.created_date).getTime(), 'yyyy, MM, dd'),
                'headline':$scope.objectName,
                'text':c4p.Model.getItemHtmlDescription(objectItem)
            };

            dates.push(itemCreated);
        }

        //TODO: Object relations

        if(objectItem.a4p_type == 'Event') {
            var event = {
                'startDate':  $filter('date')(a4pDateParse(objectItem.date_start).getTime(), 'yyyy, MM, dd, HH, mm, ss'),
                'endDate':  $filter('date')(a4pDateParse(objectItem.date_end).getTime(), 'yyyy, MM, dd, HH, mm, ss'),
                'headline':objectItem.name,
                'text':objectItem.description
            };

            dates.push(event);
        }

        var timeline = {
            "headline":main_headline,
            "type":"default",
            "text":main_descr,
            "asset": { "media":main_thumb_url},
            "date": dates
        };

        dataObject = {"timeline": timeline};

        return dataObject;
    };
}
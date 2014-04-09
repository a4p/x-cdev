'use strict';

/**
 * Data Transfer Service, which send data via HTTP requests.
 */
var SrvDataTransfer = (function() {
    function Service(deferService, httpService, $rootScope) {
        this.defer = deferService;
        this.http = httpService;
        this.rootScope = $rootScope;
    }

    /**
     * Transfer data to a server at url with POST method.
     *
     * Example of params = {
     *     transactionId:transactionId,
     *     sendmail:false,
     *     user_email:email,
     *     object_id:eventId
     *     fileName:'photoName.jpg',
     *     fileType:'jpg',
     *     fileWsid:'1',
     *     filesNames:'photoName.jpg',
     *     filesTypes:'jpg',
     *     filesWsids:'1'
     * }
     *
     * @param url
     * @param params
     * @param headers
     * @param timeout in milliseconds
     * @return promise
     */
    Service.prototype.sendData = function (url, params, headers, timeout) {
        if ((typeof(url) == 'undefined') || (url == null)) {
            throw new Error('send requires a url parameter');
        }
        if (typeof(params) == 'undefined') params = null;
        //if (typeof(data) == 'undefined') data = null;
        if (typeof(headers) == 'undefined') headers = null;
        if (typeof(timeout) == 'undefined') timeout = null;// in milliseconds

        var self = this,
            deferred = this.defer.defer(),
            promise = deferred.promise;
        // IOS cache POST requests ... we DO NOT WANT that => we add a time param which change each time
        if (params == null) params = {};
        if ((typeof(params['time']) == 'undefined') || (params['time'] == null)) {
            params['time'] = new Date().getTime();
        }
        if ((typeof(params['cache']) == 'undefined') || (params['cache'] == null)) {
            params['cache'] = false;
        }
        // if we need to JSONify a data objet : data = $.param(data);
        if (headers != null) {
            if ((typeof(headers['Content-Type']) == 'undefined') || (headers['Content-Type'] == null)) {
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
            }
        } else {
            headers = {};
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }

        var fctOnHttpSuccess = function (response) {
            //response.data, response.status, response.headers
            a4p.safeApply(self.rootScope, function() {
                deferred.resolve(response);
            });
        };
        var fctOnHttpError = function (response) {
            //response.data, response.status, response.headers
            var msg = 'Data upload failure (status=' + response.status + ') : ' + response.data;
            a4p.safeApply(self.rootScope, function() {
                a4p.ErrorLog.log('srvDataTransfer', msg);
                deferred.reject({data:msg, status:'error'});
            });
        };
        // TODO : correct this BAD JSON encoding
        //var serverUpdatesValues = a4p.Json.object2String({fifo:'', feedback:feedbackValue, device:deviceValue }); ;
        //var encodedServerUpdatesValues = encodeURIComponent(serverUpdatesValues);
        //var encodedEmail = encodeURIComponent(userEmail);
        //var encodedPassword = encodeURIComponent(userPassword);
        //urlData = {
        //    method:'GET',
        //    url:this.srvConfig.c4pUrlData + '?login=' + encodedEmail
        //        + '&password=' + encodedPassword + '&serverUpdates=' + encodedServerUpdatesValues + '&force=true&fmt=JSON'
        //};
        /*
        var urlData = {
            method:'POST',
            url:url,
            headers:headers,
            data:$.param(params)
        };
        */
        var urlData = {
            method:'POST',
            url:url,
            headers:headers,
            data:a4p.Json.uriEncode(params)
        };
        //a4p.InternalLog.log('srvDataTransfer', '$.param(params)=' + $.param(params) + ' AND a4p.Json.uriEncode(params)=' + a4p.Json.uriEncode(params));
        /*
        var urlData = {
            method:'POST',
            url:url,
            headers:headers,
            params:params
        };
        */
        if (timeout != null) urlData.timeout = timeout;
        a4p.InternalLog.log('srvDataTransfer', 'Data uploading to ' + url);
        //this.http(urlData).then(fctOnHttpSuccess, fctOnHttpError);
        a4p.promiseWakeup(this.rootScope, this.http(urlData), fctOnHttpSuccess, fctOnHttpError);
        return promise;
    };

    /**
     * Transfer data to a server at url with GET method.
     *
     * @param url
     * @param timeout in milliseconds
     * @return promise
     */
    Service.prototype.recvData = function (url, timeout) {
        if ((typeof(url) == 'undefined') || (url == null)) {
            throw new Error('send requires a url parameter');
        }
        if (typeof(timeout) == 'undefined') timeout = null;// in milliseconds

        var self = this,
            deferred = this.defer.defer(),
            promise = deferred.promise;
        var fctOnHttpSuccess = function (response) {
            //response.data, response.status, response.headers
            a4p.safeApply(self.rootScope, function() {
                deferred.resolve(response);
            });
        };
        var fctOnHttpError = function (response) {
            //response.data, response.status, response.headers
            var msg = 'Data download failure : response='
                + a4pDumpData(response.data, 3) + ' (status=' + response.status + ')';
            a4p.safeApply(self.rootScope, function() {
                a4p.ErrorLog.log('srvDataTransfer', msg);
                deferred.reject({data:msg, status:'error'});
            });
        };
        var urlData = {
            method:'GET',
            url:url
        };
        if (timeout != null) urlData.timeout = timeout;
        a4p.InternalLog.log('srvDataTransfer', 'Data downloading from ' + url);
        //this.http(urlData).then(fctOnHttpSuccess, fctOnHttpError);
        a4p.promiseWakeup(this.rootScope, this.http(urlData), fctOnHttpSuccess, fctOnHttpError);
        return promise;
    };

    return Service;
})();

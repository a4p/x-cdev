'use strict';

var SrvModel = (function () {


    function Service() {
        this.model = c4p.Model;

        Service.prototype.getObjectTypeColor = function (objectType) {
            return this.model.a4p_types[objectType].colorType;
        }
    }


    return Service;
})();
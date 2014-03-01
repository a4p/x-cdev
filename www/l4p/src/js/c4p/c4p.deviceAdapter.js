(function(){          
 	//SingletonFactory
	c4pDeviceAdapter = {
     	GetInstance : function(){
        if(DeviceAdapter.instance == null)
         	return new DeviceAdapter();           
        else
            return DeviceAdapter.instance;
        }
	};

    //Private Class
    function DeviceAdapter(){}
		
		
		
    //    DeviceAdapter.instance = this;
    //    $(window).resize( function(){
    //    });
	    
})();



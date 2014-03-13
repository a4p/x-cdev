function Bridge()
{
	// Does nothing
}


Bridge.prototype.setUrl = function(url,email,appId,right)
{
    a4p.InternalLog.log('bridge.js','setUrl');
    if (!window.device) return;
    if (window.device.platform === "Android") {
		cordova.exec(null, null, "Bridge", "setUrl", [url,email,appId,right]);
	}
};

Bridge.prototype.getUrl = function(email,success,fail)
{
    a4p.InternalLog.log('bridge.js','getUrl');
    if (!window.device) {
        return null;
    }
	if (window.device.platform === "Android") {
        a4p.InternalLog.log('bridge.js','exec getUrl');
		return cordova.exec(success,fail, "Bridge", "getUrl", [email]);
	} else {
        return null;
    }
};

if(!window.plugins)
{
	window.plugins = {
	};
}
window.plugins.bridge = new Bridge();
//return window.plugins.bridge;
/*
Bridge.install = function()
{
	if(!window.plugins)
	{
		window.plugins = {
		};
	}
	window.plugins.bridge = new Bridge();
	return window.plugins.bridge;
};
*/

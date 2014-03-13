(function() {
	var appCache = window.applicationCache;
	if (a4p.isUndefined(appCache) || appCache.status === appCache.UNCACHED) {
		return false;
	}
	appCache.update();
	appCache.addEventListener('updateready', function(e) {

		if (appCache.status == window.applicationCache.UPDATEREADY) {
			 if (window.confirm('A new version of this site is available. Load it ?')) {
				// window.location.reload();
				 appCache.swapCache();
                 // Reload
                 var form = document.createElement("form");
                 form.setAttribute("method", 'POST');
                 form.setAttribute("action", window.location.href);
                 /*
                 for (var key in params) {
                     if (!params.hasOwnProperty(key)) continue;
                     var hiddenField = document.createElement("input");
                     hiddenField.setAttribute("type", "hidden");
                     hiddenField.setAttribute("name", key);
                     hiddenField.setAttribute("value", params[key]);
                     form.appendChild(hiddenField);
                 }
                 */
                 document.body.appendChild(form);
                 form.submit();
			 }
		}
	});
})();

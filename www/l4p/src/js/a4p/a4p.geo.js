
/**
 * Geolocation - Begin
 */

var geo_code;
var geo_city;

//Get the latitude and the longitude;
var geo_success = function(position) {
    var lat = position.coords.latitude;
    var lng = position.coords.longitude;
    geo_codeLatLng(lat, lng);
};

var geo_error = function(){
    a4p.ErrorLog.log('geo_error',"Geocoder failed");
};

var geo_codeLatLng = function(lat, lng) {

    var latlng = new google.maps.LatLng(lat, lng);
    geo_code.geocode({'latLng': latlng}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
          a4p.InternalLog.log('geo_codeLatLng',results);
        if (results[1]) {
         //formatted address
            a4p.InternalLog.log('geo_codeLatLng',results[0].formatted_address);
         geo_city = results[0].formatted_address;
        //find country name
             for (var i=0; i< results[0].address_components.length; i++) {
            for (var b=0;b<results[0].address_components[i].types.length;b++) {

            //there are different types that might hold a city admin_area_lvl_1 usually does in come cases looking for sublocality type will be more appropriate
                if (results[0].address_components[i].types[b] == "administrative_area_level_1") {
                    //this is the object you are looking for
                    city= results[0].address_components[i];
                    break;
                }
            }
        }
        //city data
            a4p.InternalLog.log('geo_codeLatLng',city.short_name + " " + city.long_name);
        //return city.short_name;
        //geo_city = city.short_name;
        geo_city = '<?php print Lang::_t("(near)",$current_user);?> '+geo_city;
        var option = new Option(geo_city, geo_city, true, true);
        $('#rdv-header-location').append(option);
        $('#rdv-header-location').val(option);


        } else {
            a4p.InternalLog.log('geo_codeLatLng',"Geocoder No results found");
        }
      } else {
          a4p.InternalLog.log('geo_codeLatLng',"Geocoder failed due to: " + status);
      }
    });
};

var loadLocation = function () {

	geo_code = new google.maps.Geocoder();

	  if (navigator.geolocation) {
	    navigator.geolocation.getCurrentPosition(geo_success, geo_error);
		}
};


/**
 * Geolocation - End
 */


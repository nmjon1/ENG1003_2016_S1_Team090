
// Returns a date in the format "YYYY-MM-DD".
Date.prototype.simpleDateString = function() {
    function pad(value)
    {
        return ("0" + value).slice(-2);
    }

    var dateString = this.getFullYear() + "-" + 
            pad(this.getMonth() + 1, 2) + '-' + 
            pad(this.getDate(), 2);
    
    return dateString;
};

// Date format required by forecast.io API.
// We always represent a date with a time of midday,
// so our choice of day isn't susceptible to time zone errors.
Date.prototype.forecastDateString = function() {
    return this.simpleDateString() + "T12:00:00";
};


// Code for LocationWeatherCache class and other shared code.

// Prefix to use for Local Storage.  You may change this.
var APP_PREFIX = "weatherApp";

function LocationWeatherCache()
{
    // Private attributes:

    var locations = [];
    var callbacks = {};
    var me = this;

    // Public methods:
    
    // Returns the number of locations stored in the cache.
    //
    this.length = function() {
        return locations.length
    };
    
    // Returns the location object for a given index.
    // Indexes begin at zero.
    //
    this.locationAtIndex = function(index) {
        return locations[index]
    };

    // Given a latitude, longitude and nickname, this method saves a 
    // new location into the cache.  It will have an empty 'forecasts'
    // property.  Returns the index of the added location.
    //
    this.addLocation = function(latitude, longitude, nickname)
    {
        var index = indexForLocation(latitude,longitude);

        if (index == null) {
            locations.push({
                nickname: nickname,
                latitude: latitude,
                longitude: longitude,
                forecasts: {}
            });
            saveLocations()
            return locations.length - 1
        } else {
            return index;
        }
    };

    // Removes the saved location at the given index.
    // 
    this.removeLocationAtIndex = function(index)
    {
        locations.splice(index, 1);
        saveLocations();
    };

    this.removeAllLocations = function() {
        locations.splice(0,locations.length);
        saveLocations()
    };

    // This method is used by JSON.stringify() to serialise this class.
    // Note that the callbacks attribute is only meaningful while there 
    // are active web service requests and so doesn't need to be saved.
    //
    this.toJSON = function() {
        var json = [];
        for (var i = 0; i < locations.length; i++) {
            json.push(JSON.stringify(locations[i]))
        }

        return JSON.stringify(json)
    };

    // Given a public-data-only version of the class (such as from
    // local storage), this method will initialise the current
    // instance to match that version.
    //
    this.initialiseFromPDO = function(locationWeatherCachePDO) {
        var json_list = JSON.parse(locationWeatherCachePDO);
        for (var i = 0; i < json_list.length; i++) {
            var location = JSON.parse(json_list[i]);
            locations.push(location)
        }
    };

    // Request weather for the location at the given index for the
    // specified date.  'date' should be JavaScript Date instance.
    //
    // This method doesn't return anything, but rather calls the 
    // callback function when the weather object is available. This
    // might be immediately or after some indeterminate amount of time.
    // The callback function should have two parameters.  The first
    // will be the index of the location and the second will be the 
    // weather object for that location.
    // 
    this.getWeatherAtIndexForDate = function(index, date, callback) {
        var APIKEY = 'b0d9cfc6e50e108064070318f45d3254';

        var location = this.locationAtIndex(index);
        var forecast_key = String(location.latitude) + ','
            + String(location.longitude) + ','
            + date.forecastDateString();
        var forecast;

        callbacks[forecast_key] = callback;

        if (location.forecasts.hasOwnProperty(forecast_key)) {
            callback(index, location.forecasts[forecast_key])
        } else {
            // Get it from the API
            var script = document.createElement("script");
            script.src = 'https://api.forecast.io/forecast/'
                + APIKEY + '/'
                + forecast_key
                + '?callback=locationWeatherCache.weatherResponse'
                + '&exclude=hourly,minutely,currently';
            document.body.appendChild(script);
        }


    };
    
    // This is a callback function passed to forecast.io API calls.
    // This will be called via JSONP when the API call is loaded.
    //
    // This should invoke the recorded callback function for that
    // weather request.
    //


    this.weatherResponse = function(response) {
        var today =  response.daily.data[0];
        var index = indexForLocation(response.latitude,response.longitude);
        var location = this.locationAtIndex(index);
        var date = new Date(today.time * 1000);
        var forecast_key = String(response.latitude) + ','
            + String(response.longitude) + ','
            + date.forecastDateString();
        location.forecasts[forecast_key] = today;
        saveLocations();

        var callback = callbacks[forecast_key];
        callback(index,today)

    };


    // Private methods:
    
    // Given a latitude and longitude, this method looks through all
    // the stored locations and returns the index of the location with
    // matching latitude and longitude if one exists, otherwise it
    // returns -1.
    //
    function indexForLocation(latitude, longitude)
    {
        for (var i = 0; i < locations.length; i++ ){
            var location = me.locationAtIndex(i);
            if (location.latitude == latitude && location.longitude == longitude){
                return i
            }
        }
    }
}

// Restore the singleton locationWeatherCache from Local Storage.
//

var locationWeatherCache = new LocationWeatherCache;
loadLocations();

function loadLocations()
{
    if (!(localStorage.getItem(APP_PREFIX + '-locations') === null)) {
        var lwc_PDO = localStorage.getItem(APP_PREFIX + '-locations');
        locationWeatherCache.initialiseFromPDO(lwc_PDO);
    }
}

// Save the singleton locationWeatherCache to Local Storage.
//
function saveLocations()
{
    localStorage.setItem(APP_PREFIX + "-locations", locationWeatherCache.toJSON())
}

// Testing stuff

function my_return(index, thing) {return thing}



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

    // We create a variable to store a reference ot this object, so
    // that we can access it from within private functions.
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
        // We check if this location is already stored.
        // indexForLocation returns null if it is not.
        var index = indexForLocation(latitude,longitude);

        // If the location isn't stored, we add it.
        if (index == null) {
            locations.push({
                nickname: nickname,
                latitude: latitude,
                longitude: longitude,
                forecasts: {}
            });

            // We must save the locations to local storage every
            // time we make a change.
            saveLocations();

            return locations.length - 1

        } else {
            // If the location is already stored, we return its
            // index.
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

    // Removes every stored location.
    // Mostly for testing, can't be accessed from the user interface.
    this.removeAllLocations = function() {
        locations.splice(0,locations.length);
        saveLocations()
    };

    // This method is used by JSON.stringify() to serialise this class.
    // Note that the callbacks attribute is only meaningful while there 
    // are active web service requests and so doesn't need to be saved.
    //
    this.toJSON = function() {

        // Creates an array to store the strinfigied locations.
        var json = [];

        // We loops through every location, stringifying and storing.
        for (var i = 0; i < locations.length; i++) {
            json.push(JSON.stringify(locations[i]))
        }

        // Stringifies the collection of stringified locations.
        return JSON.stringify(json)
    };

    // Given a public-data-only version of the class (such as from
    // local storage), this method will initialise the current
    // instance to match that version.
    //
    this.initialiseFromPDO = function(locationWeatherCachePDO) {

        // Gets the list of stringified locations.
        var json_list = JSON.parse(locationWeatherCachePDO);

        // Loops through the locations and parses them, then
        // pushes to the location list.
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

        // This API key is the one linked to the team's account.
        var APIKEY = 'b0d9cfc6e50e108064070318f45d3254';

        // We get the location for the given index and build the
        // forecast key, this is used to store forecasts in each
        // location object, as well as callback functions in the
        // callback object. We also use it in the API call.
        var location = this.locationAtIndex(index);
        var forecast_key = String(location.latitude) + ','
            + String(location.longitude) + ','
            + date.forecastDateString();

        // We initialise a variable to store the forecast info.
        var forecast;

        // We store the callback function, in case we need to use
        // it later on. This will be needed if the forecast isn't
        // already cached.
        callbacks[forecast_key] = callback;

        // If we have the forecast stored, we run the callback
        // function here. Otherwise, we get it from the API.
        if (location.forecasts.hasOwnProperty(forecast_key)) {
            callback(index, location.forecasts[forecast_key])
        } else {
            // We have to build the API call and append it to
            // the HTML document.
            var script = document.createElement("script");
            script.src = 'https://api.forecast.io/forecast/' // The base of the API call
                + APIKEY + '/' // Our API key
                + forecast_key // The forecast key, as built above.
                + '?callback=locationWeatherCache.weatherResponse' // weatherResponse is called by the API when the forecast is ready
                + '&exclude=hourly,minutely,currently' // We exclude information we don't care about to save time and space
                + '&units=ca'; // We set our units to SI
            document.body.appendChild(script);
        }


    };
    
    // This is a callback function passed to forecast.io API calls.
    // This will be called via JSONP when the API call is loaded.
    //
    // This stores the response and invokes the recorded callback
    // function for that weather request.
    //
    this.weatherResponse = function(response) {

        // We get the daily data for the day we care about
        var today =  response.daily.data[0];

        // We gather all the relevant information for storage.
        var index = indexForLocation(response.latitude,response.longitude);
        var location = this.locationAtIndex(index);
        var date = new Date(today.time * 1000); // The time is given in seconds, so we multiply by 1000 to convert to milliseconds.


        // We build forecast key, this is used to store the forecast
        // and get the callback function.
        var forecast_key = String(response.latitude) + ','
            + String(response.longitude) + ','
            + date.forecastDateString();

        // We store the forecast and save  to local storage.
        location.forecasts[forecast_key] = today;
        saveLocations();

        // We run the callback function on the data.
        var callback = callbacks[forecast_key];
        callback(index,today)

    };
    
    
    // Given a nickname, this method looks through all
    // the stored locations and returns the index of the location with a
    // matching nickname if one exists, otherwise it
    // returns null.
    //
    this.indexForNickName = new function(nickname) {
        for (var i = 0; i < locations.length; i++ ){
            var location = me.locationAtIndex(i);
            if (location.nickname == nickname){
                return i
            }
        }
    };


    // Private methods:
    
    // Given a latitude and longitude, this method looks through all
    // the stored locations and returns the index of the location with
    // matching latitude and longitude if one exists, otherwise it
    // returns null.
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
function loadLocations()
{
    // We check that the locations are actually stored, then initialise.
    if (!(localStorage.getItem(APP_PREFIX + '-locations') === null)) {
        var lwc_PDO = localStorage.getItem(APP_PREFIX + '-locations');
        locationWeatherCache.initialiseFromPDO(lwc_PDO);
    }
}

// Save the singleton locationWeatherCache to Local Storage.
// We run this function every time the locations object is changed.
function saveLocations()
{
    // We save the locations object to local storage.
    localStorage.setItem(APP_PREFIX + "-locations", locationWeatherCache.toJSON())
}

// We create the cache and attempt to load data from local storage.
var locationWeatherCache = new LocationWeatherCache;
loadLocations();
// Code for the main app page (locations list).
/* Creat function to get weather data from the cache
    Input: weather index, date
    Output: Weather summary */
init();
function init() 
{
    for(var index=0;index < locationWeatherCache.length();index++) {
    locationWeatherCache.getWeatherAtIndexForDate(index, new Date(), function(index, data){
    var summary = 'Min: ' + fToC(data.temperatureMin) + ', Max: ' + fToC(data.temperatureMax);
    document.getElementById('weather' + index).textContent = summary;
    document.getElementById('icon' + index).src = 'images/' + data.icon + '.png';
    });
   }
}
// This is sample code to demonstrate navigation.
// You need not use it for final app.

function viewLocation(locationName)
{
    // Save the desired location to local storage
    localStorage.setItem(APP_PREFIX + "-selectedLocation", locationName); 
    // And load the view location page.
    location.href = 'viewlocation.html';
}

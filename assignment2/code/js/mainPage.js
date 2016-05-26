// Code for the main app page (locations list).
// Create an event listener that waits until the DOM is loaded, when the event occurs, the function init is called.
document.addEventListener("DOMContentLoaded", init);

// Create function to get weather data from the cache.
// Input: Location index, date
// Output: Weather summary
function init() 
{
    for(var index=0;index < locationWeatherCache.length();index++) {
        locationWeatherCache.getWeatherAtIndexForDate(index, new Date(), function(index, data){
        var summary = 'Min: ' + data.temperatureMin + ', Max: ' + data.temperatureMax;
        // Displaying weather summary
        document.getElementById('weather' + index).textContent = summary; 
        // Displaying weather icon
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

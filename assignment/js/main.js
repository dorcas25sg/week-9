/** ---------------
Routing and Leaflet Draw

Build an application that meets the following specifications
  - The user should click on a Leaflet draw marker button and add a marker to the map
  - When the user adds a second marker, an AJAX request is set to Mapzen's optimized_route
    function. Add the shape of this route to the map. Hide the draw marker button and show the
    "Reset Map" button.
  - When the user clicks "Reset Map", the state should be reset to its original values and all
    markers and route should be removed from the map. Show the draw marker button and hide the
    "Reset Map" button.

Here is a video of what this would look like: http://g.recordit.co/5pTMukE3PR.gif

## Using the Mapzen optimized_route API

To get the route between your two markers, you will need to make an AJAX call to the Mapzen
optimized_route API. The text you send to the API should be formatted like this:

https://matrix.mapzen.com/optimized_route?json={"locations":[{"lat":40.042072,"lon":-76.306572},{"lat":39.992115,"lon":-76.781559}],"costing":"auto","directions_options":{"units":"miles"}}&api_key=mapzen-xxxxxxx

First, try to copy and paste that URL into your browser. You'll get an error about not having a
valid key. You will need to replace mapzen-xxxxxxx with a key you generate at https://mapzen.com/dashboard

Once you are using your key, you should get a response back from the server.

## Decoding the route
The part of the response we need for drawing the route is the shape property. Unfortunately, it's in
a format we can't use directly. It will be a string that looks something like this:

`ee~jkApakppCmPjB}TfCuaBbQa|@lJsd@dF|Dl~@pBfb@t@bQ?tEOtEe@vCs@xBuEfNkGdPMl@oNl^eFxMyLrZoDlJ{JhW}JxWuEjL]z@mJlUeAhC}Tzi@kAv`...

Note that the file `decode.js` is included, which introduces a function `decode`. If you pass the
shape string to the `decode` function, it will return an array of points in [lat, lng] format.

To plot these on the map, write a function to convert them to GeoJSON. Take a look at what GeoJSON
for a line looks like (you may want to create a line on geojson.io as an example). How can you
convert the array of points into the GeoJSON format? Hint: GeoJSON defines points as [lng, lat]
instead of [lat, lng], so you may need to flip your coordinates.

---------------- */

/** ---------------
State

- `count` should increase by one each time you add a new marker.
  This will help you figure out how many markers you have added
- `marker1` should be set to the leaflet layer that is created when
  you add your first marker
- `marker2` should be set to the leaflet layer that is created when
  you add your second marker
- `line` should be set to the leaflet layer of the route.

Keeping track of `marker1`, `marker2`, and `line` will help us remove
them from the map when we need to reset the map.
---------------- */

var state = {
  count: 0,
  marker1: undefined,
  marker2: undefined,
  line: undefined,
};

/** ---------------
Map configuration
---------------- */

var map = L.map('map', {
  center: [42.378, -71.103],
  zoom: 14
});

var Stamen_TonerLite = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: 'abcd',
}).addTo(map);

/** ---------------
Leaflet Draw configuration
---------------- */

var drawControl = new L.Control.Draw({
  draw: {
    polyline: false,
    polygon: false,
    circle: false,
    marker: true,
    rectangle: false,
  }
});

map.addControl(drawControl);

/** ---------------
Reset application

Sets all of the state back to default values and removes both markers and the line from map. If you
write the rest of your application with this in mind, you won't need to make any changes to this
function. That being said, you are welcome to make changes if it helps.
---------------- */

var resetApplication = function() {
  state.count = 0;
  map.removeLayer(state.marker1);
  state.marker1 = undefined;
  map.removeLayer(state.marker2);
  state.marker2 = undefined;
  map.removeLayer(state.line);
  state.line = undefined;
  $('#button-reset').hide();
    $('.leaflet-draw').show();
};

$('#button-reset').click(resetApplication);

/** ---------------
On draw

Leaflet Draw runs every time a marker is added to the map. When this happens
---------------- */

map.on('draw:created', function (e) {
  var type = e.layerType; // The type of shape
  var layer = e.layer; // The Leaflet layer for the shape
  var id = L.stamp(layer); // The unique Leaflet ID for the

  state.count++; //i++ per click
  console.log(state.count);

  if (state.count===1) {
    state.marker1 = layer.addTo(map);
    console.log(state.marker1._latlng.lat, state.marker1._latlng.lng);
  } else if (state.count===2) {
    state.marker2 = layer.addTo(map);
    console.log(state.marker2._latlng.lat, state.marker2._latlng.lng);

      var routing = {
        "locations":[{"lat":state.marker1._latlng.lat,"lon":state.marker1._latlng.lng},
        {"lat":state.marker2._latlng.lat,"lon":state.marker2._latlng.lng}],
        "costing":"auto", "directions_options":{"units":"miles"}};

      var routeString = JSON.stringify(routing);
      console.log(routeString);

      var optiResult = "https://matrix.mapzen.com/optimized_route?json=" + routeString + "&api_key=mapzen-RbHXgXe";
      console.log(optiResult);

      $.ajax(optiResult).done(function(data){
        var routePoints = decode(data.trip.legs[0].shape);
        var decodedData = decode(data.trip.legs[0].shape);
        console.log(decodedData);

        //Might need to reverse order of coordinates for Leaflet. In this case, not necessary.
        var coordinates = _.map(decodedData, function(d) {
          return ([d[0], d[1]]);
        });

        // Use Leaflet's polyline function to create a layer out of an array of coordinates. Add it to the map.
        var myRoute = L.polyline(coordinates, {color: 'tomato'});
        state.line = myRoute.addTo(map);
        console.log(state.line);
        });

      $('#button-reset').show();
      $('.leaflet-draw').hide();

  } else {
    console.log("This should not be happening!");
  }

});

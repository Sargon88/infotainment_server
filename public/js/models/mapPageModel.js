var MapPageModel = function(params, status){
	var self = this;
	console.log("MapPageModel");
	self.page = ko.observable("MapPageModel");

	self.params = params;
    mapboxgl.accessToken = 'pk.eyJ1Ijoic2FyZ29uODgiLCJhIjoiY2s3Yng4czJlMGg3MTNxbXJzd2lwZzU1eSJ9.iA5gn1tYn_TjSSRqGFCAsg';
    self.map = null;
    self.htmlGeoMsg = ko.observable("");
    self.latitude = null;
    self.longitude = null;

    self.getLocation = function() {
      if (navigator.geolocation) {
      	navigator.geolocation.getCurrentPosition(self.manageGeolocation);
      } else {
        self.errorMsg("Geolocation is not supported by this browser.");
      }
    };

    self.manageGeolocation = function(position){
    	console.log(position.coords.latitude, position.coords.longitude);
    	self.latitude = position.coords.latitude;
    	self.longitude = position.coords.longitude;
    }

    self.initMap = function() {

    	var lat = infoViewModel.status.latitude();
    	var lon = infoViewModel.status.longitude();

    	if(!lat){
    		lat = self.latitude;
    	}

    	if(!lon){
    		lon = self.longitude;
    	}

    	
    	self.map = new mapboxgl.Map({
			container: 'mapid',
			style: 'mapbox://styles/mapbox/streets-v11',
			center: [lon, lat],
			zoom: 15
		});

		self.map.addControl(new mapboxgl.NavigationControl());

		self.map.addControl(
			new MapboxDirections({
				accessToken: mapboxgl.accessToken
			}),
			'top-left'
		);  

		self.map.addControl(
			new mapboxgl.GeolocateControl({
				positionOptions: {
					enableHighAccuracy: true
				},
				trackUserLocation: true
			})
		);

		self.map.on("load", function () {
			/* Image: An image is loaded and added to the map. */
			self.map.loadImage("https://i.imgur.com/MK4NUzI.png", function(error, image) {
				if (error) throw error;
				self.map.addImage("custom-marker", image);
				/* Style layer: A style layer ties together the source and image and specifies how they are displayed on the map. */
				self.map.addLayer({
					id: "markers",
					type: "symbol",
					/* Source: A data source specifies the geographic coordinate where the image marker gets placed. */
					source: {
						type: "geojson",
						data: {
							type: 'FeatureCollection',
							features: [
								{
									type: 'Feature',
									properties: {},
									geometry: {
										type: "Point",
										coordinates: [lat, lon]
									}
								}
							]
						}
					},
					layout: {
						"icon-image": "custom-marker",
					}
				});
			});
		});

    }


    setInterval(self.getLocation(), 500);
    setTimeout(function(){return self.initMap()}, 500);
}
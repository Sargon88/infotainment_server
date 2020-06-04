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
    self.followUser = true;

    navigator.geolocation.getCurrentPosition = function(callback){
    	console.log("OK!!!!!", callback);
    }

    self.getLocation = function() {
      if (navigator.geolocation) {
      	navigator.geolocation.getCurrentPosition(self.manageGeolocation);
      } else {
        self.errorMsg("Geolocation is not supported by this browser.");
      }
    };

    self.manageGeolocation = function(position){
    	self.latitude = position.coords.latitude;
    	self.longitude = position.coords.longitude;
    }

    self.initMap = function() {

    	var lat = infoViewModel.status.latitude();
    	var lon = infoViewModel.status.longitude();
    	
    	console.log("LAT: " + lat + " - LON: " + lon);

    	self.map = new mapboxgl.Map({
			container: 'mapid',
			style: 'mapbox://styles/mapbox/streets-v11',
			center: [lon, lat],
			zoom: 15
		});

		//naviator
		self.map.addControl(new mapboxgl.NavigationControl());

		self.position = new mapboxgl.Marker()
			  .setLngLat([lon, lat])
			  .addTo(self.map);

		self.map.on('load', function(){
			

			//directions
/*			self.map.addControl(
				new MapboxDirections({
					accessToken: mapboxgl.accessToken
				}),
				'top-left'
			);  
*/			

			//update marker position
			/*	
			setInterval(function(){

				var lat = infoViewModel.status.latitude();
		    	var lon = infoViewModel.status.longitude();

		    	if(!lat){
		    		lat = self.latitude;
		    	}

		    	if(!lon){
		    		lon = self.longitude;
		    	}

		    	var coordinates = [lon,lat];
				self.position.setLngLat(coordinates);

				if(self.followUser){
					self.map.flyTo({ center: coordinates });	
				}
				

			}, 500);  
			*/
		});

		self.map.on('dragstart', function(){
			self.followUser = false;
		});

		self.map.on('dblclick', function(){
			self.followUser = !self.followUser;
			self.map.setZoom(15);
		})
    }

    //setInterval(function(){ return self.getLocation()}, 500);
    setTimeout(function(){return self.initMap()}, 500);
}
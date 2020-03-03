var MapPageModel = function(params, status){
	var self = this;
	console.log("MapPageModel");
	self.page = ko.observable("MapPageModel");

	self.params = params;
    self.mapboxgl.accessToken = 'pk.eyJ1Ijoic2FyZ29uODgiLCJhIjoiY2s3Yng4czJlMGg3MTNxbXJzd2lwZzU1eSJ9.iA5gn1tYn_TjSSRqGFCAsg';
    self.map = null;

    self.getLocation = function() {
      if (navigator.geolocation) {
      	setTimeout(navigator.geolocation.getCurrentPosition(showPosition), 1000);
      } else {
        self.errorMsg("Geolocation is not supported by this browser.");
      }
    };

    function showPosition(position) {
        htmlGeoMsg = "Latitude: " + position.coords.latitude + "<br>Longitude: " + position.coords.longitude;

    	self.map = new mapboxgl.Map({
			container: 'mapid',
			style: 'mapbox://styles/mapbox/streets-v11',
			center: [],
			zoom: 13
		});
		 
		self.map.addControl(
			new MapboxDirections({
			accessToken: mapboxgl.accessToken
			}),
			'top-left'
		);  
    }

    
	

    
}
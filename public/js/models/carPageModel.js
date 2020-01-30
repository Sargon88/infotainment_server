var CarPageModel = function(params, status){
	var self = this;
	console.log("CarPageModel");
	self.page = ko.observable("CarPageModel");
	
	self.params = params;

	self.lastUpdate = ko.observable(new Date());
	self.test = ko.observable("NULLA");

	self.params.socket.on('updateObdUI', function(msg){
		self.lastUpdate(new Date());
		self.test(JSON.tringify(msg));
	});

}
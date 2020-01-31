var CarPageModel = function(params, status){
	var self = this;
	console.log("CarPageModel");
	self.page = ko.observable("CarPageModel");
	
	self.params = params;

	self.lastUpdate = ko.observable(new Date());
	self.test = ko.observable("NULLA");
	self.error = ko.observableArray();
	self.errorBkp = [];
	self.debug = ko.observableArray();
	self.debugBkp = [];

	self.params.socket.on('updateObdUI', function(msg){
		self.lastUpdate(new Date());
		self.test(JSON.stringify(msg));

	}).on('obdDebug', function(msg){
		self.lastUpdate(new Date());
		self.debugBkp.push(msg);
		self.debug([]);

		for(var i = self.debugBkp.length-1, i < 5, i-- ){
			self.debug().push(self.debugBkp[i]);
		}

	}).on('obdError', function(msg){
		self.lastUpdate(new Date());
		self.errorBkp.push(msg);
		self.error([]);

		for(var i = self.debugBkp.length-1, i < 5, i-- ){
			self.error().push(self.debugBkp[i]);
		}

	});

}
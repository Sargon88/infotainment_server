var CarPageModel = function(params, status){
	var self = this;
	console.log("CarPageModel");
	self.page = ko.observable("CarPageModel");
	
	self.params = params;

	self.lastUpdate = ko.observable(new Date());
	self.test = ko.observable("TEST");
	self.OBDMessages = ko.observableArray();
	self.error = ko.observableArray();
	self.errorBkp = [];
	self.debug = ko.observableArray();
	self.debugBkp = [];

	self.params.socket.on('updateObdUI', function(msg){
		self.lastUpdate(new Date());
		if(msg){
			var m = JSON.parse(msg);
			self.test(msg);	

			var temp = self.OBDMessages();
			var oldItem = self.OBDMessages.remove(function(item){return item.name === m.name;});
			self.OBDMessages.push(m);
			self.OBDMessages.sort();

			self.OBDMessages.sort(function (left, right) {
		        return left.name === right.name ? 0
		             : left.name < right.name ? -1
		             : 1;
		    });
		
			console.log(self.OBDMessages());
		}

	}).on('obdDebug', function(msg){
		self.lastUpdate(new Date());
		self.debugBkp.push(msg);

		manageMessages(self.debug, self.debugBkp);

	}).on('obdError', function(msg){
		self.lastUpdate(new Date());
		self.errorBkp.push(msg);
		
		manageMessages(self.error, self.errorBkp);

		console.log(self.error());

	}).on('obdFullData', function(msg){
		console.log(msg);

		if(msg){
			self.debugBkp = msg.debug;
			self.errorBkp = msg.error;
			self.lastUpdate(new Date());
		}

		manageMessages(self.debug, self.debugBkp);
		manageMessages(self.error, self.errorBkp);

	});

	self.params.socket.emit("refreshUI");

	/** Private Functions **/
	var manageMessages = function(msgArray, bkpArray){
		msgArray([]);

		for(var i = 0; i < 5; i++){
			msgArray.push(bkpArray[bkpArray.length-(i+1)]);
		}	
		
	}

}
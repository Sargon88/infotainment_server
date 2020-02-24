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
		console.log("UPDATE");
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

	self.initGauges = function(){
		var opts = {
			angle: -0.2, // The span of the gauge arc
			lineWidth: 0.2, // The line thickness
			radiusScale: 1, // Relative radius
			pointer: {
			length: 0.6, // // Relative to gauge radius
			strokeWidth: 0.035, // The thickness
			color: '#000000' // Fill color
			},
			limitMax: 200,     // If false, max value increases automatically if value > maxValue
			limitMin: 0,     // If true, the min value of the gauge will be fixed
			colorStart: '#6FADCF',   // Colors
			colorStop: '#8FC0DA',    // just experiment with them
			strokeColor: '#E0E0E0',  // to see which ones work best for you
			generateGradient: true,
			highDpiSupport: true,     // High resolution support

		};
		var target = document.getElementById('graphsArea'); // your canvas element
		var gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
		gauge.maxValue = 3000; // set max gauge value
		gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
		gauge.animationSpeed = 32; // set animation speed (32 is default value)
		if(self.OBDMessages()["vss"] && self.OBDMessages()["vss"].value){
			gauge.set(self.OBDMessages()["vss"].value); // set actual value
		} else {
			gauge.set(0);
		}
		
	}

	setTimeout(function(){ return self.initGauges()}, 100);

}
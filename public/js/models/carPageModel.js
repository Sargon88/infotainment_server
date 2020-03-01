var CarPageModel = function(params, status){
	var self = this;
	console.log("CarPageModel");
	self.page = ko.observable("CarPageModel");
	
	self.params = params;

	self.lastUpdate = ko.observable(new Date());
	self.OBDMessages = ko.observableArray();
	self.error = ko.observableArray();
	self.errorBkp = [];
	self.debug = ko.observableArray();
	self.debugBkp = [];
	self.vssGauge = null;
	self.rpmGauge = null;
	self.bgClass = ko.observable("dashboardBg");
	self.vssLimit = ko.observable(140);

	var vssopts = {
		angle: -0.15, // The span of the gauge arc
		lineWidth: 0.16, // The line thickness
		radiusScale: 1, // Relative radius
		pointer: {
			length: 0.51, // // Relative to gauge radius
			strokeWidth: 0.042, // The thickness
			color: '#1e90ff' // Fill color
		},
		limitMax: true,     // If false, max value increases automatically if value > maxValue
		limitMin: true,     // If true, the min value of the gauge will be fixed
		colorStart: '#6FADCF',   // Colors
		colorStop: '#8FC0DA',    // just experiment with them
		strokeColor: '#E0E0E0',  // to see which ones work best for you
		generateGradient: false,
		highDpiSupport: true,     // High resolution support
		staticZones: [
			{strokeStyle: "rgba(30, 144, 255, 0.05)", min: 0, max: 70},
			{strokeStyle: "rgba(30, 144, 255, 0.2)", min: 70, max: 140},
			{strokeStyle: "rgba(30, 144, 255, 0.9)", min: 140, max: 200},
		],
	};

	var rpmopts = {
		angle: -0.15, // The span of the gauge arc
		lineWidth: 0.16, // The line thickness
		radiusScale: 1, // Relative radius
		pointer: {
			length: 0.51, // // Relative to gauge radius
			strokeWidth: 0.042, // The thickness
			color: '#1e90ff' // Fill color
		},
		limitMax: true,     // If false, max value increases automatically if value > maxValue
		limitMin: true,     // If true, the min value of the gauge will be fixed
		colorStart: 'rgba(30, 144, 255, 0.05)',   // Colors
		colorStop: 'rgba(30, 144, 255, 0.3)',    // just experiment with them
		strokeColor: 'rgba(30, 144, 255, 0.05)',  // to see which ones work best for you
		generateGradient: true,
		highDpiSupport: true,     // High resolution support
	};



	self.params.socket.on('updateObdUI', function(msg){
		self.lastUpdate(new Date());
		if(msg){
			var m = JSON.parse(msg);

			var temp = self.OBDMessages();
			var oldItem = self.OBDMessages.remove(function(item){return item.name === m.name;});
			self.OBDMessages.push(m);
			self.OBDMessages.sort();

			self.OBDMessages.sort(function (left, right) {
		        return left.name === right.name ? 0
		             : left.name < right.name ? -1
		             : 1;
		    });

		    if(m.name == "vss"){
		    	self.vssGauge.set(m.value); // set actual value
		    	if(m.value > self.vssLimit()){
		    		
		    		vssopts.pointer.color = 'rgba(244, 87, 87, 1)';
		    		vssopts.staticZones = [
						{strokeStyle: "rgba(244, 87, 87, 0.05)", min: 0, max: 70},
						{strokeStyle: "rgba(244, 87, 87, 0.2)", min: 70, max: 140},
						{strokeStyle: "rgba(244, 87, 87, 0.7)", min: 140, max: 200},
					];


		    	} else {

		    		vssopts.pointer.color = '#1e90ff';
		    		vssopts.staticZones = [
						{strokeStyle: "rgba(30, 144, 255, 0.05)", min: 0, max: 70},
						{strokeStyle: "rgba(30, 144, 255, 0.2)", min: 70, max: 140},
						{strokeStyle: "rgba(30, 144, 255, 0.9)", min: 140, max: 200},
					];

		    	}
		    	self.vssGauge.setOptions(vssopts);

		    } else if(m.name == "rpm"){
		    	self.rpmGauge.set(m.value); // set actual value
		    }
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

	self.toggleRightArea = function(){
		console.log("TOGGLE");

		$("#leftPanel").toggleClass("col-xs-12 col-xs-8");
		$("#rightPanel").toggleClass("collapsed col-xs-4");
		$('#graphsNav').toggleClass("collapsed-nav");		
	}

	/** Private Functions **/
	var manageMessages = function(msgArray, bkpArray){
		msgArray([]);

		for(var i = 0; i < 5; i++){
			msgArray.push(bkpArray[bkpArray.length-(i+1)]);
		}	
	}

	self.initGauges = function(){
		/** VSS **/		
		var target = document.getElementById('vss-graph'); // your canvas element
		self.vssGauge = new Gauge(target).setOptions(vssopts); // create sexy gauge!
		self.vssGauge.setTextField(document.getElementById("vss-textfield"));
		self.vssGauge.maxValue = 200; // set max gauge value
		self.vssGauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
		self.vssGauge.animationSpeed = 32; // set animation speed (32 is default value)
		self.vssGauge.set(0);
		
		/** RPM **/
		target = document.getElementById('rpm-graph'); // your canvas element
		self.rpmGauge = new Gauge(target).setOptions(rpmopts); // create sexy gauge!
		self.rpmGauge.setTextField(document.getElementById("rpm-textfield"));
		self.rpmGauge.maxValue = 8000; // set max gauge value
		self.rpmGauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
		self.rpmGauge.animationSpeed = 32; // set animation speed (32 is default value)
		self.rpmGauge.set(0);	
	}

	self.init = function(){
		//self.toggleRightArea();
		self.initGauges();
	}

	setTimeout(function(){ return self.init()}, 100);

}
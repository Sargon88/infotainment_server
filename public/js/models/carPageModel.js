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
	self.maxVss = 200;
	self.maxRpm = 8000;
	self.outVss = ko.observable(false);
	self.outRpm = ko.observable(false);

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



	self.params.socket.on('obdDebug', function(msg){
		self.lastUpdate(new Date());
		self.debugBkp.push(msg);

		manageMessages(self.debug, self.debugBkp);
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
	self.toggleRightArea = function(){
		$("#leftPanel").toggleClass("col-xs-11 col-xs-7");
		$("#rightPanel").toggleClass("collapsed col-xs-4");
		$('#graphsNav').toggleClass("collapsed-nav");		
	}

	self.initGauges = function(){
		/** VSS **/		
		var target = document.getElementById('vss-graph'); // your canvas element
		self.vssGauge = new Gauge(target).setOptions(vssopts); // create sexy gauge!
		self.vssGauge.setTextField(document.getElementById("vss-textfield"));
		self.vssGauge.maxValue = self.maxVss; // set max gauge value
		self.vssGauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
		self.vssGauge.animationSpeed = 32; // set animation speed (32 is default value)
		self.vssGauge.set(0);
		
		/** RPM **/
		target = document.getElementById('rpm-graph'); // your canvas element
		self.rpmGauge = new Gauge(target).setOptions(rpmopts); // create sexy gauge!
		self.rpmGauge.setTextField(document.getElementById("rpm-textfield"));
		self.rpmGauge.maxValue = self.maxRpm; // set max gauge value
		self.rpmGauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
		self.rpmGauge.animationSpeed = 32; // set animation speed (32 is default value)
		self.rpmGauge.set(0);	
	}

	self.addLimit = function(param){

		switch(param){
			case "vss":
				if(infoViewModel.status.vssLimit() + 5 < self.maxVss){
					infoViewModel.status.vssLimit(infoViewModel.status.vssLimit() + 5);
				}
				break;
			case "rpm":
				if(infoViewModel.status.rpmLimit() + 1000 < self.maxRpm){
					infoViewModel.status.rpmLimit(infoViewModel.status.rpmLimit() + 1000);
				}
				break;
			default:
				break;
		}

	}

	self.removeLimit = function(param){
		switch(param){
			case "vss":
				if(infoViewModel.status.vssLimit() - 5 > 0){
					infoViewModel.status.vssLimit(infoViewModel.status.vssLimit() - 5);
				}
				break;
			case "rpm":
				if(infoViewModel.status.rpmLimit() - 1000 > 0){
					infoViewModel.status.rpmLimit(infoViewModel.status.rpmLimit() - 1000);
				}
				break;
			default:
				break;
		}
	}

	self.manageObdMessage = function(m){
		var temp = self.OBDMessages();
		var oldItem = self.OBDMessages.remove(function(item){return item.name === m.name;});
        self.OBDMessages.push(m);
        self.OBDMessages.sort();

        self.OBDMessages.sort(function (left, right) {
            return left.name === right.name ? 0
                 : left.name < right.name ? -1
                 : 1;
        });

        if(m.name == "vss" && self.vssGauge){
            self.vssGauge.set(m.value); // set actual value
            if(m.value > infoViewModel.status.vssLimit()){
                self.outVss(true);
                vssopts.pointer.color = 'rgba(244, 87, 87, 1)';
                vssopts.staticZones = [
                    {strokeStyle: "rgba(244, 87, 87, 0.05)", min: 0, max: 70},
                    {strokeStyle: "rgba(244, 87, 87, 0.2)", min: 70, max: 140},
                    {strokeStyle: "rgba(244, 87, 87, 0.7)", min: 140, max: 200},
                ];


            } else {
                self.outVss(false);
                vssopts.pointer.color = 'rgba(30, 144, 255, 1)';
                vssopts.staticZones = [
                    {strokeStyle: "rgba(30, 144, 255, 0.05)", min: 0, max: 70},
                    {strokeStyle: "rgba(30, 144, 255, 0.2)", min: 70, max: 140},
                    {strokeStyle: "rgba(30, 144, 255, 0.9)", min: 140, max: 200},
                ];

            }
            self.vssGauge.setOptions(vssopts);

        } else if(m.name == "rpm"  && self.rpmGauge){

            self.rpmGauge.set(m.value); // set actual valueù
            if(m.value > infoViewModel.status.rpmLimit()){
                self.outRpm(true);
                rpmopts.pointer.color = 'rgba(244, 87, 87, 1)';
                rpmopts.colorStop = 'rgba(244, 87, 87, 0.3)';
            } else {
                self.outRpm(false);
                rpmopts.pointer.color = 'rgba(30, 144, 255, 1)';
                rpmopts.colorStop = 'rgba(30, 144, 255, 0.3)';
            }
            self.rpmGauge.setOptions(rpmopts);

        }
	}

	self.init = function(){
		//self.toggleRightArea();
		self.initGauges();
	}

	var manageMessages = function(msgArray, bkpArray){
		msgArray([]);

		for(var i = 0; i < 5; i++){
			if(bkpArray && bkpArray.length > 0){
				msgArray.push(bkpArray[bkpArray.length-(i+1)]);
			}
			
		}	
	}

	setTimeout(function(){ return self.init()}, 100);

}
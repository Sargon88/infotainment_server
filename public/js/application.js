var infoViewModel = function(){
    var self = this;

    //context
    self.params = {
        server : "http://infotainment_srv:8080",
        callingendpoint : "/call",
        socket :  io(),
        pages: {
            homepage: "PhonePageModel",
            mapspage: "MapPageModel",
            omxpage: "OmxPageModel",
            ytpage: "YtPageModel",
            ytplaypage: "YtplayPageModel",
            carpage: "CarPageModel",
            ytplaypage: "YtplayPageModel",
        },
    }

    /** PARAMS */
    self.status = {
        //params
        page: ko.observable("home"),
        longitude: ko.observable(),
        latitude: ko.observable(),
        yturl: ko.observable(null),
        lastUsbStatus: ko.observable(),
        newPage: ko.observable(),
        brightness: ko.observable(),
        lastCalls: ko.observableArray(),
        starredContacts: ko.observableArray(),
        lastUpdate: ko.observable(),

        //CHIAMATE
        calling: ko.observable(null),
        inCall: ko.observable(false),
        callId: ko.observable(null),
        callerNum: ko.observable(),//da rimuovere

        //CAR
        vssLimit : ko.observable(140),
        rpmLimit : ko.observable(6000),

        /** NAVBAR */
        navbar: {
            battInt: ko.observable(0),
            wifi: ko.observable(false),
            signal: ko.observable(0),
            obdConnected: ko.observable(false),
            outVss: ko.observable(false),
            compact: ko.observable(false),
            phoneConnected: ko.observable(false)
        }
    };

    /*Application active model*/
    self.model = ko.observable();

    //varies
    self.loaded = ko.observable(false);
    //self.callingUI = ko.observable(null);
    self.callingUI = ko.computed(function(){
        if(self.status.inCall() && self.status.callId()){
            $('#callModal').modal('show');
            return new callViewModel(self.status.callId());
        }
        $('#callModal').modal('hide');

        return null;
    });
    self.compactBar = ko.computed(function(){
        if(self.status.inCall()){
            self.status.navbar.compact(true);
        } else {
            self.status.navbar.compact(false);
        }
    });

    /** FUNCTIONS */
    self.startApp = function(){
        console.log("App Start");
        self.model(new PhonePageModel(self.params, self.status));

        //self.startTime();
        //rivedere
        self.params.socket.emit("getPage", "");
        self.params.socket.emit("getStatus", "");
        //

        self.checkConnection();

        self.params.socket.on('connect', function(){
            self.params.socket.emit("identify", "Raspberry");
        }).on('phone status', function(msg){
            var stat = JSON.parse(msg);
            //console.log("STATUS " + stat.inCall + " - timestamp: " + stat.timestamp + " - lastupdate: " + self.status.lastUpdate());

            if(!self.status.lastUpdate() || stat.timestamp > self.status.lastUpdate()){
                self.status.latitude(stat.latitude);
                self.status.longitude(stat.longitude);

                self.status.navbar.battInt(parseInt(stat.navbar.batt));
                self.status.navbar.wifi(stat.navbar.wifi == 'true');
                self.status.starredContacts(stat.starredContacts.slice(0, 5));
                self.status.navbar.signal(parseInt(stat.navbar.signal));
                self.status.navbar.obdConnected(stat.navbar.obdConnected);
                self.status.navbar.phoneConnected(stat.navbar.phoneConnected);
                
                self.buildLastCall(stat.lastCalls);
                
                self.status.lastUpdate(stat.timestamp);
                self.loaded(true);    
            }
            
        }).on('coordinates', function(msg){

            var stat = JSON.parse(msg);

            self.status.lastUpdate(new Date());
        }).on('DEBUG', function(msg){
            console.log(msg);
        }).on('set page', function(msg){
            self.loadPage(msg);
        }).on('change page', function(msg){
            self.loadPage(msg);
        }).on('incoming calling', function(msg){
            self.openCallInterface(msg);
        }).on('outgoing calling', function(msg){
            self.openCallInterface(msg);
        }).on('call end', function(msg){
           setTimeout(self.closeCallInterface, 2000);
        }).on('open yt video', function(msg){
            console.log("OPEN YT Video: " + msg);
            self.changePa
        }).on('youtube url', function(msg){
            console.log("youtube url: " + msg);
            self.ytUrl(msg);
        }).on('url history', function(msg){
            console.log("URL HISTORY");
            self.loadYtHistory(msg); 
        }).on('updateObdUI', function(msg){
            self.status.lastUpdate(new Date());
            if(msg){
                var m = JSON.parse(msg);

                if(self.model().page() == "CarPageModel"){ //active page = carpage
                    self.model().manageObdMessage(m);
                }

                if(m.name == "vss"){
                    self.status.navbar.outVss(m.value > self.status.vssLimit());
                }
                
                
            }
        }).on('obdError', function(msg){

            if(self.model().page() == "CarPageModel"){ //active page = carpage
                self.model().errorBkp.push(msg);
                self.model().manageMessages(self.error, self.errorBkp);
                console.log(self.error());
            }

            //update status bar
            self.status.navbar.obdConnected(false);   
        }).on('obdConnected', function(msg){

            //update status bar
            self.status.navbar.obdConnected(true);
        });
    };

    /*Page management*/
    self.changePage = function(page){
        console.log("Change Page: " + page);
        self.params.socket.emit("change page", page);
    }
    self.loadPage = function(msg){
        var msgObj = JSON.parse(msg);

        if(msgObj.msg == "home"){
            self.model(new PhonePageModel(self.params, self.status));            
        } else if(msgObj.msg == "yt"){
            self.model(new YtPageModel(self.params, self.status));
        } else if(msgObj.msg == "map"){
            self.model(new MapPageModel(self.params, self.status));
        } else if(msgObj.msg == "car"){
            self.model(new CarPageModel(self.params, self.status));
        } else if(msgObj.msg == "omx"){
            self.model(new OmxPageModel(self.params, self.status));
        }  else if(msgObj.msg == "ytPlay"){
            self.model(new YtplayPageModel(self.params, self.status));
        }
        self.status.page(msg);
    }
    /*Page management*/

    /*Bar functions */
    self.turnoff = function(){
        console.log("REBOOT");
        self.params.socket.emit('reboot', "");
    }

    self.changeBrightness = function(){
        
        if(self.status.brightness == 100){
            self.status.brightness = 10;
        } else if(self.status.brightness == 10){
            self.status.brightness = 100;
        } 

        self.params.socket.emit('brightness', self.status.brightness);
    }
    /*Bar functions */

    self.buildLastCall = function(lastcalls){

        var tempLastCall = $.map(lastcalls, function(call){
            var c = new callModel(call);
            return c;
        });

        self.status.lastCalls(tempLastCall);
    }


    /** Calls */
    self.openCallInterface = function(callerId){
        console.log("toggleCallInterface");
        var endpoint = self.params.server + self.params.callingendpoint;
        //self.callingUI(new callViewModel());  
        var cIdObj = JSON.parse(callerId);
        if(callerId.msg){
            self.status.callId(callerId.msg);        
            self.status.inCall(true);     
        }
    }

    self.closeCallInterface = function(){
        console.log("toggleCallInterface");     
        self.status.inCall(false);
    }

    /** YOUTUBE */
    self.ytUrlHistory = ko.observableArray([]);

    self.loadYtHistory = function(data){
        console.log("loadYtHistory: " + data);

        var dataObj = JSON.parse(data);
        var urls = dataObj.urls;

        self.model().ytUrlHistory(urls);
    }

    self.playYoutubeVideo = function(data){
        var msg = JSON.stringify(data);

        self.params.socket.emit("open yt video", msg);
    }
    /** FINE YOUTUBE */

    /** Utility */
    /*
    self.startTime = function(){
        var today = new Date();
        var h = today.getHours();
        var m = today.getMinutes();
        m = self.checkTime(m);
        var t = setTimeout(self.startTime, 500);
    }

    self.checkTime = function(i){
        if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
        return i;
    }
    */

    self.checkConnection = function(){

        setInterval(function(){            
            if(((new Date() - self.status.lastUpdate()) / 1000) > 30){
                self.loaded(false);
                self.resetInterface();
            }

        }, 10000);
    }

    self.resetInterface = function(){
        self.status.navbar.battInt(0);
        self.status.navbar.wifi(false);
        self.status.starredContacts.removeAll();
        self.status.lastCalls.removeAll();
        self.status.navbar.obdConnected(false);
        self.status.navbar.phoneConnected(false);
        self.status.vssLimit(140);
        self.status.rpmLimit(6000);
        self.status.navbar.outVss(false);
        self.status.navbar.compact(false);
        self.status.calling(null);
    }

    self.extend = function(){
        var val = !self.status.navbar.compact();
        self.status.navbar.compact(val);

        setTimeout(function(){
            var val = !self.status.navbar.compact();
            self.status.navbar.compact(val);
        }, 10000);
    }

    //LAST
    self.startApp();
}

var infoViewModel = new infoViewModel();
ko.applyBindings(infoViewModel);


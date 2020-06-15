var infoViewModel = function(){
    var self = this;

    //DEBUG
    self.lat = ko.observable();
    self.long = ko.observable();
    //DEBUG

    //context
    self.params = {
        server : "http://infotainment_srv:8080",
        callingendpoint : "/call",
        socket :  io(),
    }

    /** PARAMS */
    self.status = {
        //params
        page: ko.observable("home"),
        longitude: ko.observable(),
        latitude: ko.observable(),
        callerNum: ko.observable(),
        yturl: ko.observable(),
        lastUsbStatus: ko.observable(),
        newPage: ko.observable(),
        brightness: ko.observable(),
        lastCalls: ko.observableArray(),
        starredContacts: ko.observableArray(),
        lastUpdate: ko.observable(new Date()),

        //CHIAMATE
        calling: ko.observable(false),
        inCall: ko.observable(false),

        //CAR
        vssLimit : ko.observable(140),
        rpmLimit : ko.observable(6000),

        /** NAVBAR */
        navbar: {
            battInt: ko.observable(0),
            wifi: ko.observable(false),
            signal: ko.observable(0),
            obdError: ko.observable(false),
            obdConnected: ko.observable(false),
            outVss: ko.observable(false),
            compact: ko.observable(false),
        }
    };

    /*Application active model*/
    self.model = ko.observable();

    //pages
    self.homepage = ko.observable("PhonePageModel");
    self.mapspage = ko.observable("MapPageModel");
    self.omxpage = ko.observable("OmxPageModel");
    self.ytpage = ko.observable("YtPageModel");
    self.ytplaypage = ko.observable("YtplayPageModel");
    self.carpage = ko.observable("CarPageModel");

    //varies
    self.loaded = ko.observable(false);
    self.wazeurl = ko.observable("");
    self.callingUI = ko.observable(null);
    self.status.inCall = ko.computed(function(){
        if(self.callingUI() == null){
            return false;
        } else {
            return true;
        }
    });

    //youtube
    self.status.ytUrl = ko.observable(null);

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

            self.lat(stat.latitude);
            self.long(stat.longitude);
            self.status.latitude(stat.latitude);
            self.status.longitude(stat.longitude);

            self.status.navbar.battInt(parseInt(stat.navbar.batt));
            self.status.navbar.wifi(stat.navbar.wifi == 'true');
            self.status.starredContacts(stat.starredContacts.slice(0, 5));
            self.status.navbar.signal(parseInt(stat.navbar.signal));
            self.status.navbar.obdError(stat.navbar.obdError);
            self.status.navbar.obdConnected(stat.navbar.obdConnected);

            self.buildLastCall(stat.lastCalls);
            
            self.status.lastUpdate(new Date());
            self.loaded(true);
        }).on('coordinates', function(msg){

            var stat = JSON.parse(msg);

            self.lat(stat.latitude);
            self.long(stat.longitude);

            self.status.lastUpdate(new Date());
        }).on('DEBUG', function(msg){
            console.log(msg);
        }).on('set page', function(msg){
            self.loadPage(msg);
        }).on('change page', function(msg){
            self.loadPage(msg);
        }).on('incoming calling', function(msg){
            self.openCallInterface();
        }).on('outgoing calling', function(msg){
            self.openCallInterface();
        }).on('call end', function(msg){
           setTimeout(self.closeCallInterface, 2000);
        }).on('open yt video', function(msg){
            console.log("OPEN YT Video: " + msg);
            self.changePage("yt");
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
            self.status.lastUpdate(new Date());

            if(self.model().page() == "CarPageModel"){ //active page = carpage
                self.model().errorBkp.push(msg);
                self.model().manageMessages(self.error, self.errorBkp);
                console.log(self.error());
            }

            //update status bar
            self.status.navbar.obdError(true);
            self.status.navbar.obdConnected(false);       
        }).on('obdConnected', function(msg){
            self.status.lastUpdate(new Date());

            //update status bar
            self.status.navbar.obdError(false);
            self.status.navbar.obdConnected(true);
        });
    };

    /*Page management*/
    self.changePage = function(page){
        console.log("Change Page: " + page);
        self.params.socket.emit("change page", page);
    }
    self.loadPage = function(msg){
        if(msg == "home"){
            self.model(new PhonePageModel(self.params, self.status));
        } else if(msg == "yt"){
            self.model(new YtPageModel(self.params, self.status));
        } else if(msg == "map"){
            self.model(new MapPageModel(self.params, self.status));
        } else if(msg == "car"){
            self.model(new CarPageModel(self.params, self.status));
        } else if(msg == "omx"){
            self.model(new OmxPageModel(self.params, self.status));
        }  else if(msg == "ytPlay"){
            self.model(new YtplayPageModel(self.params, self.status));
        }
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
    self.openCallInterface = function(){
        console.log("toggleCallInterface");
        var endpoint = self.params.server + self.params.callingendpoint;
        self.callingUI(new callViewModel());   
        $('#callModal').modal('toggle');
        console.log("ok");
    }

    self.closeCallInterface = function(){
        console.log("toggleCallInterface");
        if(self.callingUI() != null){
            $('#callModal').modal('toggle');
            self.callingUI(null);
        }        
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
            console.log("RESET? " + ((new Date() - self.status.lastUpdate()) / 1000));
            
            if(((new Date() - self.status.lastUpdate()) / 1000) > 60){
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
        self.status.navbar.obdError(false);
        self.status.navbar.obdConnected(false);
        self.status.vssLimit(140);
        self.status.rpmLimit(6000);
        self.status.navbar.outVss(false);
        self.status.navbar.compact(false);
    }

    self.extend = function(){
        var val = !self.status.navbar.compact();
        self.status.navbar.compact(val);

        setTimeout(function(){
            var val = !self.status.navbar.compact();
            self.status.navbar.compact(val);
        }, 3000);
    }

    //LAST
    self.startApp();
}

var infoViewModel = new infoViewModel();
ko.applyBindings(infoViewModel);


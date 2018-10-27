var infoViewModel = function(){
    var self = this;

    //context
//    self.server = "http://192.168.43.111:8080";
    self.server = "http://infotainment_srv:8080";
    self.callingendpoint = "/call";
    self.socket =  io();

    //navbar
    self.hour = ko.observable();
    self.battInt = ko.observable(0);
    self.batt = ko.observable("--");
    self.bluetooth = ko.observable(false);
    self.wifi = ko.observable(false);
    self.starredContacts = ko.observableArray();
    self.lastCalls = ko.observableArray();
    self.lastUpdate = ko.observable(new Date());
    self.signal = ko.observable(0);
    

    //DEBUG
    self.lat = ko.observable();
    self.long = ko.observable();
    //DEBUG

    //pages
    self.homepage = ko.observable(false);
    self.mapspage = ko.observable(false);
    self.omxpage = ko.observable(false);
    self.ytpage = ko.observable(false);
    self.ytplaypage = ko.observable(false);
    self.carpage = ko.observable(false);

    //varies
    self.loaded = ko.observable(false);
    self.wazeurl = ko.observable("");
    self.callingUI = ko.observable(null);
    self.brightness = 100;
    self.inCall = ko.computed(function(){
        if(self.callingUI() == null){
            return false;
        } else {
            return true;
        }
    });
    self.showAlert = ko.observable(false);
    self.messageAlert = ko.observable("");


    //youtube
    self.ytUrl = ko.observable(null);

    /** FUNCTIONS */
    self.goHomepage = function(){
        console.log("home");
        self.socket.emit("change page", "home");
        //self.changePageHomepage();        
    }

    self.changePageHomepage = function(){
        self.homepage(true);
        self.mapspage(false);
        self.omxpage(false);
        self.ytpage(false);
        self.ytplaypage(false);
        self.carpage(false);
    }

    self.goMaps = function(){
        console.log("maps");
       self.socket.emit("change page", "map");
       //self.changePageMaps();
    
    }

    self.changePageMaps = function(){
        self.homepage(false);
        self.mapspage(true);
        self.omxpage(false);
        self.ytpage(false);
        self.carpage(false);
    }

    self.goOMX = function(){
        console.log("omx");
        self.socket.emit("change page", "omx");
        //self.changePageOMX();
    }

    self.changePageOMX = function(){
        self.homepage(false);
        self.mapspage(false);
        self.omxpage(true);
        self.ytpage(false);
        self.ytplaypage(false);
        self.carpage(false);

        self.loadOmxPage();
    }

    self.goYT = function(){
        console.log("youtube");
        self.socket.emit("change page", "yt");
        self.changePageYT();
    }

    self.changePageYT = function(){
        self.homepage(false);
        self.mapspage(false);
        self.omxpage(false);
        self.ytpage(true);
        self.ytplaypage(false);
        self.carpage(false);

        self.socket.emit('youtube history', '');

    }

    self.goCar = function(){
        console.log("car");
        self.socket.emit("change page", "car");
        //self.changePageCar();
    }

    self.changePageCar = function(){
        self.homepage(false);
        self.mapspage(false);
        self.omxpage(false);
        self.ytpage(false);
        self.ytplaypage(false);
        self.carpage(true);
    }

    self.changePageYTPlay = function(){
        self.homepage(false);
        self.mapspage(false);
        self.omxpage(false);
        self.ytpage(false);
        self.ytplaypage(true);
        self.carpage(false);
    }

    self.startApp = function(){
        console.log("App Start");
        self.startTime();
        self.socket.emit("getPage", "");
        self.socket.emit("getStatus", "");

        self.checkConnection();

        self.socket.on('phone status', function(msg){
            var msgObj = JSON.parse(msg);

            var stat = msgObj;

            if(stat.phonestat != null){
                //retrocompatibilità con infotainment 1
                stat = stat.phonestat;

                self.lat(stat.latitude);
                self.long(stat.longitude);
            }

            var sContacts = stat.starredcontacts;
            var lastCalls = stat.lastcalls;

            self.battInt(parseInt(stat.batt));
            self.batt(stat.batt + "%");
            self.bluetooth(stat.bluetooth == 'true');
            self.wifi(stat.wifi == 'true');
            self.starredContacts(sContacts.slice(0, 8));
            self.loaded(true);
            self.signal(parseInt(stat.signal));

            self.buildLastCall(lastCalls);
            

            var url = "https://embed.waze.com/it/iframe?zoom=16&lat="+stat.latitude+"&lon="+stat.longitude+"&pin=1";
            self.wazeurl(url);  

            self.lastUpdate(new Date());
        });

        self.socket.on('coordinates', function(msg){

            var stat = JSON.parse(msg);

            self.lat(stat.latitude);
            self.long(stat.longitude);

            self.lastUpdate(new Date());
        })

        self.socket.on('DEBUG', function(msg){
            console.log(msg);
        })

        self.socket.on('set page', function(msg){

            console.log("set page: " + msg);

            if(msg == "home"){
                self.changePageHomepage();
            } else if(msg == "yt"){
                self.changePageYT();
            } else if(msg == "map"){
                self.changePageMaps();
            } else if(msg == "car"){
                self.changePageCar();
            } else if(msg == "omx"){
                self.changePageOMX();
            }  else if(msg == "ytPlay"){
                self.changePageYTPlay();
            }

        });

        self.socket.on('change page', function(msg){

            console.log("change page: " + msg);

            if(msg == "home"){
                self.goHomepage();
            } else if(msg == "yt"){
                self.goYT();
            } else if(msg == "map"){
                self.goMaps();
            } else if(msg == "car"){
                self.goCar();
            } else if(msg == "omx"){
                self.goOMX();
            }

        });

        self.socket.on('incoming calling', function(msg){
            self.openCallInterface();
        });

        self.socket.on('outgoing calling', function(msg){
            self.openCallInterface();
        });

        self.socket.on('end call', function(msg){
           setTimeout(self.closeCallInterface, 2000);
            
        });

        self.socket.on('open yt video', function(msg){
            console.log("OPEN YT Video: " + msg);
            self.goYT();
        });

        self.socket.on('youtube url', function(msg){
            console.log("youtube url: " + msg);
            self.ytUrl(msg);
        });

        self.socket.on('url history', function(msg){
            console.log("URL HISTORY");
            self.loadYtHistory(msg);
           
        });

    };

    /** funzioni barra */
    self.turnoff = function(){
        console.log("REBOOT");
        self.socket.emit('reboot', "");
    }

    self.openwifi = function(){
        console.log("Open Wifi");
        self.socket.emit('wifi', "")
    }

    self.changeBrightness = function(){
        
        if(self.brightness == 100){
            self.brightness = 10;
        } else if(self.brightness == 10){
            self.brightness = 100;
        } 

        self.socket.emit('brightness', self.brightness);
    }

    /** Homepage */
    self.openCallInterface = function(){
        console.log("toggleCallInterface");
        self.callingUI(window.open(self.server + self.callingendpoint , "_blank", "toolbar=no,scrollbars=no,resizable=no,top=20,left=200,width=400,height=400"));   
    }

    self.closeCallInterface = function(){
        console.log("toggleCallInterface");
        if(self.callingUI() != null){
            self.callingUI().close();
            self.callingUI(null);
        }        
    }

    self.makeCall = function(data){
        var number;

        if(data.number){
            number = data.number;
        } else if(data.phNumber()){
            number = data.phNumber();
        }

        self.socket.emit("start phone call", number);        
    }

    self.buildLastCall = function(lastcalls){

        var tempLastCall = $.map(lastcalls, function(call){
            var c = new callModel(call);
            return c;
        });

        self.lastCalls(tempLastCall);
    }

    /** OMX */
    self.omxdebug= ko.observable("omxdebug");
    self.path = ko.observableArray([]);
    self.drives = ko.observableArray([]);
    self.directory = ko.observableArray([]);
    self.playingfile = null;
    self.message = ko.observable("");

    self.showDrives = ko.observable(true);
    self.showPlaylists = ko.observable(false);
    self.selectedPlaylist = ko.observable();
    self.playlistsList = ko.observableArray([]);
    
    self.loadOmxPage = function(){

        if(self.path.lenght > 0){

            self.socket.emit("explore directory", self.stringPath());

        } else {
            self.socket.emit("load omx", "");

            self.socket.on('loaded omx page', function(msg){
                if(msg != ""){
                    var driveArray = JSON.parse(msg);

                    self.drives(self.loadDrive(driveArray));
                    self.message("");

                } else {
                    self.drives([]);
                    self.message("Nessuna periferica connessa");
                }               

            });
        }
    }

    self.loadDrive = function(driveArray){

        var tempDrives = $.map(driveArray, function(drive){
            var d = new fileModel(drive, self.selectedPlaylist);
            return d;
        });

        return tempDrives;

    }

    self.openDrive = function(data){
        console.log("Open Drive");

        self.path.removeAll();
        self.exploreDirectory(data);    
    }

    self.exploreDirectory = function(data){
        console.log("Explore Directory: " + ko.toJSON(data));

        self.path.push(data.name());

        self.socket.emit("explore directory", self.stringPath());    

    }

    self.backPath = function(){
        if(self.path().length > 0){
            self.path.pop();

            self.socket.emit("explore directory", self.stringPath()); 
        }
    }

    self.stringPath =ko.computed(function(){
        var path = self.path().join();
        path = path.replace(/[, ]+/g, "").trim()

        return path;
    });

    self.socket.on('explore response', function(msg){
        console.log('explore response: ' + msg);

        if(msg != ""){
            var driveArray = JSON.parse(msg);

            self.directory(self.loadDrive(driveArray));
        } else {
            self.drives(["La directory è vuota"]);
        }

    });

    self.playFile = function(data){
        if(self.playingfile == null){
            self.playingfile = data;
            self.socket.emit("play file", self.stringPath()+data.name());
        }
        

    }

    self.socket.on('started playing', function(){
        self.playingfile.playing(true);
    });

    self.stopFile = function(data){     
        self.socket.emit("stop file", self.stringPath()+data.name());

    }

    self.socket.on('stopped playing', function(){
        self.playingfile.playing(false);
        self.playingfile = null;
    });

    self.changeDrivePlaylists = function(){
        self.showDrives(!self.showDrives());
        self.showPlaylists(!self.showPlaylists());
    }

    self.addtoPlaylist = function(data){
        console.log("path: " + self.stringPath());
        console.log("name: " + data.name());
        var file = self.stringPath() + data.name();
        console.log("file: " + file);
        self.selectedPlaylist().files.push(file);
        
    }

    self.removeFromPlaylist = function(data){
        self.selectedPlaylist().files.remove(data.name());
    }

    self.socket.on('loaded playlist dir', function(msg){

        var listArray = JSON.parse(msg);

        var playlistsListTemp = $.map(listArray, function(playlist){
            var d = new playlistModel(playlist);
            return d;
        });

        self.playlistsList(playlistsListTemp);

        self.selectedPlaylist(self.playlistsList()[0]);

    });

    self.selectPlaylist = function(data){
        self.selectedPlaylist(data);

        if(data.files().length == 0){
            self.loadPlaylistFiles(data);
        }
    }

    self.savePlaylist = function(data){
        
        var msg = ko.toJSON(data);
        self.socket.emit('save playlist', msg);
    }

    self.deletePlaylist = function(data){
        data.files([]);

        self.savePlaylist(data);

    }

    self.loadPlaylistFiles = function(data){
        self.socket.emit('load playlist', data.name());
    }

    self.socket.on('load playlist data', function(msg){
        var playlistObj = JSON.parse(msg);

        var index = self.playlistsList.indexOf(playlistObj);

        self.playlistsList()[index].files(msg.files);
    });

    /** FINE OMX */

    /** YOUTUBE */
    self.ytUrlHistory = ko.observableArray([]);

    self.loadYtHistory = function(data){
        console.log("loadYtHistory: " + data);

        var dataObj = JSON.parse(data);
        var urls = dataObj.urls;

        self.ytUrlHistory(urls);

    }

    self.playYoutubeVideo = function(data){
        var msg = JSON.stringify(data);

        self.socket.emit("open yt video", msg);
    }
    /** FINE YOUTUBE */

    /** Utility */
    self.startTime = function(){
        var today = new Date();
        var h = today.getHours();
        var m = today.getMinutes();
        m = self.checkTime(m);

        self.hour(h + ":" + m);
        var t = setTimeout(self.startTime, 500);
    }

    self.checkTime = function(i){
        if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
        return i;
    }

    self.checkConnection = function(){

        setInterval(function(){
            console.log("RESET? " + ((new Date() - self.lastUpdate()) / 1000));
            
            if(((new Date() - self.lastUpdate()) / 1000) > 60){
                self.loaded(false);
                self.resetInterface();
            }

        }, 10000);

    }

    self.resetInterface = function(){
        self.battInt(0);
        self.batt("--");
        self.bluetooth(false);
        self.wifi(false);
        self.starredContacts.removeAll();
        self.lastCalls.removeAll();
    }

    //LAST
    self.startApp();
}

var infoViewModel = new infoViewModel();
ko.applyBindings(infoViewModel);


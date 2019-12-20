var OmxPageModel = function(params, status){
	var self = this;
	console.log("OmxPageModel");
	self.page = ko.observable("OmxPageModel");

	self.params = params;

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
    
    /** EVENTS **/
	/*
    self.params.socket.on('explore response', function(msg){
        console.log('explore response: ' + msg);

        if(msg != ""){
            var driveArray = JSON.parse(msg);

            self.directory(self.loadDrive(driveArray));
        } else {
            self.drives(["La directory è vuota"]);
        }
    }).on('started playing', function(){
        self.playingfile.playing(true);
    }).on('stopped playing', function(){
        self.playingfile.playing(false);
        self.playingfile = null;
    }).on('loaded playlist dir', function(msg){

        var listArray = JSON.parse(msg);

        var playlistsListTemp = $.map(listArray, function(playlist){
            var d = new playlistModel(playlist);
            return d;
        });

        self.playlistsList(playlistsListTemp);

        self.selectedPlaylist(self.playlistsList()[0]);
    }).on('load playlist data', function(msg){
        var playlistObj = JSON.parse(msg);

        var index = self.playlistsList.indexOf(playlistObj);

        self.playlistsList()[index].files(msg.files);
    }).on('loaded omx page', function(msg){
        if(msg != ""){
            var driveArray = JSON.parse(msg);

            self.drives(self.loadDrive(driveArray));
            self.message("");

        } else {
            self.drives([]);
            self.message("Nessuna periferica connessa");
        }               
    });
    */

    /** FUNCTIONS **/
    self.loadOmxPage = function(){
        /*
        if(self.path.lenght > 0){

            self.params.socket.emit("explore directory", self.stringPath());

        } else {
            self.params.socket.emit("load omx", "");
        }
        */

        //NEW https://demos.shieldui.com/web/treeview/api     
        setTimeout(function(){
                $("#treeview").shieldTreeView({                
                    dataSource: dataSrc,
                    events: {
                        focus: function (e) {
                            console.log("focus");
                        },
                        blur: function (e) {
                            console.log("blur");
                        },
                        expand: function (e) {
                            console.log("expanding node " + this.getPath(e.element));
                        },
                        collapse: function (e) {
                            console.log("collapsing node " + this.getPath(e.element));
                        },
                        select: function (e) {
                            console.log("selecting node " + this.getPath(e.element));
                        },
                        change: function (e) {
                            console.log("changed selection to " + this.getPath(e.element));
                        },
                        check: function (e) {
                            console.log((e.checked ? "" : "un") + "checked node " + this.getPath(e.element));
                        },
                        drop: function (e) {
                            console.log("dropping node " + this.getPath(e.sourceNode) + " over node " + this.getPath(e.targetNode));
                        }
                    }
                });
        }, 500);

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

        self.params.socket.emit("explore directory", self.stringPath());    
    }

    self.backPath = function(){
        if(self.path().length > 0){
            self.path.pop();

            self.params.socket.emit("explore directory", self.stringPath()); 
        }
    }

    self.stringPath = ko.computed(function(){
        var path = self.path().join();
        path = path.replace(/[,]+/g, "").trim()

        return path;
    });

    self.playFile = function(data){
        if(self.playingfile == null){
            self.playingfile = data;
            self.params.socket.emit("play file", self.stringPath()+data.name());
        }
    }

    self.stopFile = function(data){     
        self.params.socket.emit("stop file", self.stringPath()+data.name());
    }

    self.changeDrivePlaylists = function(type){
    	if((type == "drives" && !self.showDrives()) ||
    	   (type == "playlists" && !self.showPlaylists())){

    		self.showDrives(!self.showDrives());
        	self.showPlaylists(!self.showPlaylists());	
    	}
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

    self.selectPlaylist = function(data){
        self.selectedPlaylist(data);

        if(data.files().length == 0){
            self.loadPlaylistFiles(data);
        }
    }

    self.savePlaylist = function(data){
        
        var msg = ko.toJSON(data);
        self.params.socket.emit('save playlist', msg);
    }

    self.deletePlaylist = function(data){
        data.files([]);

        self.savePlaylist(data);
    }

    self.loadPlaylistFiles = function(data){
        self.params.socket.emit('load playlist', data.name());
    }
    
    self.loadOmxPage();
}
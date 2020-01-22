var OmxPageModel = function(params, status){
	var self = this;
	console.log("OmxPageModel");
	self.page = ko.observable("OmxPageModel");

	self.params = params;

    self.omxdebug= ko.observable("omxdebug");
    self.path = ko.observableArray([]);
    self.drives = ko.observableArray([]);
    self.directory = ko.observableArray([]);
    self.playingfile = ko.observable("");
    self.message = ko.observable("");

    self.showDrives = ko.observable(true);
    self.showPlaylists = ko.observable(false);
    self.selectedPlaylist = ko.observable();
    self.playlistsList = ko.observableArray([]);
    self.loading = ko.observable(true);
    self.selectedDirectory = ko.observable(null);
    self.playing = ko.observable(false);
    var treeView = null;

    var ds = null;
    var lastTree = "";
    

    /** EVENTS **/
    self.params.socket.on('explore response', function(msg){
        console.log('explore response: ' + msg);

        if(msg != ""){
            var driveArray = JSON.parse(msg);

            self.directory(self.loadDrive(driveArray));
        } else {
            self.drives(["La directory è vuota"]);
        }
    }).on('started playing', function(){
        self.playing(true);
        console.log("PLAYING")
    }).on('stopped playing', function(){
        self.playing(false);
        self.playingfile("");
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
    });

    /** FUNCTIONS **/
    self.loadOmxPage = function(){
        self.params.socket.off('loaded omx page');

        self.loading(true);
        lastTree = "";
        self.loadTreeDataSrc();       
    }

    var treeview = null;
    self.loadTreeDataSrc = function(){
        console.log("loadTreeDataSrc");
        self.params.socket.emit("load omx", "").on('loaded omx page', function(msg){
            console.log("----- MSG -----");
            console.log(msg);          
            console.log("----- MSG -----");

            if(msg !== lastTree){
                console.log("----- TREE -----");
                if(lastTree != ""){console.log(lastTree);}
                console.log("----- TREE -----");
                lastTree = msg;

                ds = new shield.DataSource(JSON.parse(msg));

                console.log(ds);

                //NEW https://demos.shieldui.com/web/treeview/api     
                treeView = $("#treeview").shieldTreeView({
                    readDataSource: false,
                    dataSource: ds,
                    events: {
                    focus: function (e) {
                        console.log("focus");
                    },
                    change: function (e) {
                        console.log("change: ");
                    },
                    expand: function (e) {
                        console.log("expanding");
                    },
                    collapse: function (e) {
                        console.log("collapsing");
                    },
                    select: function (e) {
                        console.log("select");
                        var item = e.item;
                        if(item.items){
                            //directory
                            self.selectedDirectory(item);

                            if(!e.item.expanded && e.item.items.length > 0){
                                treeView.swidget().expanded(true, this.getPath(e.element));
                                e.item.expanded = true;   
                            }
                            

                        } else {
                            //file
                            self.playFile(e.item);
                        }
                    }
                }
                });

                self.loading(false);
                ds.read();

            }

        });
    }


    self.playFile = function(data){
        var path = data.parent + data.text;
        
        self.playingfile(data.text);
        self.params.socket.emit("play file", path);   
    }

    self.stopFile = function(data){     
        self.params.socket.emit("stop file");
    }

    self.volUp = function(){
        self.params.socket.emit("omx command", "volUp");
    }

    self.volDown = function(){
        self.params.socket.emit("omx command", "volDown");
    }

    self.loadOmxPage();
}
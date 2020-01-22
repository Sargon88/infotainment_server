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
    self.loading = ko.observable(true);
    self.playingTitle = ko.observable("");
    
    var ds = null;
    

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
    });

    /** FUNCTIONS **/
    self.loadOmxPage = function(){
        self.params.socket.off('loaded omx page');

        self.loading(true);
        self.loadTreeDataSrc();
        
    }

    var treeview = null;
    self.loadTreeDataSrc = function(){
        console.log("loadTreeDataSrc");
        self.params.socket.emit("load omx", "").on('loaded omx page', function(msg){
            console.log(JSON.parse(msg));          
            
            ds = new shield.DataSource(JSON.parse(msg));

            console.log(ds);

            if(!treeview){
                //NEW https://demos.shieldui.com/web/treeview/api     
                treeview = $("#treeview").shieldTreeView({
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
                        if(item){
                            if(item.items){
                                //directory
                            } else {
                                //file
                                self.playFile(e.item);
                            }    
                        }
                    }
                }
                }).swidget();

               
                self.loading(false);
                ds.read();        

            } else {
                treeview.refresh();
            }
        });
    }


    self.playFile = function(data){
        var path = data.parent + data.text;
        if(self.playingfile == null){
            self.playingfile = path;
            self.params.socket.emit("play file", self.playingfile);
            self.playingTitle(data.text); //DEBUG   
        }
    }

    self.stopFile = function(data){     
        self.params.socket.emit("stop file", self.stringPath()+data.name());
    }

    self.loadOmxPage();
}
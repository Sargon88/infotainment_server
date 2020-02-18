var YtPageModel = function(params, status){
	var self = this;
	console.log("YtPageModel");
	self.page = ko.observable("YtPageModel");
	self.ytUrlHistory = ko.observableArray([]);

	self.params = params;

	self.params.socket.emit('youtube history', '');

    self.playYoutubeVideo = function(data){
    	var msg = JSON.stringify(data);

        self.params.socket.emit("open yt video", msg);
    }
}
var playlistModel = function(name){
    var self = this;

    self.name = ko.observable(name || "Nuova Playlist");
    self.files = ko.observableArray([]);

    self.screenName = ko.computed(function(){
        return self.name() + " (" + self.files().length + ")";
    });
    

}
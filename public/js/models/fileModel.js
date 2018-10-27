var fileModel = function(file, selectedPlaylist){
    var self = this;

    self.name = ko.observable(file.name || file);
    self.type = ko.computed(function(){
        var n = self.name();
        if(n.charAt(n.length-1) == "/"){
            // è una directory
            return "dir";
        } else {
            return "file";
        }
    });
    self.playing = ko.observable(false);

    self.inPlaylist = ko.computed(function(){

        var files = selectedPlaylist().files();
        if(files.indexOf(self.name()) == -1){
            return false;
        } else {
            return true;
        }

    });
    
}
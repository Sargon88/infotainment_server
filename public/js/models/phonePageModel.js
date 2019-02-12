var PhonePageModel = function(params, status){
	var self = this;
    console.log("PhonePageModel");
    self.page = ko.observable("PhonePageModel");
    

	self.params = params;

	self.makeCall = function(data){
        var number;

        if(data.number){
            number = data.number;
        } else if(data.phNumber()){
            number = data.phNumber();
        }

        self.params.socket.emit("start phone call", number);        
    }
}
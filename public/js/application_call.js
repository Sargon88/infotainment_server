var callViewModel = function(){
    var self = this;

    //context
//    self.server = "http://192.168.43.111:8080";
    self.server = "http://infotainment_srv:8080";

    //call state
    self.answered = ko.observable(false);
    self.rejected = ko.observable(false);
    self.ended = ko.observable(false);
    self.calling = ko.computed(function(){
        if(self.answered() && !self.ended()){
            return true;
        } else {
            return false;
        }
    }, this);

    //varies
    self.message = ko.observable("");
    self.callerNumber = ko.observable("");
    self.callerName = ko.observable("");
    self.lastCall = ko.observable("");
    self.photo = ko.observable("");

    //functions
    self.startApp = function(){
        console.log("App Start");
        
        self.message("Chiamata in arrivo");
        self.socket.emit("getCall", "");
        self.socket.emit("omx command", "pause");

        self.socket.on('call answer', function(msg){
            self.answered(true);
            
        });

        self.socket.on('end call', function(msg){
            self.ended(true);
            self.socket.emit("omx command", "pause");
            
        });

        self.socket.on('call data', function(msg){
            console.log(msg);

            var data = JSON.parse(msg);

            if(data != null && data.number != null){
                self.callerNumber(data.number);
            }

            if(data != null && data.name != null && data.name != ""){
                self.callerName(data.name);
            }

            if(data != null && data.type == "out"){
                self.answered(true);
            }
/*
            if(data != null && data.date != null){
                self.lastCall(data.date);
            }

            if(data != null && data.photo != null){

               // var image = new Image();
                //image.src = 'data:image/png;base64,' + data.photo;

                //self.lastCall(data.date);
            }
            */
            
        });

    };

    self.rejectCall = function(){

        var number = self.callerNumber();
        self.socket.emit("end call", JSON.stringify(number));
        self.socket.emit("omx command", "pause");

    }

    self.endCall = function(){

        var number = self.callerNumber();
        self.socket.emit("end call", JSON.stringify(number));
        self.socket.emit("omx command", "pause");

    }

    self.answerCall = function(){

        var number = self.callerNumber();
        self.socket.emit("answer call", JSON.stringify(number));

    }



    self.socket = io();

    //LAST
    self.startApp();
}

/*
var callViewModel = new callViewModel();
ko.applyBindings(callViewModel);
*/

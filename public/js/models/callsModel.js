var callModel = function(call){
    var self = this;

    self.callType = ko.observable(call.callType || null);
    self.phNumber = ko.observable(call.phNumber || "Sconosciuto");
    self.name = ko.observable(call.name || null);
    
    self.callDayTime = ko.computed(function(){
        return moment(call.callDayTime, "MMM DD, YYYY HH:mm:ss", "en").format("DD/MM/YYYY, HH:mm:ss");
    });
}
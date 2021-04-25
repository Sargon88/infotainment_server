var socket = io({
  pingTimeout: 30000,
  transports: ["websocket"],
  });

  setTimeout(function(){
    setInterval(function(){
      sendPhoneStatusMessage();
    }, 10000);
    
    setInterval(function(){
      sendOBDData();
    }, 2000); 
  }, 5000);

$(function () {
  /* UTILITY */
  $('form').submit(function(){
    console.log("SENDING");
    socket.emit($('#a').val(), $('#m').val());
    $('#m').val('');
    $('#a').val('');
    return false;
  });

  function msgTime(){
    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();

    if (m < 10) {m = "0" + m};
    if (s < 10) {s = "0" + s};
    if (h < 10) {h = "0" + h};

    return h + ":" + m + ":" + s;
  }

  /* EVENTS */
  socket.on('DEBUG', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - DEBUG: ' + msg ));
  }).on('set page', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - set page: ' + msg ));
  }).on('getStatus', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - getStatus: ' + msg ));
  }).on('incoming calling', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - incoming calling: ' + msg ));
  }).on('call end', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - call end: ' + msg ));
  }).on('call data', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - call data: ' + msg ));
  }).on('call answer', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - call answer: ' + msg ));
  }).on('answer call', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - answer call: ' + msg ));
  }).on('end call', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - end call: ' + msg ));
  }).on('start phone call', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - start phone call: ' + msg ));
  }).on('outgoing calling', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - outgoing calling: ' + msg ));
  }).on('explore response', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - explore response: ' + msg ));
  }).on('started playing', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - started playing: ' + msg ));
  }).on('stopped playing', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - stopped playing: ' + msg ));
  }).on('load playlist data', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - load playlist data: ' + msg ));
  }).on('youtube url', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - youtube url: ' + msg ));
  }).on('loaded playlist dir', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - loaded playlist dir: ' + msg ));
  }).on('loaded omx page', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - loaded omx page: ' + msg ));
  }).on('dataReceived', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - OBD Data Received: ' + msg ));
  });

});

function sendPhoneStatus(){
  var a = 'phone status';
  var m = '{"batt":"47","bluetooth":true,"lastcalls":[{"callDate":"1538735845211","callDayTime":"Oct 5, 2018 12:37:25","callDuration":"49","callType":"1","callTypeDesc":"INCOMING","phNumber":"+393770190700"},{"callDate":"1538729788359","callDayTime":"Oct 5, 2018 10:56:28","callDuration":"911","callType":"2","callTypeDesc":"OUTGOING","name":"Panda","phNumber":"+393385628165"},{"callDate":"1538729749555","callDayTime":"Oct 5, 2018 10:55:49","callDuration":"0","callType":"2","callTypeDesc":"OUTGOING","name":"Mamma","phNumber":"3386776738"},{"callDate":"1538729186021","callDayTime":"Oct 5, 2018 10:46:26","callDuration":"551","callType":"2","callTypeDesc":"OUTGOING","name":"Sofia Monici","phNumber":"+393475974026"},{"callDate":"1538719067994","callDayTime":"Oct 5, 2018 07:57:47","callDuration":"1569","callType":"2","callTypeDesc":"OUTGOING","name":"Sofia Monici","phNumber":"+393475974026"}],"signal":"0","starredcontacts":[{"name":"Panda","number":"+39 338 562 8165"},{"name":"Maria Elena Bonacini","number":"+393394140439"},{"name":"Mamma","number":"3386776738"},{"name":"Sofia Monici","number":"+393475974026"}],"wifi":true}';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendPhoneStatusMessage(){
  var a = 'phone status';
  var m = '{"timestamp":"'+ new Date() +'","brightness":0,"lastCalls":[{"callDate":"1550758342424","callDayTime":"Feb 21, 2019 15:12:22","callDuration":"117","callType":"1","callTypeDesc":"INCOMING","phNumber":"+390392725028"},{"callDate":"1550756755273","callDayTime":"Feb 21, 2019 14:45:55","callDuration":"0","callType":"2","callTypeDesc":"OUTGOING","name":"Sofia Monici","phNumber":"+393475974026"},{"callDate":"1550743812808","callDayTime":"Feb 21, 2019 11:10:12","callDuration":"88","callType":"1","callTypeDesc":"INCOMING","phNumber":"+390287178073"},{"callDate":"1550681877105","callDayTime":"Feb 20, 2019 17:57:57","callDuration":"1552","callType":"2","callTypeDesc":"OUTGOING","name":"Viola Chat","phNumber":"3472207715"},{"callDate":"1550680855680","callDayTime":"Feb 20, 2019 17:40:55","callDuration":"0","callType":"2","callTypeDesc":"OUTGOING","name":"Sofia Monici","phNumber":"+393475974026"},{"callDate":"1550664915569","callDayTime":"Feb 20, 2019 13:15:15","callDuration":"773","callType":"1","callTypeDesc":"INCOMING","name":"Sofia Monici","phNumber":"+393475974026"},{"callDate":"1550606907803","callDayTime":"Feb 19, 2019 21:08:27","callDuration":"0","callType":"2","callTypeDesc":"OUTGOING","name":"Mamma","phNumber":"3386776738"}],"latitude":"' + getRandomInRange(45.529, 45.530, 3)+'","longitude":"'+getRandomInRange(9.22, 9.23, 3)+'","navbar":{"batt":"94","battInt":94,"bluetooth":true,"signal":0,"wifi":true},"starredContacts":[{"name":"Mamma","number":"3386776738"},{"name":"Sofia Monici","number":"3475974026"},{"name":"Maria Elena Bonacini","number":"+393319979680"},{"name":"Panda","number":"+393385628165"}]}';

  socket.emit(a, m);
  
}

var obdMsg = 0;
function sendOBDData(){
  //obdMsg = obdMsg <=4? obdMsg++ : obdMsg = 0;
    var a = 'dataReceived',
        m = "",
        messages = [
          '{"value":"NO DATA"}',
          '{"mode":"41","pid":"0B","name":"vss","value":' + (Math.floor(Math.random() * (+200 - 1) + 0)) +', "title": "Velocity"}', 
          '{"mode":"41","pid":"0B","name":"rpm","value":' + (Math.floor(Math.random() * (+6000 - +1) + +1)) +', "title": "RPM"}',
          '{"mode":"41","pid":"0B","name":"temp","value":' + (Math.floor(Math.random() * (+1000 - +10) + +10)) +', "title": "Temperature"}',
          '{}',
        ];
  
    for(var i=0; i < messages.length; i++){
      m = messages[i];
      console.log("Message:", m);

      socket.emit(a, m);
    }
}

function sendDEBUG(){
  var a = 'DEBUG';
  var m = 'semplice testo di debug';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendChangePageHome(){
  var a = 'change page';
  var m = 'home';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendChangePageMaps(){
  var a = 'change page';
  var m = 'map';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendChangePageOmx(){
  var a = 'change page';
  var m = 'omx';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendChangePageYoutube(){
  var a = 'change page';
  var m = 'yt';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendChangePageCar(){
  var a = 'change page';
  var m = 'car';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendLoadYoutube(){
  var a = 'load youtube';
  var m = '';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendGetPage(){
  var a = 'getPage';
  var m = '';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendGetStatus(){
  var a = 'getStatus';
  var m = '';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendReboot(){
  var a = 'reboot';
  var m = '';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendWifi(){
  var a = 'wifi';
  var m = '';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendBrightness(){
  var a = 'brightness';
  var m = '10';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendStartCall(){
  var a = 'start phone call';
  var m = '3386776738';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendExploreDirectory(){
  var a = 'explore directory';
  var m = '/home/pi/omx_playlist';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendLoadOmx(){
  var a = 'load omx';
  var m = '';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendPlayFile(){
  var a = 'play file';
  var m = 'Path del file';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendStopFile(){
  var a = 'stop file';
  var m = 'Path del file';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendSavePlaylist(){
  var a = 'save playlist';
  var m = 'VERIFICARE';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendLoadPlaylist(){
  var a = 'load playlist';
  var m = 'playlist_0';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendOpenYTVideo(){
  var a = 'open yt video';
  var m = '{"description":"Somebody That I Used To Know (metal cover by Leo Moracchioli)","url":"https://youtu.be/3PDvJDXKmvM"}';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendLoadYoutube(){
  var a = 'load youtube';
  var m = '';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendYoutubeHistory(){
  var a = 'youtube history';
  var m = '';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendOmxPause(){
  var a = 'omx command';
  var m = 'pause';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendOmxPplay(){
  var a = 'omx command';
  var m = 'pause';

  $('#a').val(a);
  $('#m').val(m);
  
}

function sendOBDMap(){
  var a = 'dataReceived';
  var m = '{"mode":"41","pid":"0B","name":"map","value":25}';

  $('#a').val(a);
  $('#m').val(m);
}

function sendOBDTemp(){
  var a = 'dataReceived';
  var m = '{"mode":"41","pid":"0B","name":"temp","value":55}';

  $('#a').val(a);
  $('#m').val(m);
}

function sendOBDNodata(){
  var a = 'dataReceived';
  var m = '{"value":"NO DATA"}';

  $('#a').val(a);
  $('#m').val(m);
}

function getRandomInRange(from, to, fixed) {
    return (Math.random() * (to - from) + from).toFixed(fixed) * 1;
    // .toFixed() returns string, so ' * 1' is a trick to convert to number
}
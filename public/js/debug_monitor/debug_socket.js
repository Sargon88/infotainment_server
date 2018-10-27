var socket = io();

$(function () {
  /* UTILITY */
  $('form').submit(function(){
    socket.emit($('#a').val(), $('#m').val());
    $('#m').val('');
    $('#a').val('');
    return false;
  });

  setInterval(function(){
    sendPhoneStatusMessage();
  }, 45000);

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

/*
  socket.on('phone status', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - phone status: ' + msg ));
  });	
*/

  socket.on('DEBUG', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - DEBUG: ' + msg ));
  });	

  socket.on('set page', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - set page: ' + msg ));
  });	

  socket.on('getStatus', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - getStatus: ' + msg ));
  });	

  socket.on('incoming calling', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - incoming calling: ' + msg ));
  });	

  socket.on('call end', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - call end: ' + msg ));
  });	

  socket.on('call data', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - call data: ' + msg ));
  });	

  socket.on('call answer', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - call answer: ' + msg ));
  });	

  socket.on('answer call', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - answer call: ' + msg ));
  });

  socket.on('end call', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - end call: ' + msg ));
  });

  socket.on('start phone call', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - start phone call: ' + msg ));
  });

  socket.on('outgoing calling', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - outgoing calling: ' + msg ));
  });

  socket.on('explore response', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - explore response: ' + msg ));
  });

  socket.on('started playing', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - started playing: ' + msg ));
  });

  socket.on('stopped playing', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - stopped playing: ' + msg ));
  });

  socket.on('load playlist data', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - load playlist data: ' + msg ));
  });

  socket.on('youtube url', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - youtube url: ' + msg ));
  });

  socket.on('loaded playlist dir', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - loaded playlist dir: ' + msg ));
  });

  socket.on('loaded omx page', function(msg){
    $('#messages').append($('<li>').text(msgTime() + ' - loaded omx page: ' + msg ));
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
  var m = '{"batt":"47","bluetooth":true,"lastcalls":[{"callDate":"1538735845211","callDayTime":"Oct 5, 2018 12:37:25","callDuration":"49","callType":"1","callTypeDesc":"INCOMING","phNumber":"+393770190700"},{"callDate":"1538729788359","callDayTime":"Oct 5, 2018 10:56:28","callDuration":"911","callType":"2","callTypeDesc":"OUTGOING","name":"Panda","phNumber":"+393385628165"},{"callDate":"1538729749555","callDayTime":"Oct 5, 2018 10:55:49","callDuration":"0","callType":"2","callTypeDesc":"OUTGOING","name":"Mamma","phNumber":"3386776738"},{"callDate":"1538729186021","callDayTime":"Oct 5, 2018 10:46:26","callDuration":"551","callType":"2","callTypeDesc":"OUTGOING","name":"Sofia Monici","phNumber":"+393475974026"},{"callDate":"1538719067994","callDayTime":"Oct 5, 2018 07:57:47","callDuration":"1569","callType":"2","callTypeDesc":"OUTGOING","name":"Sofia Monici","phNumber":"+393475974026"}],"signal":"0","starredcontacts":[{"name":"Panda","number":"+39 338 562 8165"},{"name":"Maria Elena Bonacini","number":"+393394140439"},{"name":"Mamma","number":"3386776738"},{"name":"Sofia Monici","number":"+393475974026"}],"wifi":true}';

  socket.emit(a, m);
  
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
  var m = 'maps';

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
var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sys = require('sys')
var exec = require('child_process').exec;
var request = require('request');
var fs = require('fs');

var _PAGE = "home";
var callerNum = "";
var Socket;
var mediaDocRoot = "/media/pi/";
var playlistDir = "/home/pi/omx_playlists/";
var omxCommandFile = "/tmp/omx_control"
var yt_playlist = "yt_playlist";
var yturl = "";
var lastUsbStatus = "";

var infotainmentStatus = {};

app.use(express.static('public'))

app.get('/monitor', function(req, res){
	res.sendFile(__dirname + '/public/monitor.html');
});

app.get('/interface', function(req, res){
	res.sendFile(__dirname + '/public/interface.html');
});

app.get('/call', function(req, res){
	res.sendFile(__dirname + '/public/call.html');
});

/** EVENT MANAGER */
io.on('connection', function(socket){
	Socket = socket;

	Socket.on('phone status', function(msg){	
			_lastPhoneStatus = msg;
			io.emit('phone status', msg);

			if(_PAGE=="map"){
				var msgObj = JSON.parse(msg);
				var coordinates = infotainmentStatus.longitude + " " + infotainmentStatus.latitude;

				exec("export DISPLAY=:0.0; dbus-send  --print-reply --session --dest=org.navit_project.navit /org/navit_project/navit/default_navit org.navit_project.navit.navit.set_center_by_string string:\"geo: " + coordinates + "\"", function(err, stdout, stderr) {
					if(stderr != ""){
						console.log("---- stderr --- ");
						console.log(stderr);
						console.log("");	
					}
				});
			}

			console.log(msg);
	});
	  
	Socket.on('DEBUG', function(msg){
		io.emit("DEBUG", msg);
		console.log(msg);
	});

	//reboot command
	Socket.on('reboot', function(msg){
		console.log("REBOOT");

		exec("sudo reboot", function(err, stdout, stderr) {
			if (err) {
				// should have err.code here?  
				console.log("ERROR: " + err);
			}
			console.log(stdout);
		});
	});

	//cambio pagina
	Socket.on('change page', function(msg){
		console.log("changepage: " + msg);

		changePage(msg);

	});

	Socket.on('getPage', function(msg){
		console.log("getPage: " + _PAGE);

		io.emit("set page", _PAGE);
	});

	Socket.on('getStatus', function(msg){
		console.log("getStatus");
		io.emit('getStatus', "");	
	});

	//attivo la ricerca di wifi
	Socket.on('wifi', function(msg){
		console.log("Wifi: " + msg);

		//TODO implementare
	});

	Socket.on('brightness', function(msg){
		var br = Math.round((255/100)*msg);

		exec('sudo bash -c "echo ' + br + ' > /sys/class/backlight/rpi_backlight/brightness"', function(err, stdout, stderr) {
			if (err) {
				// should have err.code here?  
				console.log("ERROR: " + err);
			}
			console.log(stdout);
		});
		
	});

	/** ----------- INIZIO CHIAMATE ------------ */
	Socket.on('incoming calling', function(msg){
		console.log('----- Incoming Calling -----');
		console.log('Caller Number: ' + msg);
		console.log('----- Incoming Calling -----');
		callerNum = msg;

		io.emit("incoming calling", msg);
		
	});

	Socket.on('call end', function(msg){
		console.log('----- Call end -----');
		console.log('Caller Number: ' + msg);
		console.log('----- Call end -----');
		callerNum = "";

		io.emit("call end", msg);
		
	});

	Socket.on('getCall', function(msg){
		console.log("get Call: " + callerNum);
		io.emit("call data", callerNum);
		
	});

	//da rivedere questa logica
	Socket.on('call answer', function(msg){
		console.log('----- Call answer -----');

		io.emit("call answer", msg);
		
	});

	Socket.on('answer call', function(msg){
		console.log('----- Answer Call: ' + msg + ' -----');
		
		io.emit("answer call", msg);
	});

	Socket.on('end call', function(msg){
		console.log('----- End Call: ' + msg + ' -----');
		
		io.emit("end call", msg);
	});

	Socket.on('start phone call', function(msg){
		console.log("----- start outgoing call ------ ");
		console.log("Number outgoing call: " + msg);
		console.log("----- start outgoing call ------ ");
		io.emit("start phone call", msg);
	});

	Socket.on('outgoing calling', function(msg){
		console.log("----- outgoing calling ------ ");
		console.log("Number outgoing calling: " + msg);
		console.log("----- start outgoing calling ------ ");

		callerNum = msg;

		io.emit("outgoing calling", msg);
	});
	/** ----------- FINE CHIAMATE ------------ */

	/** ----------- INIZIO OMX ------------ */
	Socket.on('load omx', function(msg){
		console.log("load OMX page: " + msg);
		loadOmxPage();
	});

	Socket.on('explore directory', function(msg){
		console.log("--------- explore directory: " + msg + " ---------");
		
		var path = mediaDocRoot + msg;

		exec("ls -F " + path, function(err, stdout, stderr) {
			var rsp = "";
			if(stdout != ""){
				var array = stdout.split("\n");
				removeUselessElements(array);
				rsp = JSON.stringify(array);
				
			} else if(stderr != ""){
				rsp = stderr;
				console.log(rsp);	
			}

			io.emit("explore response", rsp);
		});

	});

	Socket.on('play file', function(msg){
		console.log("--------- play file: " + msg + " ---------");

		//ripulisco il file dei comandi
		var cmd = "tail -f /dev/null > " + omxCommandFile;
		console.log(cmd);
		exec(cmd, function(err, stdout, stderr) {});

		var cmd = 'cat ' + omxCommandFile + " | omxplayer " + docRoot+'\"' + msg + '\" ';
		console.log(cmd);
		exec(cmd, function(err, stdout, stderr) {
		
			if(stderr != ""){
				console.log(stderr);	
			}
			
			io.emit("started playing", "");
		});


	});

	Socket.on('stop file', function(msg){
		console.log("--------- play file: " + msg + " ---------");

		exec("killall omxplayer.bin", function(err, stdout, stderr) {
			
			if(stderr != ""){
				console.log(stderr);	
			}
			
			io.emit("stopped playing", "");
			
		});

		
	});
		
	Socket.on('omx command', function(msg){
		console.log("omx command: " + msg);

		switch(msg){
			case "pause":
				var cmd = 'echo -n p > ' + omxCommandFile;
				console.log(cmd);
				exec(cmd, function(err, stdout, stderr){

					if(stderr != ""){
						console.log(stderr);	
					}

					if(stdout != ""){
						console.log(stdout);	
					}

				});
				break;
			default:
		}

		console.log("END");

	});

	Socket.on('save playlist', function(msg){
		console.log("--------- save playlst: " + msg + " ---------");

		var playlist = JSON.parse(msg);

		var fileName = playlistDir + playlist.name;
		var songsArray = playlist.files;

		exec("> " + fileName, function(err, stdout, stderr) {
			
			for(var i = 0; i < songsArray.length; i++){

				saveFileInPlaylist(songsArray[i], fileName);
			}

		});

	});

	Socket.on('load playlist', function(msg){
		console.log("--------- load playlst: " + msg + " ---------");

		var filePath = playlistDir + msg;

		console.log("Path: " + filePath);
		exec("cat " + filepath, function(err, stdout, stderr) {
			
			console.log("ERR: " + err);
			console.log("-------");
			console.log("");
			console.log("Stdout: " + stdout);
			console.log("-------");
			console.log("");
			console.log("Stderr: " + stderr);

			if(stdout != ""){

				console.log(stdout);
				
				Socket.emit('load playlist data', stdout);

			} else if(stderr != ""){
				console.log(stderr);	
			}
			
			console.log("Loaded");

		});


	});
	/** ----------- FINE OMX ------------ */

	/** ----------- INIZIO YOUTUBE ------ */
	Socket.on('open yt video', function(msg){
		console.log("--------- Open Youtube Video: " + msg + " ---------");

		msgObj = JSON.parse(msg);
		yturl = msgObj.url;
		
		saveFileInPlaylist(msg, yt_playlist);

		changePage("ytPlay");

	});

	Socket.on('load youtube', function(msg){
		console.log("--------- Load Youtube: " + yturl + " ---------");
		io.emit('youtube url', yturl);
	});

	Socket.on('youtube history', function(msg){
		returnYoutubeHistory();
	})
	/** ----------- FINE YOUTUBE -------- */

	/** ----------- INIZIO GPS -------- */
	Socket.on('coordinates', function(msg){
		//inserire le coordinate nell'oggetto dello stato del raspberry

		var cooObj = JSON.parse(msg);

		infotainmentStatus.longitude = cooObj.longitude;
		infotainmentStatus.latitude = cooObj.latitude;

		if(_PAGE=="map"){
			var msgObj = JSON.parse(msg);
			var coordinates = infotainmentStatus.longitude + " " + infotainmentStatus.latitude;

			exec("export DISPLAY=:0.0; dbus-send  --print-reply --session --dest=org.navit_project.navit /org/navit_project/navit/default_navit org.navit_project.navit.navit.set_position string:\"geo: " + coordinates + "\"", function(err, stdout, stderr) {
				if(stderr != ""){
					console.log("---- stderr --- ");
					console.log(stderr);
					console.log("");	
				}
			});
		}

		io.emit('coordinates', msg);
	})
	/** ----------- FINE GPS -------- */

});


/** Utility functions */
function startFullscreenChromium(){
	console.log("START FULLSCREEN CHROMIUM");
	exec("./../info_scripts/keepAliveChromium.sh >> /home/pi/infotainment_logs/chromium.log &", function(err, stdout, stderr) {
		if(stderr != ""){
			console.log("---- stderr --- ");
			console.log(stderr);
			console.log("");	
		}
	});
};

function startBarChromium(){
	console.log("START BAR CHROMIUM");

	exec("./../info_scripts/keepAliveChromium.sh 1920 110 0 0 >> /home/pi/infotainment_logs/chromium.log &", function(err, stdout, stderr) {
		if(stderr != ""){
			console.log("---- stderr --- ");
			console.log(stderr);
			console.log("START BAR CHROMIUM - DONE");
			console.log("");	
		}
	});
}

function changePage(msg, extra){
	if(msg == "map" || msg == "ytPlay"){
		//devo killare cromium per ricostruire l'interfaccia più piccola

		exec("sudo killall keepAliveChromium.sh omxplayer.bin keepAliveNavit.sh navit", function(err, stdout, stderr) {

			console.log("------ KILLED KEEP ALIVE ------");

			if(stderr != ""){
				console.log("---- stderr --- ");
				console.log(stderr);
				console.log("");	
			}
			
			if(msg == "map"){
				setTimeout(function(){
					exec("/home/pi/info_scripts/keepAliveNavit.sh >> /home/pi/infotainment_logs/navit.log &", function(err, stdout, stderr) {
						if(stderr != ""){
							console.log("---- stderr --- ");
							console.log(stderr);
							console.log("");	
						}
		
					});
				}, 1500);
			} else if(msg == "ytPlay"){

				var cmd = "tail -f /dev/null > " + omxCommandFile;
				console.log(cmd);
				exec(cmd, function(err, stdout, stderr) {});


				var cmd = 'cat ' + omxCommandFile + ' | omxplayer --display 4 --loop --win 0,142,800,500 $(youtube-dl -g -f mp4 "'+yturl+'")';
				console.log(cmd);

				exec(cmd, function(err, stdout, stderr) {
					if(stderr != ""){
						console.log("---- stderr --- ");
						console.log(stderr);
						console.log("");	
					}
	
				});
				
			}
			
			if(_PAGE != "ytPlay" && _PAGE != "map"){
				startBarChromium();
			}

			_PAGE=msg;
		
		});

	} else if(_PAGE == "map" || _PAGE == "ytPlay" ) {
		//se la pagina su cui mi trovo è la mappa, devo ricostruire l'interfaccia grande

		exec("sudo killall keepAliveChromium.sh", function(err, stdout, stderr) {

			console.log("------ KILLED KEEP ALIVE ------");

			if(stderr != ""){
				console.log("---- stderr --- ");
				console.log(stderr);
				console.log("");	
			}
				
			_PAGE = msg;

			exec("killall keepAliveNavit.sh navit omxplayer.bin", function(err, stdout, stderr){
				if(stderr != ""){
					console.log("---- killall stderr --- ");
					console.log(stderr);
					console.log("");	
				}
				
			});

			startFullscreenChromium();

		});

	} else {
		//caso in cui non devo riavviare il browser
		io.emit("set page", msg);
	}
}


/** ---------- INIZIO FUNZIONI OMX ---------- */
function loadOmxPage(){
	console.log("loadOmxPage function");

	//carica l'elenco delle playlist
	exec("ls -F " + playlistDir + " | grep playlist_", function(err, stdout, stderr) {
		var rsp = "";
		if(stdout != ""){
			var array = stdout.split("\n");

			removeUselessElements(array);
							
			rsp = JSON.stringify(array);

		} else if(stderr != ""){
			rsp = stderr;
			console.log(rsp);	
		}
		io.emit("loaded playlist dir", rsp);

		//qualunque periferica venga collegata viene automaticamente montata sotto /media/pi
		setInterval(function(){
			exec("ls -F " + mediaDocRoot, function(err, stdout, stderr) {
				var rsp = "";
				if(stdout != ""){
					var array = stdout.split("\n");

					removeUselessElements(array);
									
					rsp = JSON.stringify(array);

				} else if(stderr != ""){
					rsp = stderr;
					console.log(rsp);	
				}

				if(lastUsbStatus != rsp){
					lastUsbStatus = rsp;

					io.emit("loaded omx page", rsp);
				}
				
			})
		}, 2000);

	})

}

function removeUselessElements(array){
	var index = array.indexOf("");
	if (index > -1) {
		array.splice(index, 1);
	}
}

function saveFileInPlaylist(msg, fileName){

	msgObj = JSON.parse(msg);
	yturl = msgObj.url;

	var cmd = "grep '"+ yturl +"' " + playlistDir+fileName;

	exec(cmd, {shell: '/bin/bash'}, function(err, stdout, stderr){

		if(stdout == ""){
			//nuovo video
			cmd = "echo '" + msg + "' > " + playlistDir+"temp_ytPlaylist";
			exec(cmd, {shell: '/bin/bash'}, function(err, stdout, stderr) {
				
				if(stderr != ""){
					console.log(stderr);
					return;
				}

				cmd = "head -6 " + playlistDir+fileName + " >> " + playlistDir + "temp_ytPlaylist";
				exec(cmd, {shell: '/bin/bash'}, function(err, stdout, stderr) {

					if(stderr != ""){
						console.log(stderr);
						return;
					}
					
					cmd = "mv " + playlistDir + "temp_ytPlaylist " + playlistDir + fileName;
				
					exec(cmd, {shell: '/bin/bash'}, function(err, stdout, stderr) {

						if(stderr != ""){
							console.log(stderr);
							return;
						}
											
						console.log("Saved");
						return true;
					});
				});

			});
		} else {
			console.log("Video già riprodotto");
		}

		returnYoutubeHistory();

	})
}

/** ---------- FINE FUNZIONI OMX ---------- */

/** ---------- INIZIO FUNZIONI YOUTUBE ---- */
function returnYoutubeHistory(){
	var cmd = "tail -7 " + playlistDir + yt_playlist + " | awk '{print}' ORS=', '";

	exec(cmd, {shell: "/bin/bash"}, function(err, stdout, stderr){

		var rsp = "{urls: []}";

		if(err != null){
			console.log(err);
		} else {
			console.log("STDOUT: " + stdout);

			var msg = stdout.substr(0, stdout.length-2);

			rsp = '{"urls": [' + msg + ']}';
		}

		console.log("MSG2: " + rsp);
		
		Socket.emit('url history', rsp);
	});
}
/** ---------- FINE FUNZIONI YOUTUBE ------ */
http.listen(8080, function(){
	console.log('listening on *:8080');

	console.log(" ");
	console.log("Start Chromium");

	startFullscreenChromium();	

});

/** IMPORT **/
var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sys = require('sys')
var exec = require('child_process').exec;
var request = require('request');
var fs = require('fs');

/** CONSTANTS */
var Socket;
var mediaDocRoot = "/media/pi/";
var playlistDir = "/home/pi/omx_playlists/";
var omxCommandFile = "/tmp/omx_control"
var yt_playlist = "yt_playlist";

/** SHELL COMMANDS */
var cmd_sendDbusCoordinate = "export DISPLAY=:0.0; dbus-send  --print-reply --session --dest=org.navit_project.navit /org/navit_project/navit/default_navit org.navit_project.navit.navit.set_center_by_string string:\"geo: %coordinates%\"";
var cmd_reboot = "sudo reboot";
var cmd_killKeepAlive = "sudo killall keepAliveChromium.sh omxplayer.bin keepAliveNavit.sh navit";
var cmd_startNavit = "/home/pi/info_scripts/keepAliveNavit.sh >> /home/pi/infotainment_logs/navit.log &";
var cmd_tailCommandFile = "tail -f /dev/null > " + omxCommandFile;
var cmd_startYTOmx = 'cat ' + omxCommandFile + ' | omxplayer --display 4 --loop --win 0,152,800,500 $(youtube-dl -g -f mp4 "%yturl%")';
var cmd_setBrightness = 'sudo bash -c "echo %br% > /sys/class/backlight/rpi_backlight/brightness"';

var commands = {
	omx: {
		getPlaylistList: "ls -F " + playlistDir + " | grep playlist_",
	},
}


/** PAGE MANAGER */
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, "dist/infotainment")));
app.get('/monitor', function(req, res){
	res.sendFile(__dirname + '/public/monitor.html');
});
/* //versione con knockout
app.get('/interface', function(req, res){
	res.sendFile(__dirname + '/public/interface.html');
});
*/
//versione con angular
app.get('/interface', function(req, res){
	
		res.sendFile(__dirname + '/dist/infotainment/index.html');
	
	
});
app.get('/call', function(req, res){
	res.sendFile(__dirname + '/public/call.html');
});



/** PARAMS */
var InfotainmentStatus = {
	//params
	page: "home",
	longitude: "",
	latitude: "",
	callerNum: "",
	yturl: "",
	lastUsbStatus: "",
	newPage: "",
	brightness: 255,

	//CHIAMATE
	calling: false,
	inCall: false,

	/** NAVBAR */
	navbar: {
		hour: "",
		battInt: 0,
		batt: "--",
		bluetooth: false,
		wifi: false,
		starredContacts: [],
		lastCalls: [],
		lastUpdate: new Date(),
		signal: 0
	}
};



/** GENERIC FUNCTIONS */
function log(tag, msg){
	if(msg != "" && msg != null){
		console.log(tag + ", " + msg);
	} else {
		//temporanea retrocompatibilità
		console.log(tag);
	}
	
};

function emit(event, msg){

	if(event != "coordinates"){
		//satura i log
		//TODO decommentare
		//log(">>>", event + ": " + msg);
		//log(" ");
	}	

	io.emit(event, msg);
};

function shell(cmd, lvl, f){
	log("SHELL", cmd);

	var isWin = /^win/.test(process.platform);

	if (!isWin) {
		process.env.PATH = process.env.PATH + ':/usr/local/bin';
	}

	exec(cmd, {shell: '/bin/bash'}, function(err, stdout, stderr, lvl) {
		if(lvl == "stdout"){
			log("---- stdout --- ");
			log(stdout);
			log("");
		}

		if(stderr != ""){
			log("---- stderr --- ");
			log(stderr);
			log("");	

		} 
		
		if(f != null){
			//funzione di callback
			f();
		}
	});
}


/** EVENT MANAGER */
io.on('connection', function(socket){
	Socket = socket;
	console.log("---------------------------- CONNECTED! --------------------------------------");

	/** --------- GENERIC --------------- */
	Socket.on('phone status', function(msg){	
		GenericService.phoneStatus(msg);

	}).on('disconnetc', function(msg){
		console.log("---------------------------- DISCONNECTED! --------------------------------------");
		
	}).on('DEBUG', function(msg){
		GenericService.debug(msg);
		
	}).on('reboot', function(){
		//reboot command
		GenericService.reboot();
		
	}).on('change page', function(msg){
		//cambio pagina
		log("changepage", msg);
		GenericService.changePage(msg);

	}).on('getPage', function(msg){
		GenericService.getPage(msg);

	}).on('getStatus', function(msg){
		emit('getStatus', "");

	}).on('brightness', function(){
		log("brightness", "now: " + InfotainmentStatus.brightness);
		GenericService.changeBrightness();
		
	});


	/** ----------- CHIAMATE ------------ */
	Socket.on('incoming calling', function(msg){
		CallService.incomingCall(msg);
		
	}).on('call end', function(msg){
		CallService.callEnd(msg);
		
	}).on('getCall', function(msg){
		CallService.getCall();
		
	}).on('call answer', function(msg){
		CallService.callAnswer(msg);
		
	}).on('answer call', function(msg){
		CallService.answerCall(msg);

	}).on('end call', function(msg){
		CallService.endCall(msg);

	}).on('start phone call', function(msg){
		CallService.startPhoneCall(msg);

	}).on('outgoing calling', function(msg){
		CallService.outgoingCall(msg);
	});

	/** ----------- OMX ------------ */
	Socket.on('load omx', function(msg){
		log("load OMX page: " + msg);
		OmxService.loadOmxPage();
	});

/************************************************************************************************ */


	Socket.on('explore directory', function(msg){
		log("--------- explore directory: " + msg + " ---------");
		
		var path = mediaDocRoot + msg;

		exec("ls -F " + path, function(err, stdout, stderr) {
			var rsp = "";
			if(stdout != ""){
				var array = stdout.split("\n");
				removeUselessElements(array);
				rsp = JSON.stringify(array);
				
			} else if(stderr != ""){
				rsp = stderr;
				log(rsp);	
			}

			emit("explore response", rsp);
		});

	});

	Socket.on('play file', function(msg){
		log("--------- play file: " + msg + " ---------");

		//ripulisco il file dei comandi
		var cmd = "tail -f /dev/null > " + omxCommandFile;
		log(cmd);
		exec(cmd, function(err, stdout, stderr) {});

		var cmd = 'cat ' + omxCommandFile + " | omxplayer " + docRoot+'\"' + msg + '\" ';
		log(cmd);_PAGE
		exec(cmd, function(err, stdout, stderr) {
		
			if(stderr != ""){
				log(stderr);	
			}
			
			emit("started playing", "");
		});


	});

	Socket.on('stop file', function(msg){
		log("--------- play file: " + msg + " ---------");

		exec("killall omxplayer.bin", function(err, stdout, stderr) {
			
			if(stderr != ""){
				log(stderr);	
			}
			
			emit("stopped playing", "");
			
		});

		
	});
		
	Socket.on('omx command', function(msg){
		log("omx command: " + msg);

		switch(msg){
			case "pause":
				var cmd = 'echo -n p > ' + omxCommandFile;
				log(cmd);
				exec(cmd, function(err, stdout, stderr){

					if(stderr != ""){
						log(stderr);	
					}

					if(stdout != ""){
						log(stdout);	
					}

				});
				break;
			default:
		}

		log("END");

	});

	Socket.on('save playlist', function(msg){
		log("--------- save playlst: " + msg + " ---------");

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
		log("--------- load playlst: " + msg + " ---------");

		var filePath = playlistDir + msg;

		log("Path: " + filePath);
		exec("cat " + filepath, function(err, stdout, stderr) {
			
			log("ERR: " + err);
			log("-------");
			log("");
			log("Stdout: " + stdout);
			log("-------");
			log("");
			log("Stderr: " + stderr);

			if(stdout != ""){

				log(stdout);
				
				Socket.emit('load playlist data', stdout);

			} else if(stderr != ""){
				log(stderr);	
			}
			
			log("Loaded");

		});


	});
	/** ----------- FINE OMX ------------ */

	/** ----------- INIZIO YOUTUBE ------ */
	Socket.on('open yt video', function(msg){
		log("--------- Open Youtube Video: " + msg + " ---------");

		msgObj = JSON.parse(msg);
		InfotainmentStatus.yturl = msgObj.url;
		
		saveFileInPlaylist(msg, yt_playlist);

		GenericService.changePage("ytPlay");

	});

	Socket.on('load youtube', function(msg){
		log("--------- Load Youtube: " + InfotainmentStatus.yturl + " ---------");
		emit('youtube url', InfotainmentStatus.yturl);
	});

	Socket.on('youtube history', function(msg){
		returnYoutubeHistory();
	})
	/** ----------- FINE YOUTUBE -------- */

	/** ----------- INIZIO GPS -------- */
	Socket.on('coordinates', function(msg){
		//inserire le coordinate nell'oggetto dello stato del raspberry

		var cooObj = JSON.parse(msg);

		InfotainmentStatus.longitude = cooObj.longitude;
		InfotainmentStatus.latitude = cooObj.latitude;

		if(InfotainmentStatus.page=="map"){
			var msgObj = JSON.parse(msg);
			var coordinates = InfotainmentStatus.longitude + " " + InfotainmentStatus.latitude;

			exec("export DISPLAY=:0.0; dbus-send  --print-reply --session --dest=org.navit_project.navit /org/navit_project/navit/default_navit org.navit_project.navit.navit.set_position string:\"geo: " + coordinates + "\"", function(err, stdout, stderr) {
				if(stderr != ""){
					log("---- stderr --- ");
					log(stderr);
					log("");	
				}
			});
		}

		emit('coordinates', msg);
	})
	/** ----------- FINE GPS -------- */

});

/** EVENTS SERVICES */
GenericService = {
	phoneStatus: function(msg){
		//TODO rimuovere questo
		emit('phone', msg);

		//retrocompatibilità
		emit('phone status', msg);

		//TODO debug per angular
		var msgObj = JSON.parse(msg);
		emit('status', '{"bluetooth":' + msgObj.bluetooth + ', "wifi":' + msgObj.wifi + ', "batteryValue":' + msgObj.batt + ', "hour":"10:30"}');
		

		if(InfotainmentStatus.page == "map"){
			var msgObj = JSON.parse(msg);
			var coordinates = InfotainmentStatus.longitude + " " + InfotainmentStatus.latitude;

			var cmd = cmd_sendDbusCoordinate.replace("%coordinates%", coordinates);
			shell(cmd);
		}
	},

	debug: function(msg){
		emit("DEBUG", msg);
		log(msg);
	},

	reboot: function(){
		log("REBOOT");
		shell(cmd_reboot," stdout");
	},

	changePage: function(msg, extra){
		
		InfotainmentStatus.newPage = msg;
		
		if(InfotainmentStatus.newPage == "map" || InfotainmentStatus.newPage == "ytPlay"){
			//devo killare chromium per ricostruire l'interfaccia più piccola
			shell(cmd_killKeepAlive, null, changeToMapYtPage);
	
		} else if(InfotainmentStatus.page == "map" || InfotainmentStatus.page == "ytPlay" ) {
			//se la pagina su cui mi trovo è la mappa, devo ricostruire l'interfaccia grande
	
			exec("sudo killall keepAliveChromium.sh", function(err, stdout, stderr) {
	
				log("------ KILLED KEEP ALIVE ------");
	
				if(stderr != ""){
					log("---- stderr --- ");
					log(stderr);
					log("");	
				}
					
				InfotainmentStatus.page = msg;
	
				exec("killall keepAliveNavit.sh navit omxplayer.bin", function(err, stdout, stderr){
					if(stderr != ""){
						log("---- killall stderr --- ");
						log(stderr);
						log("");	
					}
					
				});
	
				startFullscreenChromium();
	
			});
	
		} else {
			//caso in cui non devo riavviare il browser
			emit("set page", msg);
		}
	
	},

	getPage: function(msg){
		console.log("SET PAGE: " + InfotainmentStatus.page);
		emit("set page", InfotainmentStatus.page);
	},

	changeBrightness: function(){
		if(InfotainmentStatus.brightness == 255){
			InfotainmentStatus.brightness = 26
		} else {
			InfotainmentStatus.brightness = 255;
		}

		var cmd_complete = cmd_setBrightness.replace("%br%", InfotainmentStatus.brightness);
		exec(cmd_complete);

	}
}

CallService = {
	incomingCall: function(msg){
		log('----- Incoming Calling -----');
		log('Caller Number: ' + msg);
		log('----- Incoming Calling -----');
		InfotainmentStatus.callerNum = msg;
		InfotainmentStatus.calling = true;

		emit("incoming calling", msg);
	},

	callEnd: function(msg){
		log('----- Call end -----');
		log('Caller Number: ' + msg);
		log('----- Call end -----');
		InfotainmentStatus.callerNum = "";
		InfotainmentStatus.calling = false;

		emit("call end", msg);
	},

	getCall: function(){

		if(InfotainmentStatus.calling || InfotainmentStatus.inCall){
			emit("call data", InfotainmentStatus.callerNum);

		} else {
			log("ERROR", "Get Call not in Calling");

		}
		
	},

	callAnswer: function(msg){

		if(InfotainmentStatus.calling){
			InfotainmentStatus.inCall = true;
			emit("call answer", msg);

		} else {
			log("ERROR", "Call Answer not in Calling");

		}

	},

	answerCall: function(msg){

		if(InfotainmentStatus.calling){
			InfotainmentStatus.inCall = true;
			emit("answer call", msg);

		} else {
			log("ERROR", "Answer Call not in Calling");

		}

	},

	endCall: function(msg){

		if(InfotainmentStatus.calling || InfotainmentStatus.inCall){
			InfotainmentStatus.inCall = false;
			InfotainmentStatus.calling = false;
			emit("end call", msg);

		} else {
			log("ERROR", "Answer Call not in Calling");

		}

	},

	startPhoneCall: function(msg){
		if(!InfotainmentStatus.inCall && ! InfotainmentStatus.calling){
			log("----- start outgoing call ------ ");
			log("Number outgoing call: " + msg);
			log("----- start outgoing call ------ ");
			InfotainmentStatus.calling = true;
			emit("start phone call", msg);

		} else {
			log("ERROR", "Starting Another Call during a Call");

		}
		
	},

	outgoingCall: function(msg){
		log("----- outgoing calling ------ ");
		log("Number outgoing calling: " + msg);
		log("----- start outgoing calling ------ ");

		InfotainmentStatus.inCall = true;
		InfotainmentStatus.callerNum = msg;

		emit("outgoing calling", msg);
	}
}

OmxService = {
	/****************************************************************************************** */
	loadOmxPage: function(){
		log("loadOmxPage function");
	
		//carica l'elenco delle playlist
		exec(commands.omx.getPlaylistList, function(err, stdout, stderr) {
			var rsp = "";
			if(stdout != ""){
				var array = stdout.split("\n");
	
				removeUselessElements(array);
								
				rsp = JSON.stringify(array);
	
			} else if(stderr != ""){
				rsp = stderr;
				log(rsp);	
			}
			emit("loaded playlist dir", rsp);
	
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
						log(rsp);	
					}
	
					if(InfotainmentStatus.lastUsbStatus != rsp){
						InfotainmentStatus.lastUsbStatus = rsp;
	
						emit("loaded omx page", rsp);
					}
					
				})
			}, 2000);
	
		})
	
	}
}

/** GENERIC FUNCTIONS */
function changeToMapYtPage(){	
	log("------ KILLED KEEP ALIVE ------");
	
	if(InfotainmentStatus.newPage == "map"){
		log("TEST", "Change page to: " + InfotainmentStatus.newPage);

		setTimeout(function(){

			shell(cmd_startNavit);
		}, 1500);

	} else if(InfotainmentStatus.newPage == "ytPlay"){

		shell(cmd_tailCommandFile);

		var completeCommand = cmd_startYTOmx.replace('%yturl%', InfotainmentStatus.yturl);
		console.log("YTURL: " + completeCommand);
		//TODO
		shell(completeCommand, "stdout");
		//exec(completeCommand);		
	}

	if(InfotainmentStatus.page != "ytPlay" && InfotainmentStatus.page != "map"){
		startBarChromium();
	}

	InfotainmentStatus.page = InfotainmentStatus.newPage;
	InfotainmentStatus.newPage = "";

}

function startFullscreenChromium(){
	log("START FULLSCREEN CHROMIUM");
	exec("./../info_scripts/keepAliveChromium.sh >> /home/pi/infotainment_logs/chromium.log &", function(err, stdout, stderr) {
		if(stderr != ""){
			log("---- stderr --- ");
			log(stderr);
			log("");	
		}
	});
};

function startBarChromium(){
	log("START BAR CHROMIUM");

	exec("./../info_scripts/keepAliveChromium.sh 1920 120 0 0 >> /home/pi/infotainment_logs/chromium.log &", function(err, stdout, stderr) {
		if(stderr != ""){
			log("---- stderr --- ");
			log(stderr);
			log("START BAR CHROMIUM - DONE");
			log("");	
		}
	});
}




											/** ---------- INIZIO FUNZIONI OMX ---------- */
function removeUselessElements(array){
	var index = array.indexOf("");
	if (index > -1) {
		array.splice(index, 1);
	}
}

function saveFileInPlaylist(msg, fileName){

	msgObj = JSON.parse(msg);
	InfotainmentStatus.yturl = msgObj.url;

	var cmd = "grep '"+ InfotainmentStatus.yturl +"' " + playlistDir+fileName;

	exec(cmd, {shell: '/bin/bash'}, function(err, stdout, stderr){

		if(stdout == ""){
			//nuovo video
			cmd = "echo '" + msg + "' > " + playlistDir+"temp_ytPlaylist";
			exec(cmd, {shell: '/bin/bash'}, function(err, stdout, stderr) {
				
				if(stderr != ""){
					
					log(stderr);
					return;
				}

				cmd = "head -6 " + playlistDir+fileName + " >> " + playlistDir + "temp_ytPlaylist";
				exec(cmd, {shell: '/bin/bash'}, function(err, stdout, stderr) {

					if(stderr != ""){
						log(stderr);
						return;
					}
					
					cmd = "mv " + playlistDir + "temp_ytPlaylist " + playlistDir + fileName;
				
					exec(cmd, {shell: '/bin/bash'}, function(err, stdout, stderr) {

						if(stderr != ""){
							log(stderr);
							return;
						}
											
						log("Saved");
						return true;
					});
				});

			});
		} else {
			log("Video già riprodotto");
		}

		returnYoutubeHistory();

	})
}

/** ---------- FINE FUNZIONI OMX ---------- */

/** ---------- INIZIO FUNZIONI YOUTUBE ---- */
function returnYoutubeHistory(){
	var cmd = "tail -7 " + playlistDir + yt_playlist + " | awk '{print}' ORS=', '";

	console.log("CMD YT: " + cmd);

	exec(cmd, {shell: "/bin/bash"}, function(err, stdout, stderr){

		var rsp = "{urls: []}";

		if(err != null){
			log(err);
		} else {
			log("STDOUT: " + stdout);

			var msg = stdout.substr(0, stdout.length-2);

			if(msg == ""){
				//DEBUG ONLY
				msg = msg+JSON.stringify({'url': 'DEBUG', 'description':'DEBUG'})+', ';
				msg = msg+JSON.stringify({'url': 'https://www.youtube.com/watch?v=cHImmMWehhE', 'description':'Descr1'})+', ';
				msg = msg+JSON.stringify({'url': 'https://www.youtube.com/watch?v=P_kn2rtuc4o', 'description':'descr2'})+', ';
				msg = msg+JSON.stringify({'url':'https://www.youtube.com/watch?v=lLtuT4Wq0ug', 'description':'descr3'});
			}

			rsp = '{"urls": [' + msg + ']}';
			
		}

		log("MSG2: " + rsp);
		
		Socket.emit('url history', rsp);
	});
}
/** ---------- FINE FUNZIONI YOUTUBE ------ */
http.listen(8080, function(){
	log('listening on *:8080');

	log(" ");
	log("Start Chromium");

	startFullscreenChromium();	

});

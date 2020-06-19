/** IMPORT **/
var mode = "debug";
var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sys = require('sys');
var exec = require('child_process').exec;
var request = require('request');
var fs = require('fs');
var omx = null;
var OBDReader = null;

if(mode !== "debug"){
	omx = require('node-omxplayer');	
	OBDReader = require('bluetooth-obd');	
}


/** CONSTANTS */
var Socket;
var path = {
	mediaDocRoot: "/media",
	playlistDir: "/home/pi/omx_playlists/",
	omxCommandFile: "/tmp/omx_control",
	yt_playlist: "yt_playlist",
};


/** SHELL COMMANDS */
var commands = {
	omx: {
		getPlaylistList: "ls -F " + path.playlistDir + " | grep playlist_",
	},
	car: {
		startObdService: "/home/pi/info_scripts/obd_interface.py"
	},
	updateSystem: "git pull",
	reboot: "sudo reboot",
	killKeepAlive: "sudo killall keepAliveChromium.sh omxplayer.bin keepAliveNavit.sh navit",
	tailCommandFile: "tail -f /dev/null > " + path.omxCommandFile,
	startYTOmx: 'cat ' + path.omxCommandFile + ' | omxplayer --display 4 --loop --win 0,0,800,400 $(youtube-dl -g -f mp4 "%yturl%")',
	setBrightness: 'sudo bash -c "echo %br% > /sys/class/backlight/rpi_backlight/brightness"',
	topBar: "./../info_scripts/keepAliveChromium.sh 1920 100 0 0 >> /home/pi/infotainment_logs/chromium.log &", //old
	bottomBar: "./../info_scripts/keepAliveChromium.sh 1920 100 0 980 >> /home/pi/infotainment_logs/chromium.log &",
};


/** PAGE MANAGER */
app.use(express.static('public'));
app.get('/monitor', function(req, res){
	res.sendFile(__dirname + '/public/monitor.html');
});
app.get('/interface', function(req, res){
	res.sendFile(__dirname + '/public/interface.html');
});
app.get('/call', function(req, res){
	res.sendFile(__dirname + '/public/call.html');
});

/** PARAMS */
var InfotainmentStatus = {
	page: "home",
	longitude: "",
	latitude: "",
	
	yturl: "",
	lastUsbStatus: "",
	newPage: "",
	brightness: 255,

	/**CHIAMATE**/
	calling: false,
	inCall: false,
	callId: "",

	/**OBD**/
	btOBDReader: null,
	dataReceivedMarker: {},
	obdError: [],
	obdDebug: [],

	/** NAVBAR */
	navbar: {
		battInt: 0,
		wifi: false,
		starredContacts: [],
		lastCalls: [],
		lastUpdate: new Date(),
		signal: 0,
        obdConnected: false,
        phoneConnected: false,
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
};


/** EVENT MANAGER */
io.on('connection', function(socket){
	Socket = socket;
	/** --------- GENERIC --------------- */
	Socket.on('identify', function(msg){
		log("---------------------------- " + msg + " CONNECTED! --------------------------------------");
		if(msg == "Mobile Phone"){
			InfotainmentStatus.navbar.phoneConnected = true;
		}
	}).on('phone status', function(msg){
		InfotainmentStatus.navbar.phoneConnected = true;

		GenericService.phoneStatus(msg);
	}).on('disconnect', function(msg){
		log("---------------------------- " + msg + " DISCONNECTED! --------------------------------------");		
	}).on('DEBUG', function(msg){
		GenericService.debug(msg);		
	}).on('reboot', function(){
		GenericService.reboot();		
	}).on('change page', function(msg){
		log("changepage", msg);
		//GenericService.changePage(msg);
		GenericService.changePage_temp(msg);
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
		OmxService.loadOmxPage(msg);
	}).on('play file', function(msg){
		OmxService.playFile(msg);
	}).on('stop file', function(msg){
		OmxService.stopFile(msg);
	}).on('omx command', function(msg){
		OmxService.omxCommand(msg);
	});

	/** ----------- YOUTUBE ------------ */
	Socket.on('open yt video', function(msg){
		YoutubeService.openVideo(msg);
	}).on('load youtube', function(msg){
		YoutubeService.loadYoutube(msg);
	}).on('youtube history', function(msg){
		returnYoutubeHistory();
	});

	/** ----------- INIZIO GPS -------- */
	Socket.on('coordinates', function(msg){
		GPSService.coordinates(msg);
	}).on('refreshUI', function(){
		var msg = {
			data: InfotainmentStatus.dataReceivedMarker,
			error: InfotainmentStatus.obdError,
			debug: InfotainmentStatus.obdDebug
		};
		emit('obdFullData', msg);
	});
});

/** EVENTS SERVICES */
GenericService = {
	phoneStatus: function(msg){
		var msgObj = JSON.parse(msg);

		msgObj.navbar.phoneConnected = true;
		msgObj.inCall = InfotainmentStatus.inCall;
		msgObj.callId = InfotainmentStatus.callId;
		msgObj.calling = InfotainmentStatus.calling;

		//retrocompatibilità
		emit('phone status', JSON.stringify(msgObj));		

		if(InfotainmentStatus.page == "map"){
			var msgObj = JSON.parse(msg);
			var coordinates = InfotainmentStatus.longitude + " " + InfotainmentStatus.latitude;
		}
	},
	debug: function(msg){
		emit("DEBUG", msg);
		log(msg);
	},
	reboot: function(){
		log("REBOOT");
		shell(commands.reboot," stdout");
	},
	changePage: function(msg, extra){		
		InfotainmentStatus.newPage = msg;
		
		if(InfotainmentStatus.newPage == "map" || InfotainmentStatus.newPage == "ytPlay"){
			//devo killare chromium per ricostruire l'interfaccia più piccola
			shell(commands.killKeepAlive, null, changeToMapYtPage);
	
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
	changePage_temp: function(msg, extra){		
		InfotainmentStatus.newPage = msg;
		
		if(InfotainmentStatus.newPage == "ytPlay"){
			//devo killare chromium per ricostruire l'interfaccia più piccola
			shell(cmd_killKeepAlive, null, changeToMapYtPage);
	
		} else if(InfotainmentStatus.page == "ytPlay" ) {
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

		var cmd_complete = commands.setBrightness.replace("%br%", InfotainmentStatus.brightness);
		exec(cmd_complete);
	}
};

CallService = {
	incomingCall: function(msg){
		log('----- Incoming Calling -----');
		log('Caller Number: ' + msg);
		log('----- Incoming Calling -----');
		InfotainmentStatus.callId = msg;
		InfotainmentStatus.calling = true;
		InfotainmentStatus.inCall = false;

		emit("incoming calling", msg);
	},
	callEnd: function(msg){
		log('----- Call end -----');
		log('>>> Caller Number: ' + msg);
		log('----- Call end -----');
		InfotainmentStatus.callId = "";
		InfotainmentStatus.calling = false;
		InfotainmentStatus.inCall = false;

		emit("call end", msg);
	},
	getCall: function(){
		log("GET CALL");

		if(InfotainmentStatus.calling || InfotainmentStatus.inCall){
			emit("call data", InfotainmentStatus.callId);

			//put omxplayer on pause
			OmxService.omxCommand("pause");

		} else {
			log("ERROR", "Get Call not in Calling");
			emit("call end", "");
		}		
	},
	callAnswer: function(msg){
		log("CALL ANSWER");

		if(InfotainmentStatus.calling){
			InfotainmentStatus.inCall = true;
			emit("call answer", msg);

		} else {
			log("ERROR", "Call Answer not in Calling");
			emit("call end", "");
		}
	},
	answerCall: function(msg){
		log("ANSWER CALL");

		if(InfotainmentStatus.calling){
			InfotainmentStatus.inCall = true;
			emit("answer call", msg);

		} else {
			log("ERROR", "Answer Call not in Calling");
			emit("call end", "");
		}
	},
	endCall: function(msg){
		log("END CALL");

		if(InfotainmentStatus.calling || InfotainmentStatus.inCall){
			InfotainmentStatus.inCall = false;
			InfotainmentStatus.calling = false;

			//put omxplayer on pause
			OmxService.omxCommand("pause");

			emit("end call", msg);

		} else {
			log("ERROR", "End Call not in Calling");
			emit("call end", "");
		}
	},
	startPhoneCall: function(msg){
		if(!InfotainmentStatus.inCall && !InfotainmentStatus.calling){
			log("----- start phone call ------ ");
			log(">>> Number outgoing call: " + msg);
			log("----- start phone call ------ ");
			InfotainmentStatus.calling = true;
			emit("start phone call", msg);

		} else {
			log("ERROR", "Starting Another Call during a Call");

		}		
	},
	outgoingCall: function(msg){
		log("----- outgoing calling ------ ");
		log("<<< Number outgoing calling: " + msg);
		log("----- start outgoing calling ------ ");

		InfotainmentStatus.inCall = true;
		InfotainmentStatus.callId = msg;

		emit("outgoing calling", msg);
	}
};

var directoryTree = {data: []};
var lastDirectoryTree = null;
var loadDeviceInterval = null;
var rsp = "";
var omxPlayer = null;

OmxService = {
	loadOmxPage: function(msg){
		log("loadOmxPage function");

		if(loadDeviceInterval){
			lastDirectoryTree = null;
			clearInterval(loadDeviceInterval);
		}

		//qualunque periferica venga collegata viene automaticamente montata sotto /media/usb*
		loadDeviceInterval = setInterval(function(){
			if(directoryTree.data.length != 0){
				rsp = JSON.stringify(directoryTree);
			}

			directoryTree.data = [];

			exec("ls -F " + path.mediaDocRoot, function(err, stdout, stderr) {
				
				if(stdout != ""){
					var array = stdout.split("\n");
					
					removeUselessElements(array);
					buildFileTree(array);

				} else if(stderr != ""){
					rsp = stderr;
					log(rsp);	
				}

				if(lastDirectoryTree !== rsp && rsp){ //return only if new tree is different
					lastDirectoryTree = rsp;
					emit("loaded omx page", rsp);	
				}				
			})

		}, 3000);

	},
	playFile: function(msg){
		log("--------- play file: " + msg + " ---------");

		if(omxPlayer){
			console.log("OMX: " + omxPlayer);
			console.log("Is running: " + omxPlayer.running);
		} else {
			console.log("E' null");
		}

		if(omxPlayer && omxPlayer.running){
			console.log("IS Running: " + omxPlayer.running);
			omxPlayer.quit();
		}

		omxPlayer = omx(path.mediaDocRoot + msg, false, 100);
		omxPlayer.play();		
	},
	stopFile: function(msg){
		log("--------- stop file: " + msg + " ---------");

		omxPlayer.quit();
		emit("stopped playing", "");
	},
	omxCommand: function(msg){
		log("omx command: " + msg);

		switch(msg){
			case "pause":
				if(omxPlayer){
					omxPlayer.pause();
				}
				break;
			case "volUp":
				if(omxPlayer){
					omxPlayer.volUp();
				}
				break;
			case "volDown":
				if(omxPlayer){
					omxPlayer.volDown();
				}
				break;	
			default:
		}

		log("END");
	},
	savePlaylist: function(msg){
		log("--------- save playlst: " + msg + " ---------");

		var playlist = JSON.parse(msg);

		var fileName = path.playlistDir + playlist.name;
		var songsArray = playlist.files;

		exec("> " + fileName, function(err, stdout, stderr) {
			
			for(var i = 0; i < songsArray.length; i++){

				saveFileInPlaylist(songsArray[i], fileName);
			}

		});
	},
	loadPlaylist: function(msg){
		log("--------- load playlst: " + msg + " ---------");

		var filePath = path.playlistDir + msg;

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
	}
};

YoutubeService = {
	openVideo: function(msg){
		log("--------- Open Youtube Video: " + msg + " ---------");

		msgObj = JSON.parse(msg);
		InfotainmentStatus.yturl = msgObj.url;
		
		saveFileInPlaylist(msg, path.yt_playlist);

		GenericService.changePage("ytPlay");
	},
	loadYoutube: function(msg){
		log("--------- Load Youtube: " + InfotainmentStatus.yturl + " ---------");
		emit('youtube url', InfotainmentStatus.yturl);
	}
};

GPSService = {
	coordinates: function(msg){
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
	}
};

var connectionInterval = 1000;

CarService = {
	startObdMonitoring: function(){
		if(mode != "debug"){
			InfotainmentStatus.btOBDReader = new OBDReader();	
			InfotainmentStatus.btOBDReader.autoconnect('OBDII');	
		} else {
			InfotainmentStatus.btOBDReader = Socket;

			if(!InfotainmentStatus.btOBDReader){
				setTimeout(function(){CarService.startObdMonitoring()}, 2000);
			}
		}

		if(InfotainmentStatus.btOBDReader){

			InfotainmentStatus.btOBDReader.on('error', function (err) {
				if(err !== "No suitable devices found"){
					console.log("OBD ERROR",err);
				}

			   InfotainmentStatus.navbar.obdConnected = false;

			   CarService.errorMsg(err);
			   
			}).on('connected', function () {
			    //this.requestValueByName("vss"); //vss = vehicle speed sensor

			    this.addPoller("vss");
			    this.addPoller("rpm");
			    this.addPoller("temp");
			    this.addPoller("fli");
			    this.addPoller("hybridlife");


			    this.startPolling(500); //Request all values each second.

			    InfotainmentStatus.navbar.obdConnected = true;

			    emit("obdConnected", "");

			}).on('debug', function(msg){
				CarService.debugMsg(msg);

			}).on('dataReceived', function (data) {		
				
				if(data && typeof(data) != 'object'){
					data = JSON.parse(data);
				}
				if(data && data.pid){
					console.log("Event: dataReceived", data);

					switch(data.name){
						case 'vss':
							data.title = 'Speed';
							break;
						case 'rpm':
							data.title = 'RPM';
							break;
						case 'temp':
							data.title = 'Temperature';
							break;
						case 'fli':
							data.title = 'Fuel Level';
							break;
						case 'hybridlife':
							data.title = 'Hybrid Life';
							break;
						default:
							break;
					}

					InfotainmentStatus.dataReceivedMarker = data;
			    	CarService.updateOBDUi();	
				}
				 
			});
		}
	},
	updateOBDUi: function(){
		emit("updateObdUI", JSON.stringify(InfotainmentStatus.dataReceivedMarker));
	},
	errorMsg: function(msg){
		emit("obdError", msg);
		InfotainmentStatus.obdError.push(msg);

		if(InfotainmentStatus.OBDReader){
			InfotainmentStatus.OBDReader.off();
		}
		
		InfotainmentStatus.OBDReader = null;
		setTimeout(function(){
			CarService.startObdMonitoring();
		}, connectionInterval);

		if(connectionInterval < 10000){
			connectionInterval += 1000;
		}
		
	}, 
	debugMsg: function(msg){
		emit("obdDebug", msg);
		InfotainmentStatus.obdDebug.push(msg);
	}
}

/** GENERIC FUNCTIONS */
function changeToMapYtPage(){	
	log("------ KILLED KEEP ALIVE ------");
	
	if(InfotainmentStatus.newPage == "map"){
		log("TEST", "Change page to: " + InfotainmentStatus.newPage);

	} else if(InfotainmentStatus.newPage == "ytPlay"){

		shell(commands.tailCommandFile);

		var completeCommand = commands.startYTOmx.replace('%yturl%', InfotainmentStatus.yturl);
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
};

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

	exec(commands.bottomBar, function(err, stdout, stderr) {
		if(stderr != ""){
			log("---- stderr --- ");
			log(stderr);
			log("START BAR CHROMIUM - DONE");
			log("");	
		}
	});
};

function updateSystem(){
	exec(commands.updateSystem, function(err, stdout, stderr){
		if(stderr != ""){
			log("---- stderr --- ");
			log(stderr);
			log("SYSTEM NOT UPDATE");
			log("");	
		} else {
			GenericService.reboot();
		}
	});
};

/** ---------- INIZIO FUNZIONI OMX ---------- */
function removeUselessElements(array){
	var index = array.indexOf("");
	if (index > -1) {
		array.splice(index, 1);
	}
};
function saveFileInPlaylist(msg, fileName){

	msgObj = JSON.parse(msg);
	InfotainmentStatus.yturl = msgObj.url;
	
	var cmd = "grep '"+ InfotainmentStatus.yturl +"' " + path.playlistDir+fileName;

	exec(cmd, {shell: '/bin/bash'}, function(err, stdout, stderr){
		
		if(stdout == ""){	
			//nuovo video
			cmd = "echo '" + msg + "' > " + path.playlistDir+"temp_ytPlaylist";
			exec(cmd, {shell: '/bin/bash'}, function(err, stdout, stderr) {

				if(stderr != ""){
					log(stderr);
					return;
				}
				

				cmd = "head -6 " + path.playlistDir+fileName + " >> " + path.playlistDir + "temp_ytPlaylist";
				exec(cmd, {shell: '/bin/bash'}, function(err, stdout, stderr) {
					

					if(stderr != ""){
						log(stderr);
						return;
					}
					
					cmd = "mv " + path.playlistDir + "temp_ytPlaylist " + path.playlistDir + fileName;
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
};
function buildFileTree(array){

	for(var i=0; i<array.length; i++){
		var d = array[i];

		exploreDirectory("/", d, directoryTree.data);
	}
}
function exploreDirectory(dir, item, array){

	var entry = {
        text: item,
        expanded: false,
        iconUrl: "images/folder.png",
        parent: dir,
        items: [],
    };
    array.push(entry);

	fs.readdir(path.mediaDocRoot + dir + item, function(err, items) {
		try{
			for (var i=0; i<items.length; i++) {
			        var c = items[i];
			        
		        	fs.stat(path.mediaDocRoot + dir + item + "/" + c, statsCallback(dir + item, c, entry)); 	
    
			    }
	 	} catch(e){
	        	//console.log(e);
        }
	    	
	});
}
function statsCallback(dir, c, entry){
	return function(err, stats) {
        if(stats.isDirectory()){
        	exploreDirectory(dir, c, entry.items);
        	
        } else {
        	if(c.includes("mp3")){
                var e = {
                    text: c,
                    parent: dir,
                    iconUrl: "images/audio.png",
                };

                entry.items.push(e);

            } else if(c.includes("wma")){
                var e = {
                    text: c,
                    parent: dir,
                    iconUrl: "images/audio.png",
                };

                entry.items.push(e);

            } else if(c.includes("wmv")){
                var e = {
                    text: c,
                    parent: dir,
                    iconUrl: "images/video.png",
                };

                entry.items.push(e);

            }
        }
        
    }
}
/** ---------- FINE FUNZIONI OMX ---------- */

/** ---------- INIZIO FUNZIONI YOUTUBE ---- */
function returnYoutubeHistory(){
	var cmd = "tail -7 " + path.playlistDir + path.yt_playlist + " | awk '{print}' ORS=', '";

	exec(cmd, {shell: "/bin/bash"}, function(err, stdout, stderr){

		var rsp = "{urls: []}";

		if(err != null){
			log(err);
		} else {
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
		
		Socket.emit('url history', rsp);
	});
}
/** ---------- FINE FUNZIONI YOUTUBE ------ */

http.listen(8080, function(){
	log('listening on *:8080');

	log(" ");
	log("Start Chromium");

	//update version
	log("Try Updating");
	shell(commands.updateSystem);

	startFullscreenChromium();	

	// Use first device with 'obd' in the name
	CarService.startObdMonitoring();
});

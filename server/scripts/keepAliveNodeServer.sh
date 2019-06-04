#!/bin/bash

while true ; do

        
    killall node
    echo "killed node.js"

	killall chromium-browser-v7
    echo "killed chromium-browser-v7"

    cd /home/pi/infotainment/
    node server.js & $kapid=$! 

    sleep 5;


    wait $kapid

done


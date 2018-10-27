#!/bin/bash

while true ; do

        
    killall node

    echo "killed node.js"
    cd /home/pi/infotainment/
    node server.js & $kapid=$! 

    sleep 5;


    wait $kapid

done


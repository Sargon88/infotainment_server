#!/bin/bash

export DISPLAY=:0.0

while true ; do
       
    killall navit
    cd /home/pi/navit/navit-build/navit
    ./navit -d 3 & $kapid=$!

    wait $kapid

    echo "script killed";

done
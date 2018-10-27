#!/bin/bash

export DISPLAY=:0.0

host=127.0.0.1
port=8080

while true ; do

    ## CICLO DI ATTESA PER IL SERVER
    state=1;
    state=$(ps -axl | grep node | wc -l)
    echo "state1: ".$state;

    while [ $state -lt 2 ]; do
        echo $state Attendo che il server ritorni su!!
        sleep 5
        state=$(ps -axl | grep node | wc -l)

    done
    ## FINE

    if [ $1 -ge 0 -a $2 -ge 0 -a $3 -ge 0 -a $4 -ge 0 ];
        then pos="--window-size=$1,$2 --window-position=$3,$4"
    else 
        pos="--kiosk --kiosk-printing"
    fi
        
    killall chromium-browser 
    chromium-browser $pos --no-first-run --disable-translate --no-default-browser-check --no-touch-pinch --overscroll-history-navigation='0' --incognito --disable-pinch --process-per-site --app=http://$host:$port/interface & $kapid=$!


    wait $kapid

done


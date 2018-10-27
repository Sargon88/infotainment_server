<?php

require_once "include.php";

$body = file_get_contents('php://input');

$jsonObj = json_decode($body);
$action = $jsonObj->action;


switch ($action) {
    case "authenticate":
        $auth = new authenticate();
        
        $rsp = $auth->doAuthenticate();
        echo $rsp;

        break;
    case "status":
       
        $status = $jsonObj;

        $rsp = $ps->updateStatus($status);

        //debug
        echo $rsp;
        //debug

        $rsp = $ps->returnStatus();
        $socketio = new SocketIO();
        $socketio->send('127.0.0.1', 8080, 'phone status', $rsp);

        break;
    case "changepage":

        $page = $jsonObj->page;

        $socketio = new SocketIO();
        $socketio->send('127.0.0.1', 8080, 'change page', $page);

        $rsp->esito="true";
        $rsp->page=$page;

        $response = json_encode($rsp);

        echo $response;

        break;
    case "calling":
    
        $calling = $jsonObj;
        $number = $calling->number;
        $socketio = new SocketIO();
        $socketio->send('127.0.0.1', 8080, 'calling', $number);

        break;
    case "call_end":

        $calling = $jsonObj;
        $number = $calling->number;
        $socketio = new SocketIO();
        $socketio->send('127.0.0.1', 8080, 'call end', $number);

        break;
    case "answer":

        $calling = $jsonObj;
        $number = $calling->number;
        $socketio = new SocketIO();
        $socketio->send('127.0.0.1', 8080, 'call answer', $number);

        break;    
    case "";
        echo "ok";
        break;
}

?>
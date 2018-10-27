<?php

class authenticate {

    //variables
    public $response;

    
    //functions
    public function doAuthenticate (){
        $esito = true;
        $response->hash = "aaa"; 

        /*

        $esito = session_start();
        $body = file_get_contents('php://input');



        if($esito && $body != null){
            
            $jsonObj = json_decode($body);
            $ip = $jsonObj->ip;
            $hash = md5(uniqid($ip, true));

            $_SESSION["CLIENT_IP"] = $ip;
            $_SESSION["CLIENT_HASH"] = $hash;
            $_SESSION["CLIENT_LOG_TIME"] = date("d-m-Y H:i:s");

            $data = new stdClass();
            $data->hash = new stdClass();
            $data->esito = new stdClass();

            $data->hash = $hash;

        } else {
            $data = new stdClass();
            $data->msg = new stdClass();
            $data->esito = new stdClass();

            $data->msg = "Impossibile avviare la sessione";
        }
        */
        $response->esito = $esito;
        $rsp = json_encode($response);

        echo $rsp;
    }

}

?>
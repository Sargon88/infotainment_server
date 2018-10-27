<?php

final class PhoneStatus{

    //variables
    public $batt;
    public $wifi;
    public $bluet;
    public $line;
    public $latitude;
    public $longitude;

    private static $instance = NULL;

    //functions
    /**
     * Private ctor so nobody else can instantiate it
     *
     */
    private function __construct(){
        $this->batt = 0;
        $this->wifi = false;
        $this->bluet = false;
        $this->signal = 0;
        $this->latitude = 0;
        $this->longitude = 0;


    }

    public function updateStatus($status){

        $rsp->esito = true;
        $rsp->batt = $status->batt;

        $this->batt = $status->batt;
        $this->wifi = $status->wifi;
        $this->bluet = $status->bluetooth;
        $this->signal = $status->signal;
        $this->latitude = $status->latitude;
        $this->longitude = $status->longitude;

        return json_encode($rsp);
    }

    public function returnStatus(){

        $rsp->esito = true;
        $rsp->phonestat->batt = $this->batt;
        $rsp->phonestat->bluetooth = $this->bluet;
        $rsp->phonestat->wifi = $this->wifi;
        $rsp->phonestat->signal = $this->signal;
        $rsp->phonestat->latitude = $this->latitude;
        $rsp->phonestat->longitude = $this->longitude;

        return json_encode($rsp);
    }

    public static function getInstance(){
        static $instance = null;
        if($instance === null){
            $instance = new PhoneStatus();
        }
        
        return $instance;
        
    }

}

?>
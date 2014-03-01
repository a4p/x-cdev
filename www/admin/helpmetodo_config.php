<?php
require_once(__DIR__ . '/../l4p/src/php/c4p/env/Environment.php');
C4P_Environment::getInstance();// Create default c4p environment

require_once(__DIR__ . '/../l4p/src/php/a4p/common/CacheFile.php');


//$cache = new CacheFile("./../");
//$bok = $cache->createC4P("https://ssl15.ovh.net/~appsprok/c1/c4p_fill.php");

//echo "Cache file ".$cache->getPath()." created(".$bok.")";

//https://127.0.0.1/c4ph5/www/c4p_fill.php https://ssl15.ovh.net/~appsprok/c1/c4p_fill.php
$conf = new File("c4p_conf.json","./../models/");


$body = '{"urlBase":"' . A4P_Environment::getC4pBaseUrl() . '","trustAllHosts" : false}';

$bok = $conf->put($body);
echo "Conf file ".$conf->getPath()." created(".$bok.")";

?>


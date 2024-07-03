<?php

header('Content-type: application/json');
header("Cache-control: private");

foreach ($_GET as $k => $v)
	if(preg_match('/[^0-9a-z-]/', $k) || preg_match('/[^0-9a-zA-Z,-\/]/', $v))
		die("Oops");

$mc = new Memcached('xboxstat3');
if (!count($mc->getServerList()))
	$mc->addServer( '127.0.0.1', 11211 );

$txt = $mc->get($_SERVER['QUERY_STRING']);

if( $txt )      {
	echo $txt;
	return 0;
}

// to github users: db server is answering to unix sockets only, so don't be excited with password provided here :)
// Drop me a message if you want access to my PostgreSQL

$db = pg_connect("port=6432 host=/tmp dbname=xbox user=readonly password=masha27uk")	# , PGSQL_CONNECT_FORCE_NEW)
	or die("could not connect to DB");

$rep = array();

if( substr( $_GET['f'], 0, 3) == 'get' )
	$_GET['f']();

$to = 3;      # timeout

$txt = json_encode($rep, JSON_UNESCAPED_UNICODE);
$mc->set($_SERVER['QUERY_STRING'], $txt, $to);


header("Cache-control: max-age=$to");

echo $txt;

# functions goes here

function getgame()	{

	global $db, $rep;

	$t = $_GET['titleid'];

	$rep[] = pg_fetch_all(pg_query("select * from games where titleid=$t"));

}



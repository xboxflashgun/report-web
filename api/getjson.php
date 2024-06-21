<?php

header('Content-type: application/json');
header("Cache-control: private");
header("Cache-control: max-age=1");

foreach ($_GET as $k => $v)
	if(preg_match('/[^0-9a-z-]/', $k) || preg_match('/[^0-9a-zA-Z,-\/]/', $v))
		die("Oops");

$db = pg_connect("port=6432 dbname=global user=readonly password=masha27uk")	# , PGSQL_CONNECT_FORCE_NEW)
	or die("could not connect to DB");

$rep = array();

$_GET['f']();

echo json_encode($rep, JSON_UNESCAPED_UNICODE);

# functions goes here

function getcatalogs()	{

	global $db, $rep;

	static $cats = array(
		"country" => "countryid as id,country as name,name as desc from stattotals1 join countries using(countryid)",
		"lang" => "langid as id,lang as name,name as desc from stattotals1 join languages using(langid)",
		"genre" => "genreid as id,genre as name,'' as desc from genres join gamegenres using(genreid) join stattotals1 using(titleid)",
		"game" => "games.titleid as id,name,'' as desc from games join repstat using(titleid)"
	);

	foreach ($cats as $k => $v)
		$rep[$k] = pg_fetch_all(pg_query("select distinct $v"));

}

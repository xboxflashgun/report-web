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

if( substr( $_GET['f'], 0, 3) == 'get' )
	$_GET['f']();

echo json_encode($rep, JSON_UNESCAPED_UNICODE);

# functions goes here

function getcatalogs()	{

	global $db, $rep;

	static $cats = array(
		"country" => "countryid as id,country as name,name as desc from repstat join countries using(countryid)",
		"lang" => "langid as id,lang as name,name as desc from repstat join languages using(langid)",
		"genre" => "genreid as id,genre as name,'' as desc from genres join gamegenres using(genreid) join repstat using(titleid)",
		"game" => "games.titleid as id,name,'' as desc from games join repstat using(titleid)"
	);

	foreach ($cats as $k => $v)
		$rep[$k] = pg_fetch_all(pg_query("select distinct $v"));

}

function getinfo()	{

	global $db, $rep;
	# select count(distinct titleid),count(distinct countryid),count(distinct langid) from repstat
	# select players,secs from repstat where titleid=0 and countryid=0 and langid=0

	$where = "true";

	if(strlen($_GET['country']) > 0)
		$where .= " and countryid=any(array[" . $_GET['country'] . "])";
	else
		$where .= " and countryid<>0";

	if(strlen($_GET['lang']) > 0)
		$where .= " and langid=any(array[" . $_GET['lang'] . "])";
	else
		$where .= " and langid<>0";

	if(strlen($_GET['game']) > 0)
		$where .= " and titleid=any(array[" . $_GET['game']. "])";

	if(strlen($_GET['genre']) > 0)
		$where .= " and titleid=any(select titleid from gamegenres where genreid=any(array[" . $_GET['genre'] . "]))";

	if(strlen($_GET['genre']) == 0 && strlen($_GET['game']) == 0) 
		$where .= ' and titleid<>0';

	$join = ($block == 'genre') ? "join gamegenres using(titleid)" : "";


	$req = "
		select 
			count(distinct titleid) as games,
			count(distinct countryid) as countries,
			count(distinct langid) as langs,
			count(distinct genreid) as genres
		from repstat 
		join gamegenres using(titleid)
		where $where
	";

	error_log($req);

	$rep[] = pg_fetch_all(pg_query($req));
	$rep[] = pg_fetch_all(pg_query("select sum(players) as players from repstat where $where"));

}



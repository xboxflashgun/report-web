<?php
    
header('Content-type: text/csv');
header("Cache-control: private");

foreach ($_GET as $k => $v)
	if(preg_match('/[^0-9a-z_-]/', $k) || preg_match('/[^,0-9A-Za-z \/=-]/', $v))
		die("Oops: $k, $v");

$mc = new Memcached('xboxstat2');
if (!count($mc->getServerList()))
	$mc->addServer( '127.0.0.1', 11211 );

$rep = $mc->get($_SERVER['QUERY_STRING']);

if( $rep )      {
	echo $rep;
	return 0;
}

$db = pg_connect("port=6432 dbname=global user=readonly password=masha27uk")	# , PGSQL_CONNECT_FORCE_NEW)
	or die("could not connect to DB");

$rep = "";

if( substr( $_GET['f'], 0, 3) == 'get' )
	$_GET['f']();

$to = 300;		# timeout

$mc->set($_SERVER['QUERY_STRING'], $rep, $to);
header("Cache-control: max-age=$to");
echo $rep;

######################################################
#
# returns: id, players, secs
#
function getblock()	{

	global $db, $rep;

	$block = $_GET['block'];
	$where = "true";
	$union = "";

	if(strlen($_GET['country']) > 0 && $block != 'country')
		$where .= " and countryid=any(array[" . $_GET['country'] . "])";
	elseif($block != 'country')
		$where .= " and countryid=0";

	if(strlen($_GET['lang']) > 0 && $block != 'lang')
		$where .= " and langid=any(array[" . $_GET['lang'] . "])";
	elseif($block != 'lang')
		$where .= " and langid=0";

	if(strlen($_GET['game']) > 0 && $block != 'game')
		$where .= " and titleid=any(array[" . $_GET['game']. "])";

	if(strlen($_GET['genre']) > 0 && $block != 'genre')
		$where .= " and titleid=any(select titleid from gamegenres where genreid=any(array[" . $_GET['genre'] . "]))";

	if(strlen($_GET['genre']) == 0 && strlen($_GET['game']) == 0) 
		if($block != 'genre' && $block != 'game')
			$where .= ' and titleid=0';

	$join = ($block == 'genre') ? "join gamegenres using(titleid)" : "";
	$select = ($block == 'game') ? "title" : $block;
	$select .= "id";

	if($block == 'genre')
		$union = "
		union
		select 0,sum(players),sum(secs)
		from repstat
		where $where
		group by 1
	";

	$req = "
		select $select,sum(players),sum(secs)
		from repstat
		$join
		where $where
		group by 1
		$union
	";

	# error_log($req);

	$rep = implode(pg_copy_to($db, "( $req )", chr(9)));

}

function getgraph()	{

	global $db, $rep;

	$block = $_GET['block'];
	$period = $_GET['period'];
	$where = "true";
	$whref = "true";

	$list = ($block == 'info') ? "0" : $_GET['list'];
	$sel = ($block == 'info') ? "0" : (($block == 'game') ? "titleid" : $_GET['block']."id");

	if(strlen($_GET['country']) > 0) {
		$where .= " and countryid=any(array[" . $_GET['country'] . "])";
		$whref .= " and countryid is not null";
	} elseif($block == 'country') {
		$where .= " and countryid is not null";
		$whref .= " and countryid is not null";
	} else {
		$where .= " and countryid is null";
		$whref .= " and countryid is null";
	}

	if(strlen($_GET['lang']) > 0) {
		$where .= " and langid=any(array[" . $_GET['lang'] . "])";
		$whref .= " and langid is not null";
	} elseif($block == 'lang') {
		$where .= " and langid is not null";
		$whref .= " and langid is not null";
	} else {
		$where .= " and langid is null";
		$whref .= " and langid is null";
	}

	if(strlen($_GET['game']) > 0) {
		$where .= " and titleid=any(array[" . $_GET['game']. "])";
		$whref .= " and titleid is not null";
	}

	if(strlen($_GET['genre']) > 0) {
		$where .= " and titleid=any(select titleid from gamegenres where genreid=any(array[" . $_GET['genre'] . "]))";
		$whref .= " and titleid is not null";
	}

	if(strlen($_GET['game']) == 0 && strlen($_GET['genre']) == 0)
		if($block == 'game' || $block == 'genre')	{
			$where .= " and titleid is not null";
			$whref .= " and titleid is not null";
		} else {
			$where .= " and titleid is null";
			$whref .= " and titleid is null";
		}

	$join = (strlen($_GET['genre']) > 0 || $block == 'genre') ? "join gamegenres using(titleid)" : "";

	$req = "
		select 
			utime,	
			$sel,
			sum(players) filter (where $where) as players,
			sum(players) filter (where $whref) as refpl,
			sum(secs) filter (where $where) as secs,
			sum(secs) filter (where $whref) as refsecs
		from reptab$period
		$join
		where $sel = any(array[$list])
		group by 1,2
		order by 1
	";
		
	error_log($req);

	$rep = implode(pg_copy_to($db, "( $req )", chr(9)));

}






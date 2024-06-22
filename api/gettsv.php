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

$to = 1;		# timeout

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

	error_log($req);

	$rep = implode(pg_copy_to($db, "( $req )", chr(9)));

}



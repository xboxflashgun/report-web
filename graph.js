// data[id]: {
//  	utime:
//  	time:
//  	players:
//  	secs:
//  	refpl:
//  	refsecs:
//  	val:
//  	valabs:
//  	valper:
// }

var graph = {
	data: {},
};

function read_graph()	{

	var req = mkreqstr();
	
	var b = d3.select('input[name="graph"]:checked').property("value");
	console.log(b);
	var block = blocks[b];

	if(block.sels)
		if(block.sels.size > 0)
			req += "&list=" + Array.from(block.sels).join(',');
		else
			req += "&list=" + block.data.sort( (a,b) => b.val - a.val ).slice(0,10).map(d => d.id).join(',');

	console.log(req);

	fetch("api/gettsv.php?f=getgraph" + req)
	.then( res => res.text() )
	.then( res => {

		Object.keys(graph.data).forEach(key => delete graph.data[key]);

		res.split('\n').forEach( s => {

			if(s.length === 0)
				return;

			var row = s.split('\t');

			graph.data[row[1]] ??= [];
			graph.data[row[1]].push({
				utime: +row[0],
				players: +row[2],
				refpl: +row[3],
				secs: +row[4],
				refsecs: +row[5],
				time: new Date(+row[0] * 1000),
			});

		});

		console.log(graph.data);

	});

}

function draw_graph()	{

}


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

}

function draw_graph()	{

}


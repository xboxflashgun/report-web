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

		draw_graph();

	});

}

function draw_graph()	{

	var div = d3.select("#graph");

	const margin = { top: 10, right: 10, bottom: 20, left: 40},
		width = div.node().clientWidth - margin.left - margin.right,
		height = div.node().clientHeight - margin.top - margin.bottom;

	div.select("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom);

	var svg = div.select("#graph-main")
		.attr("transform", `translate(${margin.left},${margin.top})`);

	svg.select(".xaxis")
		.attr("transform", `translate(0, ${height})`);

	var [ xmin, xmax ] = d3.extent(Array.prototype.flat.call(Object.keys(graph.data).map(d => graph.data[d].map(e => e.time))));

	// calculating data for graph
	
	var units = d3.select('input[name="valtype"]:checked').property("value");
	var abflg = d3.select('input[value="abs"]').property("checked");

	var ndays = (new Date() - new Date(2024, 2, 3))/3600/24/1000;
	if(period === 1)
		ndays /= 7;				// week
	else if(period === 2)
		ndays /= 30.6;			// month
	else if(period === 3)
		ndays /= 91.3125;		// quarter
	else if(period === 4)
		ndays /= 365.25;

	Object.keys(graph.data).forEach( id => {
		graph.data[id].forEach( d => {
			
			if(units === 'players')
				[ d.valabs, d.valper ] = [ d.players, d.players/d.refpl ];
			else if(units === 'time')
				[ d.valabs, d.valper ] = [ d.secs/3600, d.secs/d.refsecs ];
			else
				[ d.valabs, d.valper ] = [ d.secs/d.players/3600/ndays, (d.secs / d.players) / (d.refsecs/d.refpl) ];

			d.val = (abflg) ? d.valabs : d.valper;

		});
	});

	var ymax = d3.max(Array.prototype.flat.call(Object.keys(graph.data).map(d => graph.data[d].map(e => e.val))));

	console.log(ymax);
	console.log(graph.data)

	var x = d3.scaleTime( [ xmin, xmax ], [ 0, width ] );
	var y = d3.scaleLinear( [ 0, ymax ], [ height, 0 ]);

	var xaxis = d3.axisBottom().scale(x);
	var yaxis = d3.axisLeft().scale(y).tickFormat(d3.format( abflg ? ".3~s" : ".0%"));
	var color = d3.scaleOrdinal(Object.keys(graph.data), d3.schemeObservable10);

	svg.selectAll(".xaxis").call( xaxis );
	svg.selectAll(".yaxis").call( yaxis );

	const t = d3.transition().duration(750);

	svg.selectAll(".line")
	.data(Object.keys(graph.data))
	.join(enter => {
		enter.append("path")
			.attr("class", "line")
			.attr("fill", "none")
			.attr("data-id", id => id)
			.attr("stroke", id => color(id))
			.attr("stroke-width", 1.5)
			.attr("d", id => d3.line(d => x(d.time), d => y(d.val) )(graph.data[id]));
	}, update => {
		update.call( s => s.transition(t)
			.attr("stroke", id => color(id))
			.attr("data-id", id => id)
			.attr("d", id => d3.line(d => x(d.time), d => y(d.val) )(graph.data[id])));
	}, exit => exit.remove() );


}


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
	avg: {},		// average val to sort legend
	sum: {},		// sum for avg
	cnt: {},		// cnt for agv
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
				players: (row[2] === '\\N') ? 0 : +row[2],
				refpl: +row[3],
				secs: (row[4] === '\\N') ? 0 : +row[4],
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
	var b = d3.select('input[name="graph"]:checked').property("value");
	var legend = d3.select("#legend");



	var ndays = (new Date() - new Date(2024, 2, 3))/3600/24/1000;
	if(period === 1)
		ndays /= 7;				// week
	else if(period === 2)
		ndays /= 30.6;			// month
	else if(period === 3)
		ndays /= 91.3125;		// quarter
	else if(period === 4)
		ndays /= 365.25;

	// dealing with percentage
	if( ! abflg )	{

		var nosels = true;		// if no selections of interest

		Object.keys(blocks).forEach( bb => {

			if(b === bb || (b === 'game' && bb === 'genre') || bb === 'info')
				return;
			if(blocks[bb].sels.size > 0)
				nosels = false;

		});

		// if no sels -- need to change ref to sum or max, max for avgtime only
		var refpl = {};
		var refsecs = {};
		var refcnt = {};
		Object.keys(graph.data).forEach( id => {

			graph.data[id].forEach( d => {

				refsecs[d.utime] ??= 0;
				refpl[d.utime] ??= 0;
				refcnt[d.utime] ??= 0;
				refsecs[d.utime] += d.secs;
				refpl[d.utime] += d.players;
				refcnt[d.utime] ++;

			});

		});

		Object.keys(graph.data).forEach( id => {

			graph.data[id].forEach( d => {

				if(units === 'avgt')	{
					d.refpl = refpl[d.utime]/refcnt[d.utime];
					d.refsecs = refsecs[d.utime]/refcnt[d.utime];
				} else {
					d.refpl = refpl[d.utime];
					d.refsecs = refsecs[d.utime];
				}

			});

		});

	}

	Object.keys(graph.avg).forEach( id => { delete graph.avg[id]; delete graph.sum[id]; delete graph.cnt[id]; } );
	Object.keys(graph.data).forEach( id => {

		[ graph.sum[id], graph.cnt[id] ] = [ 0, 0 ];

		graph.data[id].forEach( d => {
			
			if(units === 'players')
				[ d.valabs, d.valper ] = [ d.players, d.players/d.refpl ];
			else if(units === 'time')
				[ d.valabs, d.valper ] = [ d.secs/3600, d.secs/d.refsecs ];
			else
				[ d.valabs, d.valper ] = [ d.secs/((d.players) ? d.players : 1)/3600/ndays, (d.secs / ((d.players) ? d.players : 1)) / (d.refsecs/d.refpl) ];

			d.val = (abflg) ? d.valabs : d.valper;
			graph.sum[id] += d.val;
			graph.cnt[id]++;

		});

		graph.avg[id] = graph.sum[id] / graph.cnt[id];

	});


	var ymax = d3.max(Array.prototype.flat.call(Object.keys(graph.data).map(d => graph.data[d].map(e => e.val))));

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

	var vline = d3.select("#graph-rect")
	vline.select("rect")
		.attr("pointer-events", "all")
		.on("mousemove", e => {

			var [ mx, my ] = d3.pointer(e);
			if(mx < margin.left || mx > width + margin.left)
				return;

			vline.select("line")
				.attr("x1", mx)
				.attr("x2", mx)
				.attr("y1", margin.top)
				.attr("y2", height+margin.top)
				.attr("display", null);

			var t = x.invert(mx - margin.left);
			let indpr, idpr;

			Object.keys(graph.data).forEach( id => {
				ind = graph.data[id].findIndex( d => d.time > t );
				var tr = legend.select(`tr[data-id="${id}"]`);
				if(graph.data[id][ind-1]) {
					tr.select("td:nth-child(3)").text((units === 'players') ? d3.format(".3~s")(graph.data[id][ind-1].valabs)
											: hours2str(graph.data[id][ind-1].valabs));
					tr.select("td:nth-child(4)").text(d3.format(".3%")(graph.data[id][ind-1].valper));
					[ indpr, idpr ] = [ ind, id ];
				}
			});

			var names = [ 'Day', 'Week starting from', 'Month starting from', 'Quarter starting from', 'Year from' ];
			var dow = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(graph.data[idpr][indpr-1].time);
			legend.select(".legendhead").text(names[period] + " " + graph.data[idpr][indpr-1].time.toLocaleString().slice(0,10) + ", " + dow);

			Object.keys(graph.data).forEach( id => {
				if(graph.data[id][indpr-1] && Math.abs(my - y(graph.data[id][indpr-1].val) - margin.top) < 5) {
					legend.select(`tr[data-id="${id}"]`).style("color", "#fff");
					svg.selectAll(`path[data-id="${id}"]`).attr("stroke-width", 3);
				} else {
					legend.select(`tr[data-id="${id}"]`).style("color", "#999");
					svg.selectAll(`path[data-id="${id}"]`).attr("stroke-width", 1.5);
				}
			});

		})
		.on("mouseout", () => {

			vline.select("line").attr("display", "none");
			legendavg();

		});

	// legend
	legend
		.style("top", "236px")
		.style("left", "742px")
		.style("display", null)
		.call(d3.drag()
		.on("start", (e) => legend.style("cursor", "drag"))
		.on("drag", (e) => {
			legend.style("top", legend.node().offsetTop + e.dy + "px");
			legend.style("left", legend.node().offsetLeft + e.dx + "px");
		})
		.on("end", (e) => legend.style("cursor", "default"))
		);
	
	function legtext(id)	{

		if(id === "0")
			return "All games";

		var text = blocks[b].name[id].desc ? blocks[b].name[id].desc : blocks[b].name[id].name;

		return text;

	}

	legend.select("#legend table").selectAll("tr")
	.data(Object.keys(graph.avg).sort( (a,b) => graph.avg[b] - graph.avg[a] ))
	.join( enter => {
		var row = enter.append("tr");
		row.attr("data-id", d => d);
		row.append("td").html("&#x25a0;").style("color", id => color(id));
		row.append("td").text(d => legtext(d))
		row.append("td").text(d => "");
		row.append("td").text(d => "");
	}, update => {
		update.select("td:nth-child(1)").style("color", id => color(id));
		update.select("td:nth-child(2)").text(d => legtext(d));
		update.attr("data-id", d => d);
	}, exit => exit.remove()
	);

	legend.select("#legend table").selectAll("tr")
	.on("mouseover", e => {

		var id = e.target.parentNode.dataset.id;
		svg.selectAll(`path[data-id="${id}"]`)
			.attr("stroke-width", 3);
		d3.select(e.target.parentNode).style("color", "#fff");

	})
	.on("mouseout", e => {

		var id = e.target.parentNode.dataset.id;
		svg.selectAll(`path[data-id="${id}"]`)
		.attr("stroke-width", 1.5);
		d3.select(e.target.parentNode).style("color", "#999");

	});

	function legendavg()	{

		Object.keys(graph.avg).forEach( id => {
			var tr = legend.select(`tr[data-id="${id}"]`);
			var v = graph.avg[id];
			if( ! abflg )
				v = d3.format(".3%")(v);
			else if(units === 'players')
				v = d3.format(".3~s")(v);
			else
				v = hours2str(v);
			tr.select("td:nth-child(3)").text( v );
			tr.select("td:nth-child(4)").text("");
		});
		legend.select(".legendhead").text("Average over graph");

	}

	legendavg();

}


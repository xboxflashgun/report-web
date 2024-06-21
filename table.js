function draw_table(b)	{

	var block = blocks[b];
	var tab = d3.select("#" + b + " tbody");

	var plflg = d3.select('input[value="players"]').property("checked");
	var abflg = d3.select('input[value="abs"]').property("checked");

	block.data.forEach( d => {
		d.valabs = (plflg) ? d.players : d.secs/block.players/3600;
		d.valper = d.valabs / ( (plflg) ? block.players : block.secs );
		d.val = (abflg) ? d.valabs : d.valper;
	});

	console.log(b,block);

	var input = d3.select(`#${b} input[type="text"]`);
	var str = input.property("value").toLowerCase();
	var fff;	// filter function

	if(str.length > 0) 
		fff = a => a.toLowerCase().indexOf(str) >= 0;
	else
		fff = a => true;

	input.on('input', () => draw_table(b) );

	tab.selectAll("tr")
	.data(block.data
		.filter(d => fff(block.name[d.id].name))
		.sort( (a,b) => b.val - a.val )
		.slice(0, 500)
	)
	.join( enter => {
		var row = enter.append("tr");
		row.attr("data-id", d => d.id);
		row.append("td").text(d => block.name[d.id].name);
		row.append("td").text(d => d3.format(".3~s")(d.valabs));
		row.append("td").text(d => d3.format(".3%")(d.valper));
	}, update => {
		update.attr("data-id", d => d.id);
		update.select("td:nth-child(1)").text(d => block.name[d.id].name);
	}, exit => exit.remove()
	);

}


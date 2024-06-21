function draw_table(b)	{

	var block = blocks[b];
	var tab = d3.select("#" + b + " tbody");

	var plflg = d3.select('input[value="players"]').property("checked");
	var abflg = d3.select('input[value="abs"]').property("checked");

	block.data.forEach( d => {
		d.val = (plflg) ? d.players : d.secs;
		d.val = (abflg) ? d.val : d.val / ( (plflg) ? block.players : block.secs );
	});

	console.log(b,block);

	var str = d3.select(`#${b} input[type="text"]`).property("value").toLowerCase();
	var fff;	// filter function

	if(str.length > 0) 
		fff = a => a.toLowerCase().indexOf(str) >= 0;
	else
		fff = a => true;

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
	}, update => {
		update.attr("data-id", d => d.id);
		update.select("td:nth-child(1)").text(d => d.id);
	}, exit => exit.remove()
	);

}


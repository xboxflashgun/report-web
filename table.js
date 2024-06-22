function draw_table(b)	{

	var block = blocks[b];
	var tab = d3.select("#" + b + " tbody");

	var plflg = d3.select('input[value="players"]').property("checked");
	var abflg = d3.select('input[value="abs"]').property("checked");

	block.data.forEach( d => {
		d.valabs = (plflg) ? d.players : d.secs/d.players/3600;
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
		row.append("td").attr("title", d => block.name[d.id].desc ? block.name[d.id].desc : block.name[d.id].name)
			.text(d => (block.name[d.id].desc) ? block.name[d.id].desc : block.name[d.id].name);
		row.append("td").attr("title", d => d.valabs).text(d => d3.format(".3~s")(d.valabs));
		row.append("td").attr("title", d => 100 * d.valper + "%").text(d => d3.format(".3%")(d.valper));
	}, update => {
		update.attr("data-id", d => d.id);
		update.select("td:nth-child(1)").attr("title", d => block.name[d.id].desc ? block.name[d.id].desc : block.name[d.id].name)
			.text(d => (block.name[d.id].desc) ? block.name[d.id].desc : block.name[d.id].name);
		update.select("td:nth-child(2)").attr("title", d => d.valabs).text(d => d3.format(".3~s")(d.valabs));
		update.select("td:nth-child(3)").attr("title", d => 100 * d.valper + "%").text(d => d3.format(".3%")(d.valper));
	}, exit => exit.remove()
	);

	tab.selectAll("tr").style('color', null);
	Array.from(block.sels).forEach( id => tab.select(`tr[data-id="${id}"]`).style('color', '#fff') );

	tab.selectAll("tr").on('click', e => {
		var id = e.target.parentNode.dataset.id;
		console.log(b, id); 
		if(block.sels.has(id))
			block.sels.delete(id);
		else
			block.sels.add(id);

		read_alldata();

	});

}


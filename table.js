function draw_table(b)	{

	var block = blocks[b];
	var tab = d3.select("#" + b + " tbody");

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

	block.data.forEach( d => {
		if(units === 'players')
			[ d.valabs, d.valper ] = [ d.players, d.players/block.players ];
		else if(units === 'time')
			[ d.valabs, d.valper ] = [ d.secs/3600, d.secs/block.secs ];
		else
			[ d.valabs, d.valper ] = [ d.secs/d.players/3600/ndays, (d.secs / d.players) / (block.secs/block.players) ];

		d.val = (abflg) ? d.valabs : d.valper;
	
	});

	var input = d3.select(`#${b} input[type="text"]`);
	var str = input.property("value").toLowerCase();
	var fff;	// filter function

	if(str.length > 0) 
		fff = a => a.toLowerCase().indexOf(str) >= 0;
	else
		fff = a => true;

	var valmax = d3.max(block.data.filter(d => fff(block.name[d.id].name)), d => d.val);

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
		row.style("background", d => `linear-gradient(to right, #050 ${100.*d.valabs/valmax}%, rgba(0,0,0,0) ${100.*d.valabs/valmax}% )`);
	}, update => {
		update.attr("data-id", d => d.id);
		update.select("td:nth-child(1)").attr("title", d => block.name[d.id].desc ? block.name[d.id].desc : block.name[d.id].name)
			.text(d => (block.name[d.id].desc) ? block.name[d.id].desc : block.name[d.id].name);
		update.select("td:nth-child(2)").attr("title", d => d.valabs).text(d => d3.format(".3~s")(d.valabs));
		update.select("td:nth-child(3)").attr("title", d => 100 * d.valper + "%").text(d => d3.format(".3%")(d.valper));
		update.style("background", d => `linear-gradient(to right, #050 ${100.*d.valabs/valmax}%, rgba(0,0,0,0) ${100.*d.valabs/valmax}% )`);
	}, exit => exit.remove()
	);

	tab.selectAll("tr").style('color', null);
	Array.from(block.sels).forEach( id => tab.select(`tr[data-id="${id}"]`).style('color', '#fff') );

	tab.selectAll("tr").on('click', e => {
		var id = e.target.parentNode.dataset.id;
		if(block.sels.has(id))
			block.sels.delete(id);
		else
			block.sels.add(id);

		list_filters();
		read_alldata();

	});

}


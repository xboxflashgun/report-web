var blocks = {

	info: {
	},
	country: {
		name: {},
		sels: new Set(),
		data: [],
	},
	lang: {
		name: {},
		sels: new Set(),
		data: [],
	},
	genre: {
		name: {},
		sels: new Set(),
		data: [],
	},
	game: {
		name: {},
		sels: new Set(),
		data: [],
	},

};

var period = 1;

function main()	{

	read_catalogs();
	d3.selectAll(".permark").classed("permark", false);
	d3.select(`#periodselect th:nth-child(${5 - period})`).classed("permark", true);

}

function read_catalogs()	{

	var pr = [];

	fetch("api/getjson.php?f=getcatalogs")
	.then( res => res.json() )
	.then( res => {

		Object.keys(res).forEach( b => {

			res[b].forEach( a =>
				blocks[b].name[a.id] = {
					name: a.name,
					desc: (a.desc == "") ? undefined : a.desc,
				});

			pr.push(read_data(b));

		});

		Promise.all(pr)
		.then( ()=> {

			draw_table('genre', 0);		// block.players and block.secs are ready

			// block data is read
			d3.select("#valselect").selectAll("input").on('change', () => {
				Object.keys(blocks).forEach( b => {
					if(blocks[b].data)
						draw_table(b, 0);
				});

			});

		});

	});

}

function read_data(b)	{

	var req = mkreqstr() + "&block=" + b;
	return fetch("api/gettsv.php?f=getblock" + req)
	.then( res => res.text() )
	.then( res => {

		blocks[b].data = [];

		res.split('\n').forEach( s => {

			if(s.length === 0)
				return;

			var [ id, players, secs ] = s.split('\t');
			if( id != 0 )
				blocks[b].data.push( { id: id, players: +players, secs: +secs } );
			else
				[ blocks[b].players, blocks[b].secs ] = [ +players, +secs ];

		});

		draw_table(b, 1);
		if(b === 'game')
			[ blocks['genre'].players, blocks['genre'].secs ] = [ blocks[b].players, blocks[b].secs ];

	});

}

function mkreqstr()	{

	var req = "&period=" + period;
	req += "&subj=" + d3.select('#info input[name="graph"]:checked').property("value");
	Object.keys(blocks).forEach( b => {
		if(blocks[b].sels)
			req += "&" + b + "=" + Array.from(blocks[b].sels).join(',')
	});

	return req;

}

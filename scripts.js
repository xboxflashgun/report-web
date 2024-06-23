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

var period = 1;		// on change do a correction in index also

function main()	{

	read_catalogs();
	d3.selectAll("#periodselect th").on('click', e => {
		
		var p = 4 - e.target.cellIndex;
		if(p === period)
			return;
		period = p;

		d3.selectAll(".permark").classed("permark", false);
		d3.select(`#periodselect th:nth-child(${5 - period})`).classed("permark", true);

		Object.keys(blocks).forEach( b => {
			if(blocks[b].data)
				draw_table(b);

		});
	
	});

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
		
		read_info();

		Promise.all(pr)
		.then( ()=> {

			// block data is read
			d3.select("#valselect").selectAll("input").on('change', () => {
				Object.keys(blocks).forEach( b => {
					if(blocks[b].data)
						draw_table(b);
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

		draw_table(b);

	});

}

function read_alldata()	{

	Object.keys(blocks).forEach( b => {

		if(blocks[b].data)
			read_data(b);

	});

	read_info();

}

function read_info() {

	var req = mkreqstr();
	fetch("api/getjson.php?f=getinfo" + req)
	.then( res => res.json() )
	.then( res => {

		console.log(res);
		var tab = d3.select("#graphsel");
		tab.select("tr:nth-child(1) td:nth-child(2)").text(res[1][0].players);
		tab.select("tr:nth-child(2) td:nth-child(2)").text(res[0][0].games);
		tab.select("tr:nth-child(3) td:nth-child(2)").text(res[0][0].countries);
		tab.select("tr:nth-child(4) td:nth-child(2)").text(res[0][0].langs);
		tab.select("tr:nth-child(5) td:nth-child(2)").text(res[0][0].genres);

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

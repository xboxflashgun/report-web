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

	console.log('hi');
	read_catalogs();
	d3.selectAll(".permark").classed("permark", false);
	d3.select(`#periodselect th:nth-child(${5 - period})`).classed("permark", true);

}

function read_catalogs()	{

	fetch("api/getjson.php?f=getcatalogs")
	.then( res => res.json() )
	.then( res => {

		Object.keys(res).forEach( b => {

			res[b].forEach( a =>
				blocks[b].name[a.id] = {
					name: a.name,
					desc: (a.desc == "") ? undefined : a.desc,
				});

			read_data(b);

		});

	});

}

function read_data(b)	{

	var req = mkreqstr() + "&block=" + b;
	return fetch("api/gettsv.php?f=getblock" + req)
	.then( res => res.text() )
	.then( res => {
		console.log(b, res);
	});

}

function mkreqstr()	{

	var req = "&period=" + period;
	req += "&subj=" + d3.select('#infodiv input[name="graph"]:checked').property("value");
	Object.keys(blocks).forEach( b => {
		if(blocks[b].sels)
			req += "&" + b + "=" + Array.from(blocks[b].sels).join(',')
	});

	console.log("req: ", req);

	return req;

}

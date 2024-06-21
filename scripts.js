var blocks = {

	info: {
	},
	country: {
		name: {},
		sels: new Set(),
	},
	lang: {
		name: {},
		sels: new Set(),
	},
	genre: {
		name: {},
		sels: new Set(),
	},
	game: {
		name: {},
		sels: new Set(),
	},

};

function main()	{

	console.log('hi');
	read_catalogs();

}

function read_catalogs()	{

	fetch("api/getjson.php?f=getcatalogs")
	.then( res => res.json() )
	.then( res => {

		Object.keys(res).forEach( b =>

			res[b].forEach( a =>
				blocks[b].name[a.id] = {
					name: a.name,
					desc: (a.desc == "") ? undefined : a.desc,
				}

		));

		console.log(blocks);

		read_all();

	});

}

function read_all()	{

	var req = "&subj=" + d3.select('#infodiv input[name="graph"]:checked').property("value");
	Object.keys(blocks).forEach( b => {
		if(blocks[b].sels)
			req += "&" + b + "=" + Array.from(blocks[b].sels).join(',')
	});

	console.log("req: ", req);

}

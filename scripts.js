var blocks = {
	info: {
	},
	country: {
	},
	lang: {
	},
	genre: {
	},
	game: {
	},
};

function main()	{

	console.log('hi');
	read_catalogs();

}

function read_catalogs()	{

	fetch("api/getjson.php?f=getcatalogs")
	.then( res => res.json )
	.then( res => {

		console.log(res);

	});

}

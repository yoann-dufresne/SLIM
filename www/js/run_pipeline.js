
var run = document.querySelector('#start');

run.onclick = function () {
	var config = {};
	for (var idx in modules) {
		var module = modules[idx];

		config[module.id] = {
			name: module.name,
			params: module.getConfiguration()
		};
	}

	console.log(config);

	$.post( "/run", config)
	.done(function( data ) {
		console.log( "Data Loaded: " + data );
	});
};

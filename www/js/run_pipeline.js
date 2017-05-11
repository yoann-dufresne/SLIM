
// get unique exec token
var exec_token = '';
$.get('/token_generation')
.done(function(data) {
	exec_token = data;
	console.log(data);
})


// Trigger the execution of the pipeline
var run = document.querySelector('#start');

run.onclick = function () {
	var config = {token:exec_token};
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

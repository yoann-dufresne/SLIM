const exec = require('child_process').spawn;
const fs = require('fs');





// ----- Software executions -----


exports.run = function (token, config, callback) {
	var soft_name = config.name;

	switch (soft_name) {
		case 'pandaseq':
			runPandaseq(token, config, callback);
		break;
		case 'demultiplexer':
			runDtd(token, config, callback);
		break;
		default:
			callback(token, 'Software ' + soft_name + ' undetecteed');
	}
}

var runPandaseq = function (token, config, callback) {
	console.log("Running pandaseq with the command line:");
	console.log('/app/lib/pandaseq/pandaseq \
		-f /app/data/' + token + '/' + config.params.inputs.fwd + ' \
		-r /app/data/' + token + '/' + config.params.inputs.rev + ' \
		-w /app/data/' + token + '/' + config.params.outputs.assembly);

	var child = exec('/app/lib/pandaseq/pandaseq',
		['-f', '/app/data/' + token + '/' + config.params.inputs.fwd,
		'-r', '/app/data/' + token + '/' + config.params.inputs.rev,
		'-w', '/app/data/' + token + '/' + config.params.outputs.assembly]);


	child.stdout.on('data', function(data) {
		fs.appendFileSync('/app/data/' + token + '/' + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync('/app/data/' + token + '/' + config.log, data);
	});
	child.on('close', function(code) {
		if (code == 0)
			callback(token, null);
		else
			callback(token, "pandaseq terminate on code " + code);
	});
};


var runDtd = function (token, config, callback) {
	console.log("Running dtd with the command line:");
	console.log('/app/lib/DTD/dtd \
		-r1 /app/data/' + token + '/' + config.params.inputs.r1 + ' \
		-r2 /app/data/' + token + '/' + config.params.inputs.r2 + ' \
		-e /app/data/' + token + '/' + config.params.inputs.tags + ' \
		-o /app/data/' + token + '/' + config.params.inputs.primers + ' \
		-d /app/data/' + token + '/');

	var child = exec('/app/lib/DTD/dtd',
		['-r1', '/app/data/' + token + '/' + config.params.inputs.r1, 
		'-r2', '/app/data/' + token + '/' + config.params.inputs.r2,
		'-e', '/app/data/' + token + '/' + config.params.inputs.tags,
		'-o', '/app/data/' + token + '/' + config.params.inputs.primers,
		'-d', '/app/data/' + token + '/']);


	child.stdout.on('data', function(data) {
		fs.appendFileSync('/app/data/' + token + '/' + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync('/app/data/' + token + '/' + config.log, data);
	});
	child.on('close', function(code) {
		if (code == 0)
			callback(token, null);
		else
			callback(token, "DTD terminate on code " + code);
	});
};






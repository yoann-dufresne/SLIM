const exec = require('child_process').spawn;
const fs = require('fs');


exports.name = 'demultiplexer';

exports.run = function (token, config, callback) {
	var options = ['-r1', '/app/data/' + token + '/' + config.params.inputs.r1, 
		'-r2', '/app/data/' + token + '/' + config.params.inputs.r2,
		'-e', '/app/data/' + token + '/' + config.params.inputs.tags,
		'-o', '/app/data/' + token + '/' + config.params.inputs.primers,
		'-d', '/app/data/' + token + '/',
		'-t',
		(config.params.params.mistags ? '-m' : '')];

	console.log("Running dtd with the command line:");
	console.log('/app/lib/DTD/dtd', options.join(' '));
	var child = exec('/app/lib/DTD/dtd', options);


	child.stdout.on('data', function(data) {
		fs.appendFileSync('/app/data/' + token + '/' + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync('/app/data/' + token + '/' + config.log, data);
	});
	child.on('close', function(code) {
		if (code == 0) {
			callback(token, null);
		}
		else
			callback(token, "DTD terminate on code " + code);
	});
};
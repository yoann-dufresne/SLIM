const exec = require('child_process').spawn;
const fs = require('fs');


exports.name = 'pandaseq';

exports.run = function (token, config, callback) {
	var options = config.params.params;
	var command = ['-f', '/app/data/' + token + '/' + config.params.inputs.fwd,
		'-r', '/app/data/' + token + '/' + config.params.inputs.rev,
		'-w', '/app/data/' + token + '/' + config.params.outputs.assembly,
		'-t', options.threshold];

	// Length options
	if (options.min_length != -1) {
		command = command.concat(['-l', options.min_length]);
	}
	if (options.max_length != -1) {
		command = command.concat(['-L', options.max_length]);
	}

	// Overlap options
	if (options.min_overlap != -1) {
		command = command.concat(['-o', options.min_overlap]);
	}
	if (options.max_overlap != -1) {
		command = command.concat(['-O', options.max_overlap]);
	}

	console.log('Running pandaseq');
	console.log('/app/lib/pandaseq/pandaseq', command.join(' '));
	var child = exec('/app/lib/pandaseq/pandaseq', command);


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

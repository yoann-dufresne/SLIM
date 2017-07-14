const exec = require('child_process').spawn;
const fs = require('fs');
const tools = require('./toolbox.js');


exports.name = 'pandaseq';

var algorithms = {
	bayesian: 'simple_bayesian',
	fastqjoin: 'ea_util',
	flash: 'flash',
	pear: 'pear',
	rdp: 'rdp_mle',
	stitch: 'stitch',
	uparse: 'uparse'
};

exports.run = function (token, config, callback) {
	var options = config.params.params;
	var directory = '/app/data/' + token + '/';
	var outfile = directory + config.params.outputs.assembly;
	var algo_name = config.params.params.algorithm;

	var command = ['-f', directory + config.params.inputs.fwd,
		'-r', directory + config.params.inputs.rev,
		'-w', outfile,
		'-t', options.threshold,
		'-A', algorithms[algo_name] ? algorithms[algo_name] : 'simple_bayesian'];

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

	// Joining
	console.log('Running pandaseq');
	console.log('/app/lib/pandaseq/pandaseq', command.join(' '));
	fs.appendFileSync(directory + config.log, '--- Command ---\n');
	fs.appendFileSync(directory + config.log, 'pandaseq ' + command.join(' ') + '\n');
	fs.appendFileSync(directory + config.log, '--- Exec ---\n');
	var child = exec('/app/lib/pandaseq/pandaseq', command);


	child.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.on('close', function(code) {
		if (code == 0) {
			// Dereplicate and sort
			tools.dereplicate(outfile, () => {
				tools.sort(outfile, () => {
					callback(token, null);
				});
			});
		} else
			callback(token, "pandaseq terminate on code " + code);
	});
};

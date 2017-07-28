const exec = require('child_process').spawn;
const fs = require('fs');


exports.name = 'demultiplexer';
exports.multicore = true;
exports.category = 'Demultiplexing';

exports.run = function (os, config, callback) {
	let token = os.token;
	var directory = '/app/data/' + token + '/';
	var options = ['-l', directory + config.params.inputs.tags,
		'-p', directory + config.params.inputs.primers,
		'-d', directory,
		'-t',
		(config.params.params.mistags ? '-m' : '')];

	executions = parse_inputs(config.params.inputs);
	exe_left = Object.keys(executions);

	var run_demux = () => {
		var library = exe_left.pop();
		var local_options = options.concat([
			'-rl', library,
			'-r1', directory + executions[library].r1, 
			'-r2', directory + executions[library].r2,
		]);

		var log = directory + config.log;
		console.log("Running dtd with the command line:");
		console.log('/app/lib/DTD/dtd', local_options.join(' '));
		fs.appendFileSync(log, '--- Command ---\n');
		fs.appendFileSync(log, 'dtd ' + local_options.join(' ') + '\n');
		fs.appendFileSync(log, '--- Exec ---\n');
		var child = exec('/app/lib/DTD/dtd', local_options);


		child.stdout.on('data', function(data) {
			fs.appendFileSync(log, data);
		});
		child.stderr.on('data', function(data) {
			fs.appendFileSync(log, data);
		});
		child.on('close', function(code) {
			if (code == 0) {
				if (exe_left.length == 0)
					callback(os, null);
				else
					run_demux();
			}
			else
				callback(os, "DTD terminate on code " + code);
		});
	}
	run_demux();
};

var parse_inputs = (inputs) => {
	var pairs = {};
	for (let id in inputs) {
		// Detect inputs from pairs
		if (id.endsWith('_R1') || id.endsWith('_R2')) {
			let split = id.split('_');

			// Add new library
			if (!pairs[split[0]])
				pairs[split[0]] = {};

			// Add file
			pairs[split[0]][split[1].toLowerCase()] = inputs[id];
		}
	}

	return pairs;
};

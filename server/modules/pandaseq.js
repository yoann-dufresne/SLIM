const exec = require('child_process').spawn;
const fs = require('fs');

const derep = require('./dereplication.js');
const tools = require('../toolbox.js');


exports.name = 'pandaseq';
exports.multicore = true;
exports.category = 'Paired-end joiner';

var algorithms = {
	bayesian: 'simple_bayesian',
	fastqjoin: 'ea_util',
	flash: 'flash',
	pear: 'pear',
	rdp: 'rdp_mle',
	stitch: 'stitch',
	uparse: 'uparse'
};

exports.run = function (os, config, callback) {
	let token = os.token;
	var options = config.params.params;
	var directory = '/app/data/' + token + '/';
	var tmp_outfile = tools.tmp_filename() + '.fasta';
	var algo_name = config.params.params.algorithm;

	// Define the project name regarding the output filename
	var project = config.params.outputs.assembly;
	if (project.lastIndexOf('_panda') == -1)
		project = project.substr(0, project.lastIndexOf('.'));
	else
		project = project.substr(0, project.lastIndexOf('_panda'));

	var command = ['-f', directory + config.params.inputs.fwd,
		'-r', directory + config.params.inputs.rev,
		'-w', directory + tmp_outfile,
		'-t', options.threshold,
		'-A', algorithms[algo_name] ? algorithms[algo_name] : 'simple_bayesian',
		'-d', 'bfsrk',
		'-T', os.cores];

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
			// Params definition for dereplication
			let derep_params = {params: {
				inputs: {fasta: tmp_outfile},
				outputs: {derep: config.params.outputs.assembly},
				params: {}
			},log:config.log};

			// Dereplicate and sort
			derep.run(os, derep_params, (os, msg) => {
				fs.unlink(directory + tmp_outfile, ()=>{});
				
				// Error case
				if (msg != null) {
					callback(os, msg);
					return;
				}

				// Normal case
				tools.sort(directory + config.params.outputs.assembly, () => {
					callback(os, msg);
				});
			});
		} else
			callback(os, "pandaseq terminate on code " + code);
	});
};

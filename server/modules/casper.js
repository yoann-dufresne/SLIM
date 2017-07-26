const exec = require('child_process').spawn;
const fs = require('fs');
const tools = require('./toolbox.js');


exports.name = 'casper';
exports.multicore = true;
exports.category = 'Paired-end joiner';

exports.run = function (os, config, callback) {
	let token = os.token;
	var options = config.params.params;
	var directory = '/app/data/' + token + '/';
	var outfile = config.params.outputs.assembly;
	outfile = outfile.substr(0, outfile.lastIndexOf('.'));
	outfile = directory + outfile;

	// Define the project name regarding the output filename
	var project = config.params.outputs.assembly;
	if (project.lastIndexOf('_casper') == -1)
		project = project.substr(0, project.lastIndexOf('.'));
	else
		project = project.substr(0, project.lastIndexOf('_casper'));

	var command = [directory + config.params.inputs.fwd,
		directory + config.params.inputs.rev,
		'-o', outfile,
		'-t', os.cores,
		'-k', options.kmer,
		'-d', options.quality,
		'-g', options.mismatch,
		'-w', options.min_length];

	// Joining
	console.log('Running casper');
	console.log('/app/lib/casper/casper_v0.8.2/casper', command.join(' '));
	fs.appendFileSync(directory + config.log, '--- Command ---\n');
	fs.appendFileSync(directory + config.log, 'casper ' + command.join(' ') + '\n');
	fs.appendFileSync(directory + config.log, '--- Exec ---\n');
	var child = exec('/app/lib/casper/casper_v0.8.2/casper', command);


	child.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.on('close', function(code) {
		if (code == 0) {
			callback(os, null);
		} else
			callback(os, "casper terminate on code " + code);
	});
};

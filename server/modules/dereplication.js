const exec = require('child_process').spawn;
const fs = require('fs');
const tools = require('../toolbox.js');


exports.name = 'fasta-dereplication';
exports.multicore = false;
exports.category = 'FASTA/FASTQ';

exports.run = (os, config, callback) => {
	var token = os.token;
	var directory = '/app/data/' + token + '/';
	var filename = directory + config.params.inputs.fasta;
	var out_file = directory + config.params.outputs.derep;

	console.log ('Dereplication for file ' + filename);

	// Minimum quantity for the presence of a read
	var threshold = 0;
	if (config && config.params.params && config.params.params.threshold)
		threshold = parseInt(config.params.params.threshold);

	// Command line
	var options = ['--derep_fulllength', filename,
		'--sizeout', '--sizein',
		'--minseqlength', '1',
		'--minuniquesize', threshold,
		'--output', out_file];


	if (config && config.params.params && config.params.params.rename)
		options = options.concat(['--relabel', config.params.params.rename + '_']);

	console.log('Command:\nvsearch', options.join(' '));

	// Execution
	var child = exec('/app/lib/vsearch/bin/vsearch', options);
	child.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.on('close', (code) => {
		if (code != 0) {
			console.log("Error code " + code + " during dereplication");
			callback(os, code);
		} else {
			callback(os, null);
		}
	});
};

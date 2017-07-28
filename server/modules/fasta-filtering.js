const exec = require('child_process').spawn;
const fs = require('fs');


exports.name = 'fasta-filtering';
exports.multicore = false;
exports.category = 'FASTA/FASTQ';

exports.run = function (os, config, callback) {
	let token = os.token;
	var directory = '/app/data/' + token + '/';
	var options = ['--derep_fulllength', directory + config.params.inputs.fasta,
		'--output', directory + config.params.outputs.filtered,
		'--sizein', '--sizeout'];

	// Length options
	if (config.params.params.min_length)
		options = options.concat(['--minseqlength', config.params.params.min_length]);
	if (config.params.params.max_length)
		options = options.concat(['--maxseqlength', config.params.params.max_length]);

	// Quantity filter
	if (config.params.params.min_quantity)
		options = options.concat(['--minuniquesize', config.params.params.min_quantity]);
	if (config.params.params.max_quantity)
		options = options.concat(['--maxuniquesize', config.params.params.max_quantity]);	

	console.log("Running chimera-vsearch with the command line:");
	console.log('/app/lib/vsearch/bin/vsearch', options.join(' '));
	fs.appendFileSync(directory + config.log, '--- Command ---\n');
	fs.appendFileSync(directory + config.log, 'vsearch ' + options.join(' ') + '\n');
	fs.appendFileSync(directory + config.log, '--- Exec ---\n');
	var child = exec('/app/lib/vsearch/bin/vsearch', options);


	child.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.on('close', function(code) {
		if (code == 0) {
			callback(os, null);
		}
		else
			callback(os, "vsearch --uchime_denovo terminate on code " + code);
	});
};
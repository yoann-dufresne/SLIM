const exec = require('child_process').spawn;
const fs = require('fs');


exports.name = 'fasta-remove-ambiguous-reads';
exports.multicore = false;
exports.category = 'Utils';

exports.run = (os, config, callback) => {
	var token = os.token;
	var directory = '/app/data/' + token + '/';
	var filename = directory + config.params.inputs.fasta;
	var out_file = directory + config.params.outputs.cleaned;

	console.log ('Removing reads with N for file ' + filename);

	// Command line
	var options = ['/app/lib/python_scripts/remove_ambiguous_reads.py',
		'--input', filename,
		'--output', out_file];

	console.log(os.token + ': python remove_ambiguous_reads.py', options.join(' '));

	// Execution
	var child = exec("python3", options);
	child.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.on('close', (code) => {
		if (code != 0) {
			console.log("Error code " + code + " during N removal");
			callback(os, code);
		} else {
			callback(os, null);
		}
	});
};

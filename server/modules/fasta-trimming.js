const exec = require('child_process').spawn;
const fs = require('fs');


exports.name = 'fasta-trimming';
exports.multicore = false;
exports.category = 'Utils';

exports.run = (os, config, callback) => {
	var token = os.token;
	var directory = '/app/data/' + token + '/';
	var filename = directory + config.params.inputs.fasta;
	var out_file = directory + config.params.outputs.trimmed;

	console.log ('Trimming for file ' + filename);

	// Command line
	var options = ['/app/lib/python_scripts/trim_sequences.py',
		'--fasta', filename,
		'--output', out_file,
		'--motif', config.params.params.motif,
		'--keep_reads', config.params.params.keep_reads,
		'--trim_mode', config.params.params.trim_mode,
		'--window_begin', config.params.params.window_begin,
		'--window_end', config.params.params.window_end];

	console.log(os.token + ': python trim_sequence.py', options.join(' '));

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
			console.log("Error code " + code + " during trimming");
			callback(os, code);
		} else {
			callback(os, null);
		}
	});
};

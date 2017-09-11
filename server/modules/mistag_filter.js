const spawn = require('child_process').spawn;
const fs = require('fs');

exports.name = 'mistag_filter';
exports.multicore = false;
exports.category = 'Filtering';

exports.run = (os, config, callback) => {
	var token = os.token;
	var directory = '/app/data/' + token + '/';

	// Input fasta file name (required)
	var filename = directory + config.params.inputs.fasta;
	// Multiplexing design file
	var design = directory + config.params.inputs.design
	// Output fasta file name
	var out_file = directory + config.params.outputs.fasta;
	var out_stats = directory + config.params.outputs.stats;

	console.log ('Mistag filtering for file ' + filename);
  
	// Alpha level for finding the Student's T critical value for the modified Thompson Tau rejection region calulation (default = 0.05)
	var alpha = config.params.params.alpha

	// Command line
	var options = ['-i', filename,
		'-d', design,
		'-a', alpha,
		'-o', out_file];

	if (config.params.params.out == 'true')
		options = options.concat(['--out'])

	console.log('Command:\nmistag_filter.py', options.join(' '));

	// Execution
	var child = spawn('/app/lib/mistag_filter/mistag_filter.py', options);
	child.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.on('close', (code) => {
		if (code != 0) {
			console.log("Error code " + code + " during mistag_filter.py");
			callback(os, code);
		} else {
			callback(os, null);
		}
	});
};

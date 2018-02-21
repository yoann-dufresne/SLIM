const exec = require('child_process').spawn;
const fs = require('fs');

const tools = require('../toolbox.js');
const derep = require('./dereplication.js');


exports.name = 'fasta-merging';
exports.multicore = true;
exports.category = 'Utils';

exports.run = (os, config, callback) => {
	let token = os.token;

	console.log(token + ": Merging fastas");
	var directory = '/app/data/' + token + '/';
	var merged = tools.tmp_filename();
	var origins = directory + config.params.outputs.origins;
	var fastas = Object.values(config.params.inputs);
	fastas = fastas.map((fasta) => {return directory + fasta})
	
	var command = ['/app/lib/python_scripts/fasta_merging.py', '-out', directory+merged, '-ori', origins].concat(fastas);

	// Joining
	console.log(token + ': FASTA merging');
	console.log('/app/lib/python_scripts/fasta_merging.py', command.join(' '));
	fs.appendFileSync(directory + config.log, '--- Command ---\n');
	fs.appendFileSync(directory + config.log, 'python3 ' + command.join(' ') + '\n');
	fs.appendFileSync(directory + config.log, '--- Exec ---\n');
	var child = exec('python3', command);


	child.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.on('close', function(code) {
		if (code == 0) {
			config.params.inputs.fasta = merged;
			config.params.outputs.derep = config.params.outputs.merged;
			derep.run(os, config,(_, msg) => {
				// fs.unlink(directory+merged, ()=>{});
				callback(os, msg);
			});
		} else
			callback(os, 'Impossible to merge fasta files')
	});
};

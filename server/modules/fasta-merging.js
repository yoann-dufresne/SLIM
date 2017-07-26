const exec = require('child_process').spawn;
const fs = require('fs');
const concat = require('concat-files');

const derep = require('./dereplication.js');


exports.name = 'fasta-merging';
exports.multicore = true;
exports.category = 'FASTA/FASTQ';

exports.run = function (os, config, callback) {
	let token = os.token;
	var options = config.params.params;
	var directory = '/app/data/' + token + '/';
	var outfile = directory + config.params.outputs.merged;

	// Get the files to merge
	var inputs = [];
	for (let id in config.params.inputs)
		inputs.push(directory + config.params.inputs[id]);

	// Merge FASTAs
	concat(inputs, outfile, (err) =>{
		if (err)
			callback(os, err);
		else {
			var derep_params = {params: {
				inputs: {fasta: config.params.outputs.merged},
				outputs: {},
				params: {}
			}};

			// Dereplication
			derep.run(os, derep_params)
			callback(os, null);
		}
	});

	// Dereplication
};

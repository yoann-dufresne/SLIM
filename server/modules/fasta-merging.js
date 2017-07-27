const exec = require('child_process').spawn;
const fs = require('fs');
const concat = require('concat-files');

const tools = require('../toolbox.js');
const derep = require('./dereplication.js');


exports.name = 'fasta-merging';
exports.multicore = true;
exports.category = 'FASTA/FASTQ';

exports.run = function (os, config, callback) {
	let token = os.token;
	var options = config.params.params;
	var directory = '/app/data/' + token + '/';
	var tmp = tools.tmp_filename() + '.fasta';
	var outfile = directory + config.params.outputs.merged;

	// Get the files to merge
	var inputs = [];
	for (let id in config.params.inputs)
		inputs.push(directory + config.params.inputs[id]);

	// Merge FASTAs
	console.log(os.token + ': Fasta merging');
	console.log('merge from: ', inputs.join(' '));
	console.log('merge to', outfile, 'using', directory + tmp);

	concat(inputs, directory + tmp, (err) =>{
		if (err)
			callback(os, err);
		else {
			var derep_params = {params: {
				inputs: {fasta: tmp},
				outputs: {derep: config.params.outputs.merged},
				params: {}
			}};

			// Dereplication
			derep.run(os, derep_params, (os, msg) => {
				fs.unlink(directory + tmp, ()=>{});
				callback (os, msg);
			});
		}
	});
};

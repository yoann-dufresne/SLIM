const exec = require('child_process').spawn;
const fs = require('fs');


exports.name = 'fastq2fasta';
exports.multicore = true;
exports.category = 'FASTA/FASTQ';

exports.run = function (os, config, callback) {
	var directory = '/app/data/' + os.token + '/';


	var reader = toolbox.fastqReader(directory + config.params.inputs.fastq);

	reader.onEnd(() => {
		console.log(os.token + ': reading ended');
		
		let derep_config = {params:{
			inputs: {},
			outputs: {},
			params: {}
		}, log:config.log};

		
	});

	console.log(os.token + ': reading fastq');
	fs.appendFileSync(directory + config.log, "Reading fastq");
	reader.read_sequences ((seq) => {
		// Rewrite each sequence from fastq in a fasta without quality
		fs.appendFileSync(directory + config.params.outputs.fasta, '>' + seq.header + '\n');
		fs.appendFileSync(directory + config.params.outputs.fasta, '>' + seq.value + '\n');
	});
};
const exec = require('child_process').spawn;
const fs = require('fs');

const toolbox = require('../toolbox.js');
const derep = require('./dereplication.js');


exports.name = 'fastq2fasta';
exports.multicore = true;
exports.category = 'FASTA/FASTQ';


exports.run = function (os, config, callback) {
	let token = os.token;
	var directory = '/app/data/' + token + '/';
	var tmp_fasta = toolbox.tmp_filename() + '.fasta';
	var options = ['--fastq_filter', directory + config.params.inputs.fastq,
		'--fastaout', directory + tmp_fasta];

	console.log("Running fastq to fasta with the command line:");
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
			// Dereplicate
			let derep_config = {params: {
				inputs: {fasta: tmp_fasta},
				outputs: {derep: config.params.outputs.fasta},
				params: {}
			},log:config.log};
			derep.run(os, derep_config, (os, msg)=>{
				fs.unlink(directory + tmp_fasta, ()=>{});
				callback(os, null);
			});
		}
		else
			callback(os, "vsearch --fastq_filter terminate on code " + code);
	});
};

// exports.run = function (os, config, callback) {
// 	var directory = '/app/data/' + os.token + '/';
// 	var tmp_fasta = toolbox.tmp_filename() + '.fasta';

// 	var reader = toolbox.fastqReader(directory + config.params.inputs.fastq);

// 	reader.onEnd(() => {
// 		console.log(os.token + ': reading ended');
		
// 		let derep_config = {params:{
// 			inputs: {fasta: tmp_fasta},
// 			outputs: {derep: config.params.outputs.fasta},
// 			params: {}
// 		}, log:config.log};

// 		derep.run(os, derep_config, (os, msg) => {
// 			fs.unlink(directory + tmp_fasta, () => {});
// 			callback(os, msg);
// 		});
// 	});

// 	console.log(os.token + ': reading fastq');
// 	fs.appendFileSync(directory + config.log, "Reading fastq");
// 	reader.read_sequences ((seq) => {
// 		// Rewrite each sequence from fastq in a fasta without quality
// 		fs.appendFileSync(directory + tmp_fasta, '>' + seq.header + '\n');
// 		fs.appendFileSync(directory + tmp_fasta, seq.value + '\n');
// 	});
// };
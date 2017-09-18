const exec = require('child_process').spawn;
const fs = require('fs');

const tools = require('../toolbox.js');
const derep = require('./dereplication.js');


exports.name = 'fasta-merging';
exports.multicore = true;
exports.category = 'FASTA/FASTQ';

exports.run = (os, config, callback) => {
	let token = os.token;

	console.log(token + ": Merging fastas");
	var directory = '/app/data/' + token + '/';
	var tmp_merged = tools.tmp_filename() + '.fasta';
	var merged = config.params.outputs.merged;
	var origins = directory + config.params.outputs.origins;

	// Write a new empty file
	fs.closeSync(fs.openSync(directory + tmp_merged, 'w'));

	// Process fasta one by one
	var fastas = Object.values(config.params.inputs);

	// Origins of the reads
	//  * first dimention : sequence hash
	//  * second dimention : provenance
	let origins_table = {};
	var save_origins = (outfile, fasta, callback) => {
		// Prepare the buffered file reader
		var reader = tools.fastaReader(fasta);
		reader.onEnd (callback);

		// Process sequences asynchoneously
		reader.read_sequences((seq) => {
			let hash = seq.value;
			let header = seq.header;

			// Save header
			fs.appendFileSync(outfile, header);

			// save the samples
			for (let sample in origins_table[hash]) {
				fs.appendFileSync(outfile, '\t' + sample + ';size=' + origins_table[hash][sample] + ';');
			}
			fs.appendFileSync(outfile, '\n');
		});
	};

	var merge = () => {
		var current_fasta = '/app/data/' + token + '/' + fastas.pop();
		fs.appendFileSync(directory + config.log, "Concatenation of " + current_fasta);

		// save reads provenance
		var sample_name = current_fasta.substr(0, current_fasta.indexOf('.fasta'));
		sample_name = sample_name.substr(sample_name.lastIndexOf('/') + 1);
		
		var reader = tools.fastaReader(current_fasta);
		
		// When the reading is over
		reader.onEnd (() => {
			if (fastas.length > 0)
				merge();
			else {
				console.log(os.token + ": Fasta concatenation ended, now dereplicate");
				fs.appendFileSync(directory + config.log, "Fasta concatenation ended, now dereplicate");

				// Dereplicate
				let derep_config = {params: {
					inputs: {fasta: tmp_merged},
					outputs: {derep: merged},
					params: {}
				},log:config.log};
				derep.run(os, derep_config, (os, msg)=>{
					fs.unlink(directory + tmp_merged, ()=>{});
					save_origins(origins, directory + merged, () => {callback(os, msg);});
				});
			}
		});

		// Read all the sequences
		reader.read_sequences((seq) => {
			var hash = seq.value;
			var header = seq.header;

			// Compute the size
			var size = 1;
			if (header.includes(';size=')) {
				var tmp = header.substr(header.indexOf(';size=') + 6);
				size = parseInt(tmp.substr(0, tmp.indexOf(';')));
			}

			// fill the origins
			if (!origins_table[hash])
				origins_table[hash] = {};
			origins_table[hash][sample_name] = size;

			// Fill the merged file
			fs.appendFileSync(directory + tmp_merged, '>' + seq.header + '\n');
			fs.appendFileSync(directory + tmp_merged, seq.value + '\n');
		});
	};
	console.log(os.token + ": Fasta concatenation started");
	merge();
};

const exec = require('child_process').spawn;
const fs = require('fs');
const readline = require('readline');


exports.name = 'toolbox';

exports.run = (token, config, callback) => {
	if (config.params.params.soft) {
		if (config.params.params.soft == "fasta-merging")
			exports.merge_fasta(token, config, callback);
		else {
			console.log("No tool called", config.params.params.soft);
			callback(token, "No tool called " + config.params.params.soft);
		}
	}
};


// --- generic tools ---
var tmp_filename = () => {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

	for( var i=0; i < 10; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
};
exports.tmp_filename = tmp_filename;



const MOD_VALUE = Math.floor(Number.MAX_SAFE_INTEGER / 4) - 3;
var sequence_hash = (dna) => {
	var value = 0;
	
	for (var idx=0 ; idx<dna.length ; idx++) {
		// Shift and module
		value = (value * 4) % MOD_VALUE;

		// Add the new value
		switch (dna[idx]) {
			case 'A':
			value += 0;
			break;
			case 'C':
			value += 1;
			break;
			case 'G':
			value += 2;
			break;
			case 'T':
			case 'U':
			value += 3;
			break;
		}
	}

	return value;
};
exports.sequence_hash = sequence_hash;

var readFasta = (filename) => {
	var sequences = [];

	var lines = fs.readFileSync(filename).toString().split('\n');
	var sequence = {value:""};

	for (var idx=0 ; idx<lines.length ; idx++) {
		var line = lines[idx];

		if (line[0] == '>') {
			// New sequence
			if (sequence.header) {
				sequences.push(sequence);
				sequence = {value:""};
			}

			// Fill header
			sequence.header = line.substr(1);
		} else {
			sequence.value += line;
		}
	}

	sequences.push(sequence);

	return sequences;
};
exports.readFasta = readFasta;


// --- Merging fasta ---

exports.merge_fasta = (token, config, callback) => {
	console.log(token + ": Merging fastas");
	var merged = '/app/data/' + token + '/' + config.params.outputs.merged;
	var origins = '/app/data/' + token + '/' + config.params.outputs.origins;

	// Write a new empty file
	fs.closeSync(fs.openSync(merged, 'w'));

	// Process fasta one by one
	var fastas = Object.values(config.params.inputs);

	// Origins of the reads
	//  * first dimention : sequence hash
	//  * second dimention : provenance
	var origins_table = [];
	var save_origins = (outfile, fasta) => {
		var sequences = readFasta(fasta);
		for (var idx=0 ; idx<sequences.length ; idx++) {
			var seq = sequences[idx];
			var hash = seq.value;
			var header = seq.header;

			// Save header
			fs.appendFileSync(outfile, header);

			// save the samples
			for (var sample in origins_table[hash])
				fs.appendFileSync(outfile, '\t' + sample + ';size=' + origins_table[hash][sample] + ';');
			fs.appendFileSync(outfile, '\n');
		}
	};

	var merge = () => {
		var current_fasta = '/app/data/' + token + '/' + fastas.pop();
		
		// Copy the file
		var tmp_current = tmp_filename() + '.fasta';
		fs.linkSync(current_fasta, tmp_current);

		// save reads provenance
		var sample_name = current_fasta.substr(0, current_fasta.indexOf('.fasta'));
		sample_name = sample_name.substr(sample_name.lastIndexOf('/') + 1);
		var sequences = readFasta(tmp_current);
		for (var idx=0 ; idx<sequences.length ; idx++) {
			var seq = sequences[idx];
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
				origins_table[hash] = [];
			origins_table[hash][sample_name] = size;
		}

		// Rereplicate
		exports.rereplicate(tmp_current, ()=> {
			// Read the tmp file
			var data = fs.readFileSync(tmp_current);

			// Append at the end and remove tmp files
			fs.appendFileSync(merged, data);

			// Delete the tmp file
			fs.unlinkSync(tmp_current);

			if (fastas.length > 0)
				merge();
			else
				exports.dereplicate(merged, ()=>{
					save_origins(origins, merged);
					callback(token, null);
				});
		});
	};
	merge();
};



// --- Dereplication ---

exports.rereplicate = (filename, callback) => {
	console.log ('Rereplication for file ' + filename);
	var intermediate_file = tmp_filename() + '.fasta';

	var options = ['--rereplicate', filename,
		'--sizeout',
		'--output', intermediate_file];

	var child = exec('/app/lib/vsearch/bin/vsearch', options);
	child.on('close', (code) => {
		if (code != 0) {
			console.log("Error code " + code + " during rereplication");
			return;
		}

		fs.renameSync(intermediate_file, filename);
		callback();
	});
};


// --- Dereplication ---
exports.dereplicate = (filename, callback) => {
	console.log ('Dereplication for file ' + filename);
	var intermediate_file = tmp_filename() + '.fasta';

	var options = ['--derep_fulllength', filename,
		'--sizeout',
		'--output', intermediate_file];

	var child = exec('/app/lib/vsearch/bin/vsearch', options);
	child.on('close', (code) => {
		if (code != 0) {
			console.log("Error code " + code + " during dereplication");
			return;
		}

		fs.renameSync(intermediate_file, filename);
		callback();
	});
};


// --- Sorting ---
exports.sort = (filename, callback) => {
	console.log ('Sorting file ' + filename);
	var intermediate_file = tmp_filename() + '.fasta';

	var options = ['--sortbysize', filename,
		'--sizeout',
		'--output', intermediate_file];

	var child = exec('/app/lib/vsearch/bin/vsearch', options);
	child.on('close', (code) => {
		if (code != 0) {
			console.log("Error code " + code + " during dereplication");
			return;
		}

		fs.renameSync(intermediate_file, filename);
		callback();
	});
};

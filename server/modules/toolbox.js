const exec = require('child_process').spawn;
const fs = require('fs');
var lineReader = require('line-reader');


exports.name = 'toolbox';
exports.multicore = true;

exports.run = (os, config, callback) => {
	let token = os.token;
	if (config.params.params.soft) {
		if (config.params.params.soft == "fasta-merging")
			exports.merge_fasta(token, config, callback);
		else if (config.params.params.soft == "fasta-quantity") {
			// Copy the file
			fs.linkSync(
				'/app/data/' + token + '/' + config.params.inputs.to_filter,
				'/app/data/' + token + '/' + config.params.outputs.filtered
			);
			// Dereplicate with minimum number of reads
			exports.dereplicate(
				'/app/data/' + token + '/' + config.params.outputs.filtered,
				config,
				()=>{callback(token, null);}
			);
		} else {
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

class fastaReader {
	constructor (filename) {
		var that = this;

		lineReader.open(filename, function(err, reader) {
			if (err)
				console.log(err);
			else
				that.reader = reader;
		});
	}

	read_sequences (sequence_processor) {
		var that = this;

		// Wait until file is ready
		if (!this.reader) {
			setTimeout(()=>{that.read_sequences(sequence_processor);}, 100);
			return;
		}

		// Create new sequence
		if (!this.seq)
			this.seq = {value:""};

		// Close the file
		if (!this.reader.hasNextLine()) {
			this.reader.close(()=>{});

			if (this.callback) 
				this.callback();
			return;
		}

		// Add a new line
		var read_next_line = function () {
			that.reader.nextLine(function(err, line) {
				// EOF
				if (!line)
					that.callback();

				// Read header
				if (line.length > 0 && line[0] == '>') {
					var seq = that.seq;
					that.seq = {header:line.substr(1), value:""};

					if (seq.header)
						sequence_processor(seq);
					that.read_sequences(sequence_processor)
				// Read sequence value
				} else {
					that.seq.value += line;

					if (that.reader.hasNextLine())
						read_next_line ();
					else {
						if (that.seq.header)
							sequence_processor(that.seq)

						that.callback();
					}
				}
			});
		}
		read_next_line();
	}

	onEnd (callback) {
		this.callback = callback;
	}
}
exports.fastaReader = (file) => {return new fastaReader(file)};


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
	var save_origins = (outfile, fasta, callback) => {
		// Prepare the buffered file reader
		var reader = new fastaReader(fasta);
		reader.onEnd (callback);

		// Process sequences asynchoneously
		reader.read_sequences((seq) => {
			var hash = seq.value;
			var header = seq.header;

			// Save header
			fs.appendFileSync(outfile, header);

			// save the samples
			for (var sample in origins_table[hash])
				fs.appendFileSync(outfile, '\t' + sample + ';size=' + origins_table[hash][sample] + ';');
			fs.appendFileSync(outfile, '\n');
		});
	};

	var merge = () => {
		var current_fasta = '/app/data/' + token + '/' + fastas.pop();

		// save reads provenance
		var sample_name = current_fasta.substr(0, current_fasta.indexOf('.fasta'));
		sample_name = sample_name.substr(sample_name.lastIndexOf('/') + 1);
		
		var reader = new fastaReader(current_fasta);// TODO
		
		// When the reading is over
		reader.onEnd (() => {
			if (fastas.length > 0)
				merge();
			else {
				exports.dereplicate(merged, null, ()=>{
					save_origins(origins, merged, () => {callback(token, null);});
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
				origins_table[hash] = [];
			origins_table[hash][sample_name] = size;

			// Fill the merged file
			fs.appendFileSync(merged, '>' + seq.header + '\n');
			fs.appendFileSync(merged, seq.value + '\n');
		});
	};
	merge();
};



// --- Dereplication ---

exports.rereplicate = (filename, callback) => {
	console.log ('Rereplication for file ' + filename);
	var intermediate_file = tmp_filename() + '.fasta';

	var options = ['--rereplicate', filename,
		'--sizeout', '--quiet',
		'--minseqlength', '1',
		'--output', intermediate_file];

	var child = exec('/app/lib/vsearch/bin/vsearch', options);
	child.on('close', (code) => {
		if (code != 0) {
			console.log("Error code " + code + " during rereplication");
			callback("rereplication: " + code);
		} else {
			fs.renameSync(intermediate_file, filename);
			callback();
		}
	});
};


// --- Dereplication ---
exports.dereplicate = (filename, config, callback) => {
	console.log ('Dereplication for file ' + filename);
	var intermediate_file = tmp_filename() + '.fasta';

	// Minimum quantity for the presence of a read
	var threshold = 0;
	if (config && config.params.params.threshold)
		threshold = parseInt(config.params.params.threshold);

	// Command line
	var options = ['--derep_fulllength', filename,
		'--sizeout', '--sizein', '--quiet',
		'--minseqlength', '1',
		'--minuniquesize', threshold,
		'--output', intermediate_file];


	if (config && config.params.params.rename)
		options = options.concat(['--relabel', config.params.params.rename + '_']);

	console.log('Command:\nvsearch', options.join(' '));

	// Execution
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
		'--sizeout', '--quiet',
		'--minseqlength', '1',
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

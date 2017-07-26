const exec = require('child_process').spawn;
const fs = require('fs');
var lineReader = require('line-reader');


// --- generic tools ---
var tmp_filename = () => {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

	for( var i=0; i < 10; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
};
exports.tmp_filename = tmp_filename;


// --- Merging fasta ---

exports.merge_fasta = (os, config, callback) => {
	let token = os.token;

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
					save_origins(origins, merged, () => {callback(os, null);});
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

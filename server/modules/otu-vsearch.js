const exec = require('child_process').spawn;
const fs = require('fs');

const csv = require('csv-parser');
var lineReader = require('line-reader');

const toolbox = require('./toolbox.js');


exports.name = 'otu-vsearch';

exports.run = function (token, config, callback) {
	// Real filenames
	var directory = '/app/data/' + token + '/';
	var tmp_uc_file = directory + toolbox.tmp_filename() + '.txt';
	var tsv_otu_file = directory + config.params.outputs.otus_table;
	var origins_file = directory + config.params.inputs.origins;
	var centroids_file = directory + config.params.outputs.centroids;
	var in_reads = directory + config.params.inputs.fasta;
	var out_reads = directory + config.params.outputs.out_reads;

	// Clustering command
	var options = ['--cluster_fast', in_reads,
		'--uc', tmp_uc_file,
		'--id', config.params.params.similarity,
		'--centroids', centroids_file];

	console.log("Running otu-vsearch with the command line:");
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
			// Load origins
			load_origins(origins_file, (origins) => {
				// Transform uc to otu
				uc_to_otu(
					tmp_uc_file,
					tsv_otu_file,
					origins,
					in_reads,
					out_reads,
					() => {
						fs.unlink(tmp_uc_file, ()=>{});
						callback(token, null);
					}
				);
			});
		} else
			callback(token, "vsearch " + options[0] + " terminate on code " + code);
	});
};


var load_origins = (origins_file, callback) => {
	origins = {experiments:[]};

	lineReader.eachLine(origins_file, function(line, last) {
		line = line.split('\t');

		origins[line[0]] = [];
		for (var exIdx=1 ; exIdx<line.length ; exIdx++) {
			var origin = line[exIdx];

			// Add the origin
			origins[line[0]].push(origin);

			// Save the experiment
			origin = origin.substr(0, origin.indexOf(';size='));
			if (!origins.experiments.includes(origin)) {
				origins.experiments.push(origin);
			}
		}

		if (last)
			callback(origins);
	});
};


var uc_to_otu = (csv_uc_file, tsv_otu_file, sequence_origins, seq_input, seq_output, callback) => {
	console.log('CSV to OTU');

	var parser = csv({
		separator: '\t',
		headers: ['type', 'cluster', 'length', 'similarity', 'orientation',
				'nuy1', 'nuy2', 'compact', 'name', 'centroid']
	});

	// First dimention: OTU id
	// Second dimention: Experiment
	var otus = [];
	var maxId = 0;
	var clusters = [];

	// Prepare the file for output the reads with their cluster assignation
	fs.closeSync(fs.openSync(seq_output, 'w'));


	fs.createReadStream(csv_uc_file)
	.pipe(parser)
	// --- Read UC file ---
	.on('data', function (data) {
		if (data.type == "S")
			return;

		// Save cluster
		clusters[data.name] = data.cluster;

		// Create second dimention
		if (!otus[data.cluster])
			otus[data.cluster] = [];

		// Get origins
		var origins = sequence_origins[data.name];

		// save the value in the right otu
		for (var oidx=0 ; oidx<origins.length ; oidx++) {
			var origin = origins[oidx];
			var size = parseInt(origin.substr(origin.indexOf(";size=")+6).split(';')[0]);
			origin = origin.substr(0, origin.indexOf(';size='));

			// Update otu size
			var prevSize = otus[data.cluster][origin] ? otus[data.cluster][origin] : 0;
			otus[data.cluster][origin] = prevSize + size;
		}
	})
	// --- Write OTU table ---
	.on('end', () => {
		var exps = sequence_origins.experiments;

		// Write header
		fs.closeSync(fs.openSync(tsv_otu_file, 'w'));
		fs.appendFileSync(tsv_otu_file, 'OTU');
		for (var eIdx=0 ; eIdx<exps.length ; eIdx++)
			fs.appendFileSync(tsv_otu_file, '\t' + exps[eIdx]);
		fs.appendFileSync(tsv_otu_file, '\n');

		// Write the otu table
		for (var cIdx in otus) {
			fs.appendFileSync(tsv_otu_file, cIdx);

			for (var eIdx=0 ; eIdx<exps.length ; eIdx++) {
				var exp = exps[eIdx];

				// Write the value if present, else 0
				if (otus[cIdx][exp]) {
					fs.appendFileSync(tsv_otu_file, '\t' + otus[cIdx][exp]);
				} else {
					fs.appendFileSync(tsv_otu_file, '\t0');
				}
			}
			fs.appendFileSync(tsv_otu_file, '\n');
		}

		// Write the assignation in the reads file
		var reader = toolbox.fastaReader(seq_input);

		reader.onEnd(callback);

		reader.read_sequences ((seq) => {
			seq.header += ';cluster=' + clusters[seq.header] + ';';

			fs.appendFileSync(seq_output, '>' + seq.header);
			fs.appendFileSync(seq_output, '\n');
			fs.appendFileSync(seq_output, seq.value);
			fs.appendFileSync(seq_output, '\n');
		});
	});
};

const lineReader = require('line-reader');
const fs = require('fs');
const csv = require('csv-parser');

const tools = require('./toolbox');



exports.write_otu_table = (otu_matrix, table_file, t2sOrder, callback) => {
	console.log('Write OTU matrix');

	// --- file order from matrix ---
	// Get the experiments objects
	let tmp = Object.values(otu_matrix);
	// Transform arrays into arguments for Object.assign
	let fileOrder = {};
	for (let obj_key in tmp) {
		let obj = tmp[obj_key];
		for (let key in obj) {
			if (!key.startsWith('__'))
				fileOrder[key] = obj[key];
		}
	}

	fileOrder = Object.keys(fileOrder);
	console.log(JSON.stringify(fileOrder));

	// Final order
	let order = [];
	let header = [];
	if (t2sOrder == null) {
		order = fileOrder;
		header = fileOrder;
	} else {
		for (let o_idx=0 ; o_idx<t2sOrder.length ; o_idx++) {
			let t2s_name = t2sOrder[o_idx];

			for (let f_idx=0 ; f_idx<fileOrder.length ; f_idx++) {
				let filename = fileOrder[f_idx];

				if (filename.includes(t2s_name)) {
					order.push(filename);
					header.push(t2s_name);
				}
			}
		}
	}


	// --- Write OTU table to file ---
	let stream = fs.createWriteStream(table_file, {'flags': 'w'});
	// Header
	stream.write('OTU');
	for (let exp_idx=0 ; exp_idx<header.length ; exp_idx++) {
		if (header[exp_idx].startsWith('__'))
			continue;
		stream.write('\t' + header[exp_idx]);
	}
	stream.write('\n');

	// Content
	let local_cluster_id = 0;
	for (let cluster_idx in otu_matrix) {
		stream.write('' + local_cluster_id++);

		for (let exp_idx=0 ; exp_idx<order.length ; exp_idx++) {
			let exp = order[exp_idx];

			// Pass system properties
			if (exp.startsWith('__'))
				continue;

			// Write the value if present, else 0
			if (otu_matrix[cluster_idx][exp]) {
				stream.write('\t' + otu_matrix[cluster_idx][exp]);
			} else {
				stream.write('\t0');
			}
		}
		stream.write('\n');
	}
	stream.end();

	callback();
};


exports.write_reads = (otu_matrix, inputfile, outfile, callback) => {
	console.log('Write reads clusters');

	// Get the read clusters
	let clusters = {};
	for (let idx=0 ; idx<otu_matrix.length ; idx++) {
		let read_names = otu_matrix[idx]['__name__'];
		for (let id in read_names) {
			let read_name = read_names[id];
			clusters[read_name] = idx;
		}
	}

	// Init writer
	let stream = fs.createWriteStream(outfile, {'flags': 'w'});

	// Init reader
	let reader = tools.fastaReader(inputfile);
	reader.onEnd(() => {
		stream.end();
		callback();
	});

	reader.read_sequences((seq) => {
		let clust_id = clusters[seq.header];
		stream.write('>' + seq.header + ';cluster=' + clust_id + ';\n' + seq.value + '\n');
	});
}


exports.load_origins_matrix = (origins_file, callback) => {
	let origins = {experiments:[]};

	lineReader.eachLine(origins_file, function(line, last) {
		line = line.split('\t');

		origins[line[0]] = {};
		for (let exIdx=1 ; exIdx<line.length ; exIdx++) {
			let origin = line[exIdx];
			let size = origin.substr(origin.indexOf(';size=')+6);
			size = parseInt(size.substr(0, size.indexOf(';')));
			origin = origin.substr(0, origin.indexOf(';size='));

			// Add the origin
			origins[line[0]][origin] = size;

			// Save the experiment
			if (!origins.experiments.includes(origin))
				origins.experiments.push(origin);
		}

		if (last)
			callback(origins);
	});
};



// var uc_to_otu = (csv_uc_file, tsv_otu_file, sequence_origins, callback) => {
exports.uc_to_matrix = (os, config, callback) => {
	console.log("Read the UC file");

	var directory = '/app/data/' + os.token + '/';
	var uc_file = config.params.inputs.uc;
	var origins_file = config.params.inputs.origins;

	exports.load_origins_matrix(directory + origins_file, (origins) => {
		let exps = origins.experiments;
		var matrix = [];
		var true_clusters = [];

		var parser = csv({
			separator: '\t',
			headers: ['type', 'cluster', 'length', 'similarity', 'orientation',
					'nuy1', 'nuy2', 'compact', 'name', 'centroid']
		});


		fs.createReadStream(directory + uc_file)
		.pipe(parser)
		// --- Read UC file ---
		.on('data', function (data) {
			if (data.type == "C") {
				true_clusters.push(data.cluster);
				return;
			}

			let clust_id = data.cluster;
			// Create cluster if undefined
			if (!matrix[clust_id])
				matrix[clust_id] = {__name__: [], __total__:0};

			// Read name from uc file
			let read_name = data.name;
			let total = 0;
			for (let exp in origins[read_name]) {
				// Init value if not previously initialized
				if (!matrix[clust_id][exp])
					matrix[clust_id][exp] = 0;

				// Fill the matrix
				matrix[clust_id][exp] += origins[read_name][exp];
				total += origins[read_name][exp];
			}
			// Save total in a system parameter
			matrix[clust_id]['__name__'].push(read_name);
			matrix[clust_id]['__total__'] += total;
		})
		.on('end', () => {
			var filtered_matrix = [];
			for (var t_idx=0 ; t_idx<true_clusters.length ; t_idx++) {
				mat_idx = true_clusters[t_idx];
				filtered_matrix.push(matrix[mat_idx]); 
			}
			
			callback(filtered_matrix);
		});
	});
};


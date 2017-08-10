const lineReader = require('line-reader');
const fs = require('fs');
const csv = require('csv-parser');



exports.write_otu_table = (otu_matrix, table_file, t2sOrder, callback) => {
	console.log('Write OTU matrix');

	// --- file order from matrix ---
	// Get the experiments objects
	let fileOrder = Object.values(otu_matrix);
	// Transform arrays into arguments for Object.assign
	fileOrder = [{}].concat(fileOrder);
	// Get unique keys by merging the objects
	fileOrder = Object.keys(Object.assign.apply(this, fileOrder));

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
	let stream = fs.createWriteStream(table_file, {'flags': 'a'});
	// Header
	fs.closeSync(fs.openSync(table_file, 'w'));
	stream.write('OTU');
	for (let exp_idx=0 ; exp_idx<header.length ; exp_idx++)
		stream.write('\t' + header[exp_idx]);
	stream.write('\n');

	// Content
	let local_cluster_id = 0;
	for (let cluster_idx in otu_matrix) {
		stream.write('' + local_cluster_id++);

		for (let exp_idx=0 ; exp_idx<order.length ; exp_idx++) {
			let exp = order[exp_idx];

			// Write the value if present, else 0
			if (otu_matrix[cluster_idx][exp]) {
				stream.write('\t' + otu_matrix[cluster_idx][exp]);
			} else {
				stream.write('\t0');
			}
		}
		stream.write('\n');
	}

	callback();
};


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
				matrix[clust_id] = {};

			// Read name from uc file
			let read_name = data.name;
			for (let exp in origins[read_name]) {
				// Init value if not previously initialized
				if (!matrix[clust_id][exp])
					matrix[clust_id][exp] = 0;

				// Fill the matrix
				matrix[clust_id][exp] += origins[read_name][exp];
			}
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


const lineReader = require('line-reader');
const fs = require('fs');



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
	for (let cluster_idx in otu_matrix) {
		stream.write(cluster_idx);

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


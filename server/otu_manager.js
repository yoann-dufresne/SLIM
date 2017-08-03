const lineReader = require('line-reader');
const fs = require('fs');



exports.write_otu_table = (otu_matrix, table_file, order, callback) => {
	console.log('Write OTU matrix');
	// Computer an order if absent
	if (order == null) {
		// Get the experiments objects
		order = Object.values(otu_matrix);
		// Transform arrays into arguments for Object.assign
		order = [{}].concat(order);
		// Get unique keys by merging the objects
		order = Object.keys(Object.assign.apply(this, order));
	}

	// --- Write OTU table to file ---
	// Header
	fs.closeSync(fs.openSync(table_file, 'w'));
	fs.appendFileSync(table_file, 'OTU');
	for (let exp_idx=0 ; exp_idx<order.length ; exp_idx++)
		fs.appendFileSync(table_file, '\t' + order[exp_idx]);
	fs.appendFileSync(table_file, '\n');

	// Content
	for (let cluster_idx in otu_matrix) {
		fs.appendFileSync(table_file, cluster_idx);

		for (let exp_idx=0 ; exp_idx<order.length ; exp_idx++) {
			let exp = order[exp_idx];

			// Write the value if present, else 0
			if (otu_matrix[cluster_idx][exp]) {
				fs.appendFileSync(table_file, '\t' + otu_matrix[cluster_idx][exp]);
			} else {
				fs.appendFileSync(table_file, '\t0');
			}
		}
		fs.appendFileSync(table_file, '\n');
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


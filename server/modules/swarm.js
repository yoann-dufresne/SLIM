const exec = require('child_process').spawn;
const fs = require('fs');
var lineReader = require('line-reader');

const toolbox = require('../toolbox.js');
const otu_manager = require('../otu_manager.js');
const merging = require('./fasta-merging.js');


exports.name = 'swarm';
exports.multicore = true;
exports.category = 'Clustering';


exports.run = function (os, config, callback) {
	let token = os.token;
	let directory = '/app/data/' + token + '/';
	let tmp_merged = toolbox.tmp_filename() + '.fasta';
	let tmp_origins = toolbox.tmp_filename() + '.tsv';

	let otu_file = config.params.outputs.otus_table;

	let config_merging = {params:{
		inputs: config.params.inputs,
		outputs: {
			merged: tmp_merged,
			origins: tmp_origins
		},
		params: {}
	}, log:config.log};

	// Merging
	merging.run (os, config_merging, () => {
		// OTU search
		config.params.inputs.merged = tmp_merged;
		config.params.inputs.origins = tmp_origins;
		otu_search(os, config, (matrix) => {
			if (!matrix) {
				console.log(os.token, ': OTUs parsing impossible');
				callback(os, 'OTU parsing errors');
				return;
			}

			// Remove unnecessary files
			fs.unlink(directory+tmp_merged, ()=>{});
			fs.unlink(directory+tmp_origins, ()=>{});

			var written = (err) => {
				if (err) {
					console.log(token + ': ' + err);
					callback(os, err);
				} else {
					callback(os, null);
				}
			};

			if (config.params.params.ordered != 'true') {
				// OTU saving
				otu_manager.write_otu_table(matrix, directory+otu_file, null, written);
			} else {
				toolbox.read_tags2sample(directory+config.params.params.t2s, (libs) => {
					// Compute order
					let order = [];
					for (let libname in libs) {
						order = libs[libname].map((elem) => {return libname + '_' + elem.name});
						// TODO !!!
					}

					// Write OTU
					otu_manager.write_otu_table(matrix, directory+otu_file, order, written);
				});
			}
		});
	});
};



var otu_search = (os, config, callback) => {
	let directory = '/app/data/' + os.token + '/';
	let tmp_output = toolbox.tmp_filename() + '.txt';

	// Swarm options
	var options = [directory + config.params.inputs.merged,
	'-o', directory + tmp_output,
	'-f', '-z',
	'-w', directory + config.params.outputs.centroids,
	'-t', os.cores];

	// Execute swarm
	console.log("Running swarm with the command line:");
	console.log('/app/lib/swarm/bin/swarm', options.join(' '));
	var child = exec('/app/lib/swarm/bin/swarm', options);

	child.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.on('close', function(code) {
		if (code != 0)
			callback();
		else {
			config.params.inputs.swarm_out = tmp_output;
			parse_swarm_file(os, config, (matrix) => {
				fs.unlink(directory+tmp_output, ()=>{});

				callback(matrix);
			});
		}
	});
};

var parse_swarm_file = (os, config, callback) => {
	let directory = '/app/data/' + os.token + '/';
	let swarm_file = directory + config.params.inputs.swarm_out;
	let origins_file = directory + config.params.inputs.origins;

	otu_manager.load_origins_matrix(origins_file, (origins) => {
		let exps = origins.experiments;
		let line_id = 0;
		var matrix = [];

		// For each line
		lineReader.eachLine(swarm_file, function(line, last) {
			// Define cluster and init values at 0
			clust_id = line_id++;
			matrix[clust_id] = {};
			
			// Add values from origins to matrix
			let read_names = line.split(' ');
			for (let r_idx=0 ; r_idx<read_names.length ; r_idx++) {
				// Read name from swarm
				let read_name = read_names[r_idx];

				for (let exp in origins[read_name]) {
					// Init value if not previously initialized
					if (!matrix[clust_id][exp])
						matrix[clust_id][exp] = 0;

					// Fill the matrix
					matrix[clust_id][exp] += origins[read_name][exp];
				}
			}
			
			if (last) {
				callback(matrix);
			}
		});
	});
};




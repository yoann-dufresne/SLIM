const exec = require('child_process').spawn;
const fs = require('fs');

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
	merging.run (os, config_merging, (_, msg) => {
		if (msg != null) {
			callback(os, msg);
			return;
		}

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
			fs.unlink(directory+tmp_origins, ()=>{});

			var written = (err) => {
				if (err) {
					console.log(token + ': ' + err);
					callback(os, err);
					return;
				} else {
					otu_manager.write_reads(
						matrix,
						directory + tmp_merged,
						directory + config.params.outputs.reads,
						()=>{
							fs.unlink(directory+tmp_merged, ()=>{});
							callback(os, null);
						}
					);
					return;
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
						order = order.concat(libs[libname].map((elem) => {return libname + '_' + elem.name}));
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
	// let tmp_output = toolbox.tmp_filename() + '.txt';
	let tmp_output = toolbox.tmp_filename() + '.uc';

	// Swarm options
	var options = [directory + config.params.inputs.merged,
	'-o', '/dev/null', //directory + tmp_output,
	'-u', directory + tmp_output,
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
			config.params.inputs.uc = tmp_output;
			otu_manager.uc_to_matrix(os, config, (matrix) => {
				fs.unlink(directory+tmp_output, ()=>{});
				callback(matrix);
			});
		}
	});
};




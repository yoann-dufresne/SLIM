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
		otu_search(os, config, (os, msg) => {
			// Remove unnecessary files
			fs.unlink(directory+tmp_origins, ()=>{});
			fs.unlink(directory+tmp_merged, ()=>{});

			callback(os, msg);
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
	'-z',
	'-w', directory + config.params.outputs.centroids,
	'-t', os.cores];

	if (config.params.params.max_diff == 1)
		options = options.concat(['-f']);
	else
		options = options.concat(['-d', config.params.params.max_diff]);

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
		if (code != 0) {
			fs.unlink(directory+tmp_output, ()=>{});
			console.log (os.token + ': Error durong swarm execution')
			callback(os, 'Error during swarm execution');
		} else {
			config.params.inputs.uc = tmp_output;
			otu_manager.write_from_uc(os, config, (os, msg) => {
				fs.unlink(directory+tmp_output, ()=>{});
				callback(os, msg);
			});
		}
	});
};




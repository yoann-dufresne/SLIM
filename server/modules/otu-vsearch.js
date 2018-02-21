const exec = require('child_process').spawn;
const fs = require('fs');

const csv = require('csv-parser');
var lineReader = require('line-reader');

const merging = require('./fasta-merging.js');
const toolbox = require('../toolbox.js');
const otu_manager = require('../otu_manager.js');


exports.name = 'otu-vsearch';
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
			// fs.unlink(directory+tmp_origins, ()=>{});
			// fs.unlink(directory+tmp_merged, ()=>{});

			callback(os, msg);
		});
	});
};

var otu_search = (os, config, callback) => {
	let directory = '/app/data/' + os.token + '/';
	// let tmp_output = toolbox.tmp_filename() + '.txt';
	let tmp_output = toolbox.tmp_filename() + '.uc';
	let in_reads = config.params.inputs.merged;
	let centroids_file = config.params.outputs.centroids;

	// Clustering options
	var options = ['--cluster_fast', directory + in_reads,
		'--sizein', '--sizeout',
		'--uc', directory + tmp_output,
		'--id', config.params.params.similarity,
		'--centroids', directory + centroids_file,
		'--threads', os.cores,
		'--qmask', 'none', '--minseqlength', '1'];

	// Execute vsearch
	console.log("Running vsearch with the command line:");
	console.log('/app/lib/vsearch/bin/vsearch', options.join(' '));
	var child = exec('/app/lib/vsearch/bin/vsearch', options);

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
			config.params.params.ordered = config.params.params.ordered_vsearch;
			otu_manager.write_from_uc(os, config, (os, msg) => {
				// fs.unlink(directory+tmp_output, ()=>{});
				callback(os, msg);
			});
		}
	});
};

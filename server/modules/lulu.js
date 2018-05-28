const exec = require('child_process').spawn;
const Rexec = require('child_process').exec;
const fs = require('fs');
const tools = require('../toolbox.js');

exports.name = 'lulu';
exports.multicore = false;
exports.category = 'Post-processing';

exports.run = function (os, config, callback) {
	let token = os.token;
	let directory = '/app/data/' + token + '/';
	let rep_set = directory + config.params.inputs.rep_set;
	let otu_input = directory + config.params.inputs.otus_table;
	let otu_lulu = directory + config.params.outputs.otus_lulu;

	// calling vsearch for producing the pairwise matchlist
	match_list(os, config, rep_set, (match_list) => {
		// fs.unlink(directory + tmp_rep_set, ()=>{});
	callback(os, null);
	});
};


var match_list = (os, config, rep_set, callback) => {
	console.log ('Produce a pairwise match list with vsearch for file: ' + rep_set);
	let directory = '/app/data/' + os.token + '/';
	let tmp_match = tools.tmp_filename() + '.txt';
	let similarity = config.params.params.similarity;

	console.log (config)

	// Command line
	var options = ['--usearch_global', rep_set,
		'--db', rep_set,
		'--self',
		'--id', similarity,
		'--iddef', '1',
		'--userout', directory + tmp_match,
		'-userfields', 'query+target+id',
		'--maxaccepts', '0',
		'--query_cov', '0.9',
		'--maxhits', '10'];

	// Execute vsearch
	console.log("Running vsearch with the command line:");
	console.log('/app/lib/vsearch/bin/vsearch ', options.join(' '));

	// Execution
	var child = exec('/app/lib/vsearch/bin/vsearch', options);
	child.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.on('close', function(code) {
		if (code != 0) {
			fs.unlink(directory + tmp_match, ()=>{});
			console.log("vsearch terminate on code " + code);
			callback(os, "vsearch terminate on code " + code);
		} else {
			config.params.inputs.match = tmp_match;
			lulu_run (os, config, (otu_lulu) => {
				// fs.unlink(directory + tmp_match, ()=>{});
			callback(os, null);
			});

		}
	});
};


var lulu_run = (os, config, callback) => {
	let directory = '/app/data/' + os.token + '/';
	let match = config.params.inputs.match;
	let otu_input = config.params.inputs.otus_table;
	let otu_lulu = config.params.outputs.otus_lulu;
	let cooccurence = config.params.params.cooccurence;

	// Run the R script lulu.r
	// Command line
	var options = ['/app/lib/R_scripts/lulu.R',
	otu_input,
	match,
	otu_lulu,
	os.token, cooccurence];

	// Execute the R script
	console.log("Running Rscript lulu.R with the command line:");
	console.log('Rscript ' + options.join(' '));
	var child = Rexec('Rscript ' + options.join(' '));

	child.stdout.on('data', function(data) {
		console.log('STDOUT:' + data);
	});
	child.stderr.on('data', function(data) {
		console.log('STDERR:' + data);
	});
	child.on('close', function(code) {
		if (code != 0) {
			fs.unlink(directory + otu_lulu, ()=>{});
			console.log (os.token + ': Error during lulu execution')
			callback(os, 'Error during lulu execution');
		} else {
			callback(os, code);
		}
	});
};

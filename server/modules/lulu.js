const exec = require('child_process').spawn;
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

	// Run the otu_id.py to rename the rep_set file
	let tmp_rep_set = directory + tools.tmp_filename() + '.fasta';
	// Command line
	var options = ['/app/lib/lulu/otu_id.py',
	'-i', rep_set,
	'-o', tmp_rep_set];

	console.log ('Renaming header in rep set for file ' + rep_set);
	console.log(os.token + ': python3 ', options.join(' '));

	var child = exec("python3", options);
	child.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.on('close', (code) => {
		if (code != 0) {
			console.log("Error code " + code + " during renaming header");
			callback(os, code);
		} else {
			console.log("Fasta renammed --");
			match_list(os, config, tmp_rep_set, (match_list) => {
				fs.unlink(directory + tmp_rep_set, ()=>{}); 	
			callback(os, null);
			});
		}	
	});
};


var match_list = (os, config, tmp_rep_set, callback) => {
	console.log ('Produce a pairwise match list with vsearch for file: ' + tmp_rep_set);
	let directory = '/app/data/' + os.token + '/';
	let tmp_match = tools.tmp_filename() + '.txt';

	// Command line
	var options = ['--usearch_global', tmp_rep_set,
		'--db', tmp_rep_set,
		'--self',
		'--id', '0.85',
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
				fs.unlink(directory + tmp_match, ()=>{}); 	
			callback(os, code);
			});
			
		}
	});
}


var lulu_run = (os, config, callback) => {
	let directory = '/app/data/' + os.token + '/';
	let match = config.params.inputs.match
	let otu_input = config.params.inputs.otus_table;
	let otu_lulu = config.params.outputs.otus_lulu;

	// Run the R script lulu.r
	// Command line
	var options = ['/app/lib/lulu/lulu.R',
	otu_input,
	match,
	otu_lulu,
	os.token];

	// Execute the R script
	console.log("Running Rscript lulu.R with the command line:");
	console.log('Rscript ', options.join(' '));
	var child = exec('Rscript ', options);

	child.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.on('close', function(code) {
		if (code != 0) {
			fs.unlink(directory+tmp_output, ()=>{});
			console.log (os.token + ': Error during lulu execution')
			callback(os, 'Error during lulu execution');
		} else {
			callback(os, null);
		}
	});
};




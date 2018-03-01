const exec = require('child_process').spawn;
const fs = require('fs');
const tools = require('../toolbox.js');

exports.name = 'lulu post-clustering';
exports.multicore = false;
exports.category = 'Clustering';

exports.run = function (os, config, callback) {
	let token = os.token;
	let directory = '/app/data/' + token + '/';
	let rep_set = directory + config.params.inputs.rep_set;
	let filename = directory + config.params.inputs.otus_table;
	let otu_lulu = directory + config.params.outputs.otus_lulu;

	let tmp_match = tools.tmp_filename() + '.txt';

	console.log ('Produce a match list with vsearch ' + rep_set);

	// Command line
	var options = ['--usearch_global', directory + config.params.inputs.rep_set,
		'--db', directory + config.params.inputs.rep_set,
		'--self',
		'--id', '.85',
		'--iddef', '1',
		'--userout', directory + tmp_match,
		'-userfields', 'query+target+id',
		'--maxaccepts', '0',
		'--query_cov', '.9',
		'--maxhits', '10'];

	// Execute vsearch
	console.log("Running vsearch with the command line:");
	console.log(os.token + ': vsearch ', options.join(' '));

	// Execution
	var child = exec('/app/lib/vsearch/bin/vsearch', options);
	child.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.on('close', function(code) {
		if (code == 0) {
			config.params.inputs.match = tmp_match;
			lulu_run (os, config); 	
			callback(os, code);
		} else {
			fs.unlink(directory + tmp_match, ()=>{});
			console.log("vsearch terminate on code " + code);
			callback(os, "vsearch terminate on code " + code);
		}
	});
};



var lulu_run = (os, config, callback) => {
	let directory = '/app/data/' + os.token + '/';
	// let tmp_output = toolbox.tmp_filename() + '.txt';
	//let tmp_output = toolbox.tmp_filename() + '.uc';

	// Run the R script lulu.r
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
	console.log('R CMD BATCH /app/lib/r_scrips/lulu.r', options.join(' '));
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
			config.params.params.ordered = config.params.params.ordered_swarm;
			otu_manager.write_from_uc(os, config, (os, msg) => {
				fs.unlink(directory+tmp_output, ()=>{});
				callback(os, msg);
			});
		}
	});
};




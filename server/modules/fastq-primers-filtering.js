const exec = require('child_process').spawn;
const fs = require('fs');
const toolbox = require('../toolbox.js');

exports.name = 'fastq-primers-filtering';
exports.multicore = false;
exports.category = 'Utils';

exports.run = function (os, config, callback) {
	let token = os.token;
	let directory = '/app/data/' + token + '/';

	let fwd = directory + config.params.inputs.fwd;
	let rev = directory + config.params.inputs.rev;
	let primers = directory + config.params.inputs.primers;
	let tmp_match_fwd = directory + toolbox.tmp_filename() + 'fwd.uc';
	let tmp_match_rev = directory + toolbox.tmp_filename() + 'rev.uc';
	let out_fwd = directory + config.params.outputs.out_fwd;
	let out_rev = directory + config.params.outputs.out_rev;

	// searching primers in the fastq
	console.log ('Checking and removing primers');

	var optionsR1 = ['--usearch_global', primers,
		'--strand', 'both', '--notrunclabels', '--db', fwd,
		'--uc', tmp_match_fwd, '--id', '0.8', '--uc_allhits',
		'--maxaccept', '0', '--maxrejects', '0', '--threads', os.cores];

	console.log("Running vsearch with the command line:");
	console.log('/app/lib/vsearch/bin/vsearch', optionsR1.join(' '));
	fs.appendFileSync(directory + config.log, '--- Command ---\n');
	fs.appendFileSync(directory + config.log, 'vsearch ' + optionsR1.join(' ') + '\n');
	fs.appendFileSync(directory + config.log, '--- Exec ---\n');
	var child = exec('/app/lib/vsearch/bin/vsearch', optionsR1);

	child.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.on('close', function(code) {
		if (code != 0) {
			console.log("Error code " + code + " during vsearch");
			callback(os, code);
		} else {
			console.log("Now filtering the remaining matchin reads from both fastqs");
			// calling vsearch for producing the pairwise matchlist
			config.params.inputs.matchR1 = tmp_match_fwd;
			match_rev(os, config, (os2, msg) => {
				fs.unlink(directory + tmp_match_fwd, ()=>{});
				fs.unlink(directory + tmp_match_rev, ()=>{});
			callback(os2, msg);
			});
		}
	});
};

var match_rev = function (os, config, callback) {
	let token = os.token;
	let directory = '/app/data/' + token + '/';

	let fwd = directory + config.params.inputs.fwd;
	let rev = directory + config.params.inputs.rev;
	let primers = directory + config.params.inputs.primers;
	//let tmp_match_fwd = directory + toolbox.tmp_filename() + '.uc';
	let tmp_match_rev = directory + toolbox.tmp_filename() + 'rev.uc';

	// searching primers in the fastq
	console.log ('Checking and removing primers');

	var optionsR2 = ['--usearch_global', primers,
		'--strand', 'both', '--notrunclabels', '--db', rev,
		'--uc', tmp_match_rev, '--id', '0.8', '--uc_allhits',
		'--maxaccept', '0', '--maxrejects', '0', '--threads', os.cores];

	console.log("Running vsearch with the command line:");
	console.log('/app/lib/vsearch/bin/vsearch', optionsR2.join(' '));
	fs.appendFileSync(directory + config.log, '--- Command ---\n');
	fs.appendFileSync(directory + config.log, 'vsearch ' + optionsR2.join(' ') + '\n');
	fs.appendFileSync(directory + config.log, '--- Exec ---\n');
	var child = exec('/app/lib/vsearch/bin/vsearch', optionsR2);

	child.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.on('close', function(code) {
		if (code != 0) {
			console.log("Error code " + code + " during vsearch");
			callback(os, code);
		} else {
			console.log("Now filtering the remaining matchin reads from both fastqs");
			// calling vsearch for producing the pairwise matchlist
			config.params.inputs.matchR2 = tmp_match_rev;
			filter_reads(os, config, (os2, msg) => {
				fs.unlink(directory + tmp_match_rev, ()=>{});
			callback(os2, msg);
			});
		}
	});
};


var filter_reads = (os, config, callback) => {
	let directory = '/app/data/' + os.token + '/';
	let fwd = directory + config.params.inputs.fwd;
	let rev = directory + config.params.inputs.rev;
	let match_fwd = config.params.inputs.matchR1;
	let match_rev = config.params.inputs.matchR2;
	let outR1 = directory + config.params.outputs.out_fwd;
	let outR2 = directory + config.params.outputs.out_rev;

	// filter options
	var options = ['/app/lib/python_scripts/primers-filtering.py',
		'--fastqR1', fwd,
		'--fastqR2', rev,
		'--primersR1', match_fwd,
		'--primersR2', match_rev,
		'--outR1', outR1,
		'--outR2', outR2]

	// Execute the python script
	console.log("Running python script with the command line:");
	console.log('/app/lib/python_scripts/primers-filtering.py', options.join(' '));
	var child = exec("python3", options);
	child.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.on('close', (code) => {
		if (code != 0) {
			console.log("Error code " + code + " during primer filtering");
			callback(os, code);
		} else {
			callback(os, null);
		}
	});
};

const exec = require('child_process').spawn;
const fs = require('fs');
const csv = require('csv-parser');

const tools = require('../toolbox.js');


exports.name = 'assignment-fasta-vsearch';
exports.multicore = true;
exports.category = 'Assignment';

exports.run = function (os, config, callback) {
	let directory = '/app/data/' + os.token + '/';
	let tmp_uc = tools.tmp_filename() + '.uc';

	var options = ['--usearch_global', directory + config.params.inputs.fasta,
		'--threads', os.cores, '--notrunclabels',
		'--db', directory + config.params.inputs.db,
		'--uc', directory + tmp_uc,
		'--id', config.params.params.similarity,
		'--uc_allhits', '--maxaccept', config.params.params.cons_num];


	console.log("Running vsearch with the command line:");
	console.log('/app/lib/vsearch/bin/vsearch', options.join(' '));
	fs.appendFileSync(directory + config.log, '--- Command ---\n');
	fs.appendFileSync(directory + config.log, 'vsearch ' + options.join(' ') + '\n');
	fs.appendFileSync(directory + config.log, '--- Exec ---\n');
	var child = exec('/app/lib/vsearch/bin/vsearch', options);


	child.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.on('close', function(code) {
		if (code == 0) {
			// Parse the results of the analysis and translate them into the right format.
			let options = ['/app/lib/python_scripts/assignment2tsv.py',
							'-uc', directory + tmp_uc,
							'-out', directory + config.params.outputs.assigned];
			child = exec("python3", options);

			child.stdout.on('data', function(data) {
				fs.appendFileSync(directory + config.log, data);
			});
			child.stderr.on('data', function(data) {
				fs.appendFileSync(directory + config.log, data);
			});

			child.on('close', function(code) {
				fs.unlink(directory + tmp_uc, ()=>{});

				if (code == 0)
					callback(os, null);
				else {
					callback(os, "assignment: Impossible to generate the annotated otu from the clustering files");
				}
			});
		} else {
			console.log("vsearch terminate on code " + code);
			callback(os, "vsearch terminate on code " + code);
		}
	});
};

const exec = require('child_process').spawn;
const fs = require('fs');
const csv = require('csv-parser');

const tools = require('../toolbox.js');
const ass_manager = require('../assignment_manager.js');


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
							'-tsv_out', directory + config.params.outputs.assigned];
			child = exec("python3", options);

			child.stdout.on('data', function(data) {
				fs.appendFileSync(directory + config.log, data);
			});
			child.stderr.on('data', function(data) {
				fs.appendFileSync(directory + config.log, data);
			});

			child.on('close', function(code) {
				fs.unlink(directory + tmp_uc, ()=>{});
				callback(os, null);
			});
		} else {
			console.log("vsearch terminate on code " + code);
			callback(os, "vsearch terminate on code " + code);
		}
	});
};



// var uc_to_assignment = (os, config, callback) => {
// 	let directory = '/app/data/' + os.token + '/';
// 	let uc = config.params.inputs.uc;
// 	let out = config.params.outputs.assigned;

// 	// --- Assignment ---
// 	// Header for uc file
// 	var parser = csv({
// 		separator: '\t',
// 		headers: ['type', 'idx', 'length', 'similarity', 'orientation',
// 				'nuy1', 'nuy2', 'compact', 'name', 'hit']
// 	});

// 	let hits = {};

// 	// Parce the uc file
// 	fs.createReadStream(directory + uc)
// 	.pipe(parser)
// 	// --- Read UC file ---
// 	.on('data', function (data) {
// 		// First assignment => array creation
// 		if (hits[data.name] == undefined) {
// 			hits[data.name] = [];
// 		}

// 		if (data.type != "N") {
// 			// Add candidate assignment for the cluster
// 			hits[data.name].push({
// 				similarity: (data.similarity / 100.0),
// 				sequence_id: data.hit.substr(0, data.hit.indexOf(' ')),
// 				taxon: data.hit.substr(data.hit.indexOf(' ')+1)
// 			});
// 		}
// 	})
// 	.on('end', () => {
// 		callback(hits);
// 	});
// };

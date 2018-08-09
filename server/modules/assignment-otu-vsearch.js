const exec = require('child_process').spawn;
const fs = require('fs');
const csv = require('csv-parser');

const tools = require('../toolbox.js');
const ass_manager = require('../assignment_manager.js');


exports.name = 'assignment-otu-vsearch';
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
			config.params.inputs.uc = tmp_uc;
			uc_to_assignment (os, config, (assignments) => {
				fs.unlink(directory + tmp_uc, ()=>{});

				// Write the assigned otu table
				ass_manager.assignment_to_otu_matrix(
					assignments,
					directory + config.params.inputs.otu_table,
					directory + config.params.outputs.assigned,
					config.params.params.acceptance,
					(msg)=>{callback(os, msg);}
				);
			});
		} else {
			console.log("vsearch terminate on code " + code);
			callback(os, "vsearch terminate on code " + code);
		}
	});
};



var uc_to_assignment = (os, config, callback) => {
	let directory = '/app/data/' + os.token + '/';
	let uc = config.params.inputs.uc;
	let fasta = config.params.inputs.fasta;

	let assignments = {};

	// --- Cluster identification ---
	let clusters = {};
	let reader = tools.fastaReader (directory + fasta);
	reader.onEnd(()=>{
		// --- Assignment ---
		// Header for uc file
		var parser = csv({
			separator: '\t',
			headers: ['type', 'idx', 'length', 'similarity', 'orientation',
					'nuy1', 'nuy2', 'compact', 'name', 'hit']
		});

		// Parce the uc file
		fs.createReadStream(directory + uc)
		.pipe(parser)
		// --- Read UC file ---
		.on('data', function (data) {
			if (data.type == "N")
				return;

			let true_header = data.name  // .substr(0, data.name.indexOf(';'));
			let clust_id = clusters[true_header];

			// First assignment => array creation
			if (assignments[clust_id] == undefined) {
				assignments[clust_id] = [];
			}

			// Add candidate assignment for the cluster
			assignments[clust_id].push({
				similarity: (data.similarity / 100.0),
				sequence_id: data.hit.substr(0, data.hit.indexOf(' ')),
				taxon: data.hit.substr(data.hit.indexOf(' ')+1)
			});
		})
		.on('end', () => {
			callback(assignments);
		});
	});

	let auto_id = 0;
	reader.read_sequences((seq)=>{
		let true_header = seq.header // .substr(0, seq.header.indexOf(';'));
		if (seq.header.includes("cluster=")) {
			let clust_id = seq.header.substr(seq.header.indexOf("cluster=") + 8);
			clust_id = clust_id.substr(0, clust_id.indexOf(';'));

			clusters[true_header] = clust_id;
		} else
			clusters[true_header] = auto_id++;
	});
};

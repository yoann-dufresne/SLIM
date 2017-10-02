const exec = require('child_process').spawn;
const fs = require('fs');


exports.name = 'otu-filtering';
exports.multicore = false;
exports.category = 'Utils';

exports.run = function (os, config, callback) {
	let token = os.token;
	var directory = '/app/data/' + token + '/';

	let thresh = config.params.params.threshold;

	// Init file values
	let matrix = config.params.inputs.matrix;
	let matrix_filtered = matrix.substr(0, matrix.lastIndexOf('.')) + '_filtered_' + thresh + '.tsv';
	
	let centroids = '';
	let centroids_filtered = '';
	if (config.params.inputs.centroids != undefined) {
		centroids = config.params.inputs.centroids;
		centroids_filtered = centroids.substr(0, centroids.lastIndexOf('.')) + '_filtered_' + thresh + '.fasta';
	}

	let reads = '';
	let reads_filtered = '';
	if (config.params.inputs.reads == undefined) {
		reads = config.params.inputs.reads;
		reads_filtered = reads.substr(0, reads.lastIndexOf('.')) + '_filtered_' + thresh + '.fasta';
	}

	// Run the program
	var options = ['/app/lib/python_scripts/matrix_filtering.py',
		'-m', directory + config.params.inputs.matrix,
		'-c', directory + config.params.inputs.centroids,
		'-r', directory + config.params.inputs.reads,
		'-t', config.params.params.threshold];	

	console.log("Running OTU filtering with the command line:");
	console.log('python3', options.join(' '));
	fs.appendFileSync(directory + config.log, '--- Command ---\n');
	fs.appendFileSync(directory + config.log, 'python3 ' + options.join(' ') + '\n');
	fs.appendFileSync(directory + config.log, '--- Exec ---\n');
	var child = exec('python3', options);


	child.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.on('close', function(code) {
		if (code == 0) {
			// Rename the files
			if (!fs.existsSync(directory + config.params.outputs.filtered_matrix))
				fs.renameSync(directory + matrix_filtered, directory + config.params.outputs.filtered_matrix);
			if (centroids != '' && !fs.existsSync(directory + config.params.outputs.filtered_centroids))
				fs.renameSync(directory + centroids_filtered, directory + config.params.outputs.filtered_centroids);
			if (reads != '' && !fs.existsSync(directory + config.params.outputs.filtered_reads))
				fs.renameSync(directory + reads_filtered, directory + config.params.outputs.filtered_reads);

			callback(os, null);
		}
		else
			callback(os, "Problem detected during the OTU filtering execution.");
	});
};

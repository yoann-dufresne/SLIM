const exec = require('child_process').spawn;
const fs = require('fs');

const csv = require('csv-parser');

const toolbox = require('./toolbox.js');


exports.name = 'otu-vsearch';

exports.run = function (token, config, callback) {
	var directory = '/app/data/' + token + '/';
	var tmp_uc_file = directory + toolbox.tmp_filename() + '.txt';
	var tsv_file = directory + config.params.outputs.otus_table;

	var options = ['--cluster_fast', directory + config.params.inputs.fasta,
		'--uc', tmp_uc_file,
		'--id', config.params.params.similarity];

	console.log("Running otu-vsearch with the command line:");
	console.log('/app/lib/vsearch/bin/vsearch', options.join(' '));
	var child = exec('/app/lib/vsearch/bin/vsearch', options);


	child.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	child.on('close', function(code) {
		if (code == 0) {
			csv_to_otu(tmp_uc_file, null, null, () => {callback(token, null);});
		} else
			callback(token, "vsearch " + options[0] + " terminate on code " + code);
	});
};


var csv_to_otu = (csv_file, tsv_file, samples, callback) => {
	console.log('CSV to OTU');

	var parser = csv({
		separator: '\t',
		headers: ['type', 'cluster', 'length', 'similarity', 'orientation',
				'nuy1', 'nuy2', 'compact', 'name', 'centroid']
	});

	fs.createReadStream(csv_file)
	.pipe(parser)
	.on('data', function (data) {
		console.log('%s\t%s\t%s', data.name, data.type, data.centroid);
	})
	.on('end', callback);
};

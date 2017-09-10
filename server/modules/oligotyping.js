const spawn = require('child_process').spawn;
const fs = require('fs');
const tools = require('../toolbox.js');

exports.name = 'oligotyping';
exports.multicore = false;
exports.category = 'Clustering';
exports.run = (os, config, callback) => {
	var token = os.token;
	var tmp_outfile = tools.tmp_filename() + '_padded.fasta';
	// Input fasta file name (required)
	var filename = config.params.inputs.fasta;
	// Output directory
	var out_dir = config.params.outputs.outDir;

	var options = config.params.params;

	var padding = options.padding;
	if (padding == 'true') {
		let config_pad = {params: {
			inputs: {fasta: filename},
			outputs: {fasta: tmp_outfile},
			params: {}
		}, log: config.log};
		pad(os, config_pad, options, out_dir, callback);
	} else {
		var entropy_out = filename + '-ENTROPY';
		let config_ent = {params: {
			inputs: {fasta: filename},
			outputs: {entropy: entropy_out},
			params: {}
		}, log: config.log};
		entropy(os, config_ent, options, out_dir, callback);
	}
};


var gzip_it = function (os, out_dir, callback) {
	var directory = '/app/data/' + os.token + '/';
	var folder = directory + out_dir;
	console.log('Gzipping output folder ' + folder);
	command = ['-zcvf', folder, '-C', folder.replace('.tar.gz', '/'), '.']
	console.log('Command:\ntar', command.join(' '));
	var gzip_run = spawn('tar', command);
	gzip_run.on('close', (code) => {
		// no effect on folder
		fs.unlink(folder.replace('.tar.gz', ''), () => {});
		if (code != 0) {
			console.log("Error code " + code + " during folder compression");
			callback(os, code);
		} else {
			callback(os, null);
		}
	});
};


var oligotyping = function (os, config, options, out_dir, callback) {
	var directory = '/app/data/' + os.token + '/';
	var fasta = config.params.inputs.fasta;
	var entropy = config.params.outputs.entropy;
	// Params
	command = [directory + fasta, directory + entropy,
		'-o', directory + out_dir.replace('.tar.gz', '/'),
		'-s', options.sample,
		'-a', options.abund,
		'-A', options.abundSum,
		'-M', options.abundOligo,
		// to be removed when tk-python bug solved
		'--no-display', '--no-figures',
		'-t', options.sep];

	if (options.auto != '')
		command = command.concat(['-c', options.auto]);
	if (options.manu != '')
		command = command.concat(['-C', options.manu.replace(/^\s+|\s+$/g, '').split(' ').join(',')]);
	// to be added when tk-python bug solved
	//if (options.display == 'false')
	//	command = command.concat(['--no-display', '--no-figures']);
	if (options.sets == 'true')
		command = command.concat(['--generate-sets']);
	if (options.basic == 'true')
		command = command.concat(['--skip-basic-analyses']);
	if (options.gefx == 'true')
		command = command.concat(['--skip-gexf-network-file', '--skip-gen-html']);

	console.log('Command:\noligotype', command.join(' '));
	var oligotype_run = spawn('oligotype', command);
	oligotype_run.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	oligotype_run.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	oligotype_run.on('close', (code) => {
		fs.unlink(directory + entropy, () => {});
		if (fasta.endsWith("_padded.fasta"))
			fs.unlink(directory + fasta, () => {});
		if (code != 0) {
			console.log("Error code " + code + " during oligotyping");
			callback(os, code);
		} else {
			gzip_it(os, out_dir, (os, msg) => {
				callback(os, msg);
			});
		}
	});
};


var entropy = function (os, config, options, out_dir, callback) {
	var directory = '/app/data/' + os.token + '/';
	var fasta = config.params.inputs.fasta;
	var entropy = config.params.outputs.entropy;
	console.log('Calculating entropy traces on ' + fasta);
	var command = [directory + fasta, '--quick', '--no-display'];
	console.log('entropy-analysis ' + command.join(' '));
	var calc_entropy = spawn('entropy-analysis', command);
	calc_entropy.stdout.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	calc_entropy.stderr.on('data', function(data) {
		fs.appendFileSync(directory + config.log, data);
	});
	calc_entropy.on('close', (code) => {
		// WRONG RETURN CODE???
		if (code > 1) {
			console.log("Error code " + code + " during entropy-analysis");
			callback(os, code);
		} else {
			oligotyping(os, config, options, out_dir, (os, msg) => {
				callback(os, msg);
			});
		}
	});
};


var pad = function (os, config, options, out_dir, callback) {
	var directory = '/app/data/' + os.token + '/';
	var fasta_in = config.params.inputs.fasta;
	var fasta_out = config.params.outputs.fasta;
	var entropy_out = fasta_out + '-ENTROPY';
	console.log('Padding fasta: ' + fasta_in);
	var command = ['-i', directory + fasta_in, '-o', directory + fasta_out];
	console.log('/app/lib/scripts/pad_with_gaps/pad_with_gaps.py', command.join(' ') + '\n');
	var pad = spawn('/app/lib/scripts/pad_with_gaps/pad_with_gaps.py', command);
	pad.on('close', (code) => {
		if (code != 0) {
			console.log("Error code " + code + " during pad_with_gaps.py");
			callback(os, code);
		} else {
			let config_ent = {params: {
				inputs: {fasta: fasta_out},
				outputs: {entropy: entropy_out},
				params: {}}, log: config.log};
			entropy(os, config_ent, options, out_dir, (os, msg) => {
				callback(os, msg);
			});
		}
	});
};

const exec = require('child_process').spawn;
const fs = require('fs');
const csv = require('csv-parser');


exports.name = 'demultiplexer';
exports.multicore = false;
exports.category = 'Demultiplexing';

exports.run = function (os, config, callback) {
	let token = os.token;
	var directory = '/app/data/' + token + '/';
	var options = ['-l', directory + config.params.inputs.tags,
		'-p', directory + config.params.inputs.primers,
		'-d', directory,
		'-e', config.params.params.errors,
		'-t'];

	if (config.params.params.mistags == true)
		options = options.concat(['-m']);

	parse_inputs(os.token, config.params.inputs, (executions) => {
		// On errors
		if (executions == null) {
			callback(os, 'Incorrect CSV file');
			return;
		}

		exe_left = Object.keys(executions);

		var run_demux = () => {
			var library = exe_left.pop();
			if (library == undefined) {
				callback(os, 'No library found or wrong CSV format');
				return;
			}

			var local_options = options.concat([
				'-rl', library,
				'-r1', directory + executions[library].r1, 
				'-r2', directory + executions[library].r2,
			]);

			var log = directory + config.log;
			console.log("Running dtd with the command line:");
			console.log('/app/lib/DTD/dtd', local_options.join(' '));
			fs.appendFileSync(log, '--- Command ---\n');
			fs.appendFileSync(log, 'dtd ' + local_options.join(' ') + '\n');
			fs.appendFileSync(log, '--- Exec ---\n');
			var child = exec('/app/lib/DTD/dtd', local_options);


			child.stdout.on('data', function(data) {
				fs.appendFileSync(log, data);
			});
			child.stderr.on('data', function(data) {
				fs.appendFileSync(log, data);
			});
			child.on('close', function(code) {
				if (code == 0) {
					if (exe_left.length == 0)
						if (config.params.params.mistags)
							compress_mistags (Object.keys(executions), token, () => {callback(os, null);});
					else
						run_demux();
				}
				else
					callback(os, "DTD terminate on code " + code);
			});
		}
		run_demux();
	});
};

var compress_mistags = (libraries, token, callback) => {
	var directory = '/app/data/' + token + '/';
	// Create the list of the mistag files
	var files = [];
	for (let lib in libraries) {
		files.push(directory + lib + '_mistag_R1.fastq');
		files.push(directory + lib + '_mistag_R2.fastq');
	}

	// Compress all the mistag files into one mistag archive
	var options = ['--use-compress-program=pigz',
					'-Pcf', directory + 'mistags.tar.gz',
					'-C', directory].concat(files);
	
	var child = exec('tar', options);
	child.on('close', () => {callback();});

	child.stderr.on('data', function(data) {
		console.log('compress err', data.toString());
	});
}

var parse_inputs = (token, inputs, callback) => {
	let directory = '/app/data/' + token + '/';
	var pairs = {};

	var stream = csv({
		separator: ',',
		newline: '\n',  // specify a newline character
		strict: true    // require column length match headers length
	});

	var onError = false;

	fs.createReadStream(directory + inputs.tags)
	.pipe(stream).on('data', function (data) {
		if (!pairs[data.run]) {
			pairs[data.run] = {
				r1: inputs[data.run + '_R1'],
				r2: inputs[data.run + '_R2']
			};
		}
	}).on('end', () => {
		if (!onError)
			callback(pairs);
	}).on('error', (e) => {
		console.log(token + ': ' + e);
		onError = true;
		callback(null);
	});
};

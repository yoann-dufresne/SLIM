const exec = require('child_process').spawn;
const fs = require('fs');


exports.name = 'chimera-vsearch';
exports.multicore = false;

exports.run = function (os, config, callback) {
	let token = os.token;
	var directory = '/app/data/' + token + '/';
	var options = ['--uchime_denovo', directory + config.params.inputs.input,
		'--nonchimeras', directory + config.params.outputs.nonchimeras,
		'--sizeout'];

	if (config.params.outputs.chimeras) {
		options = options.concat(['--chimeras', directory + config.params.outputs.chimeras]);
	}

	console.log("Running chimera-vsearch with the command line:");
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
			callback(token, null);
		}
		else
			callback(token, "vsearch --uchime_denovo terminate on code " + code);
	});
};
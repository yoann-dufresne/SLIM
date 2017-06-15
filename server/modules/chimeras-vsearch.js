const exec = require('child_process').spawn;
const fs = require('fs');


exports.name = 'chimera-vsearch';

exports.run = function (token, config, callback) {
	var directory = '/app/data/' + token + '/';
	var options = ['--uchime_denovo', directory + config.params.inputs.input,
		'--nonchimeras', directory + config.params.outputs.nonchimeras,
		'--sizeout'];

	if (config.params.outputs.chimeras != "") {
		options.concat(['--chimeras', directory + config.params.outputs.chimeras]);
	}

	console.log("Running dtd with the command line:");
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
			callback(token, null);
		}
		else
			callback(token, "vsearch --uchime_denovo terminate on code " + code);
	});
};
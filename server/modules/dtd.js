const exec = require('child_process').spawn;
const fs = require('fs');


exports.name = 'demultiplexer';

exports.run = function (token, config, callback) {
	var directory = '/app/data/' + token + '/';
	var options = ['-r1', directory + config.params.inputs.r1, 
		'-r2', directory + config.params.inputs.r2,
		'-e', directory + config.params.inputs.tags,
		'-o', directory + config.params.inputs.primers,
		'-d', directory,
		'-t',
		(config.params.params.mistags ? '-m' : '')];

	var log = directory + config.log;
	console.log("Running dtd with the command line:");
	console.log('/app/lib/DTD/dtd', options.join(' '));
	fs.appendFileSync(log, '--- Command ---\n');
	fs.appendFileSync(log, 'dtd ' + options.join(' ') + '\n');
	fs.appendFileSync(log, '--- Exec ---\n');
	var child = exec('/app/lib/DTD/dtd', options);


	child.stdout.on('data', function(data) {
		fs.appendFileSync(log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync(log, data);
	});
	child.on('close', function(code) {
		if (code == 0) {
			callback(token, null);
		}
		else
			callback(token, "DTD terminate on code " + code);
	});
};
const exec = require('child_process').spawn;
const fs = require('fs');


exports.name = 'demultiplexer';

exports.run = function (token, config, callback) {
	console.log("Running dtd with the command line:");
	console.log('/app/lib/DTD/dtd \
		-r1 /app/data/' + token + '/' + config.params.inputs.r1 + ' \
		-r2 /app/data/' + token + '/' + config.params.inputs.r2 + ' \
		-e /app/data/' + token + '/' + config.params.inputs.tags + ' \
		-o /app/data/' + token + '/' + config.params.inputs.primers + ' \
		-d /app/data/' + token + '/' + (config.params.params.mistags ? ' -m' : ''));

	var child = exec('/app/lib/DTD/dtd',
		['-r1', '/app/data/' + token + '/' + config.params.inputs.r1, 
		'-r2', '/app/data/' + token + '/' + config.params.inputs.r2,
		'-e', '/app/data/' + token + '/' + config.params.inputs.tags,
		'-o', '/app/data/' + token + '/' + config.params.inputs.primers,
		'-d', '/app/data/' + token + '/',
		(config.params.params.mistags ? '-m' : '')]);


	// // Replace callback if mistags are saved
	// if (config.params.params.mistags) {
	// 	var mistags = (callback) => {
	// 		fs.renameSync(
	// 			'/app/data/' + token + '/mistag_R1.fastq',
	// 			'/app/data/' + token + '/' + config.params.params.project + '_mistag_R1.fastq'
	// 		);
	// 		fs.renameSync(
	// 			'/app/data/' + token + '/mistag_R2.fastq',
	// 			'/app/data/' + token + '/' + config.params.params.project + '_mistag_R2.fastq'
	// 		);
	// 	};
	// }


	child.stdout.on('data', function(data) {
		fs.appendFileSync('/app/data/' + token + '/' + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync('/app/data/' + token + '/' + config.log, data);
	});
	child.on('close', function(code) {
		if (code == 0) {
			callback(token, null);
		}
		else
			callback(token, "DTD terminate on code " + code);
	});
};
const exec = require('child_process').spawn;
const fs = require('fs');



var compress_outputs = (config, callback, token, str) => {
	// Compress outputs
	if (config.params.outputs) {
		// Retrive jokers
		var jokers = [];
		for (var filename in config.params.outputs) {
			if (filename.includes('*'))
				jokers.push(filename);
		}

		// If no joker
		if (jokers.length == 0) {
			callback(token, str);
			return;
		}

		var nbThreads = jokers.length;
		// Compress
		for (var idx=0 ; idx<jokers.length ; idx++) {
			var joker = jokers[idx];
			var begin = joker.substring(0, joker.indexOf('*'));
			var end = joker.substring(joker.indexOf('*') + 1);

			// Get all the files linked to the joker
			var files = [];
			for (var filename in config.params.outputs) {
				if (filename.startsWith(begin) && filename.endsWith(end)) {
					if (! filename.includes('*'))
						files.push('/app/data/' + token + '/' + filename);
				}
			}

			// Start the compression
			if (files.length > 0) {
				var options = ['--use-compress-program=pigz',
					'-Pcf', '/app/data/' + token + '/' + joker + '.gz'].concat(files);
				var child = exec('tar', options);
				child.on('close', () => {
					nbThreads--;
					if (nbThreads == 0) {
						callback(token, str);
					}
				});

				child.stderr.on('data', function(data) {
					console.log('compress err', data.toString());
				});
			}
		}
	} else {
		callback(token, str);
	}
}


// ----- Software executions -----


exports.run = function (token, config, callback) {
	var soft_name = config.name;

	var modified_callback = (token, str) => {
		compress_outputs(config, callback, token, str);
	};

	switch (soft_name) {
		case 'pandaseq':
			runPandaseq(token, config, modified_callback);
		break;
		case 'demultiplexer':
			runDtd(token, config, modified_callback);
		break;
		default:
			callback(token, 'Software ' + soft_name + ' undetecteed');
	}
}

var runPandaseq = function (token, config, callback) {
	console.log("Running pandaseq with the command line:");
	console.log('/app/lib/pandaseq/pandaseq ' +
		' -f /app/data/' + token + '/' + config.params.inputs.fwd +
		' -r /app/data/' + token + '/' + config.params.inputs.rev +
		' -w /app/data/' + token + '/' + config.params.outputs.assembly);

	var child = exec('/app/lib/pandaseq/pandaseq',
		['-f', '/app/data/' + token + '/' + config.params.inputs.fwd,
		'-r', '/app/data/' + token + '/' + config.params.inputs.rev,
		'-w', '/app/data/' + token + '/' + config.params.outputs.assembly]);


	child.stdout.on('data', function(data) {
		fs.appendFileSync('/app/data/' + token + '/' + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync('/app/data/' + token + '/' + config.log, data);
	});
	child.on('close', function(code) {
		if (code == 0)
			callback(token, null);
		else
			callback(token, "pandaseq terminate on code " + code);
	});
};


var runDtd = function (token, config, callback) {
	console.log("Running dtd with the command line:");
	console.log('/app/lib/DTD/dtd \
		-r1 /app/data/' + token + '/' + config.params.inputs.r1 + ' \
		-r2 /app/data/' + token + '/' + config.params.inputs.r2 + ' \
		-e /app/data/' + token + '/' + config.params.inputs.tags + ' \
		-o /app/data/' + token + '/' + config.params.inputs.primers + ' \
		-d /app/data/' + token + '/');

	var child = exec('/app/lib/DTD/dtd',
		['-r1', '/app/data/' + token + '/' + config.params.inputs.r1, 
		'-r2', '/app/data/' + token + '/' + config.params.inputs.r2,
		'-e', '/app/data/' + token + '/' + config.params.inputs.tags,
		'-o', '/app/data/' + token + '/' + config.params.inputs.primers,
		'-d', '/app/data/' + token + '/']);


	child.stdout.on('data', function(data) {
		fs.appendFileSync('/app/data/' + token + '/' + config.log, data);
	});
	child.stderr.on('data', function(data) {
		fs.appendFileSync('/app/data/' + token + '/' + config.log, data);
	});
	child.on('close', function(code) {
		if (code == 0)
			callback(token, null);
		else
			callback(token, "DTD terminate on code " + code);
	});
};






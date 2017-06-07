const exec = require('child_process').spawn;
const fs = require('fs');



exports.compress_outputs = (token, jokers) => {
	console.log(token, jokers);
	fs.readdir("/app/data/" + token, (err, items) => {
		var nbThreads = jokers.length;
		console.log(items);
		// Compress
		for (var id in jokers) {
			var joker = jokers[id];
			var begin = joker.substring(0, joker.indexOf('*'));
			var end = joker.substring(joker.indexOf('*') + 1);

			console.log('joker : ', joker, begin, end);

			// Get all the files linked to the joker
			var files = [];
			for (var filename_idx=0 ; filename_idx<items.length ; filename_idx++) {
				var filename = items[filename_idx];
				if (filename.startsWith(begin) && filename.endsWith(end)) {
					if (! filename.includes('*'))
						files.push(filename);
				}
			}

			console.log("Files : ", files);

			// Start the compression
			if (files.length > 0) {
				var options = ['--use-compress-program=pigz',
					'-Pcf', '/app/data/' + token + '/' + joker + '.tar.gz',
					'-C', '/app/data/' + token + '/'].concat(files);
				var child = exec('tar', options);
				child.on('close', () => {});

				child.stderr.on('data', function(data) {
					console.log('compress err', data.toString());
				});
			}
		}
	});
}


// ----- Software executions -----


exports.run = function (token, config, callback) {
	var soft_name = config.name;

	switch (soft_name) {
		case 'pandaseq':
			runPandaseq(token, config, callback);
		break;
		case 'demultiplexer':
			runDtd(token, config, callback);
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






const exec = require('child_process').spawn;
const fs = require('fs');



// ---- Software inits -----

let modules = {};

fs.readdir('/app/modules/', (err, items) => {
	// Errors
	if (err) {
		console.log(err);
		return;
	}

	// Load modules
	for (var idx=0 ; idx<items.length ; idx++) {
		let filename = items[idx];

		if (!filename.endsWith('.js'))
			continue;

		let module = require('/app/modules/' + filename);
		modules[module.name] = module;
	}

	console.log('Module loaded: ', JSON.stringify(Object.keys(modules)));
});


exports.expose_modules = (app) => {
	app.get('/softwares', (req, res) => {
		res.send(JSON.stringify(Object.keys(modules)));
	});
};






// ----- Software executions -----


exports.run = function (token, config, callback) {
	var soft_name = config.name;

	if (modules[soft_name])
		modules[soft_name].run(token, config, callback);
	else
		callback(token, 'Software ' + soft_name + ' undetecteed');
}




// ----- Execution tools -----


exports.compress_outputs = (token, jokers) => {
	fs.readdir("/app/data/" + token, (err, items) => {
		var nbThreads = jokers.length;
		
		// Compress
		for (var id in jokers) {
			var joker = jokers[id];
			var begin = joker.substring(0, joker.indexOf('*'));
			var end = joker.substring(joker.indexOf('*') + 1);

			// Get all the files linked to the joker
			var files = [];
			for (var filename_idx=0 ; filename_idx<items.length ; filename_idx++) {
				var filename = items[filename_idx];
				if (filename.startsWith(begin) && filename.endsWith(end)) {
					if (! filename.includes('*'))
						files.push(filename);
				}
			}

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







const exec = require('child_process').spawn;
const fs = require('fs');

const scheduler = require('./scheduler.js');


// ----- Job submitions -----

exports.listen_commands = function (app) {
	app.post('/run', function (req, res) {
		params = req.body;

		// Token verifications
		if (params.token == undefined) {
			res.status(403).send('No token present in the request')
			return;
		}

		var token = params.token;
		delete params.token;

		// Verification of the existance of the token
		if (! fs.existsSync('/app/data/' + token)){
			res.status(403).send('Invalid token')
			return;
		}

		// Save the conf and return message
		fs.writeFile('/app/data/' + token + '/pipeline.conf', JSON.stringify(params), (err) => {
			if (err) throw err;
			console.log(token + ': configuration saved!');
		});
		res.send('Pipeline started');

		// Create the execution log file
		var logFile = '/app/data/' + token + '/exec.log';
		var exe = {
			status: "waiting",
			conf: params,
			order: null
		};
		for (var idx in exe.params) {
			exe.params[idx].status = "waiting";
		}
		fs.writeFileSync(logFile, JSON.stringify(exe));

		// Schedule the softwares
		var order = computeSoftwareOrder(params, token);
		// If dependencies are not satisfied
		if (order.length < Object.keys(params).length) {
			exe.status = 'aborted';
			exe.msg = "dependencies not satisfied";

			fs.writeFile(logFile, JSON.stringify(exe), function (err) {if (err) console.log(err)});
			return;
		}

		exe.status = 'ready';
		exe.order = order;
		fs.writeFile(logFile, JSON.stringify(exe), function (err) {if (err) console.log(err)});

		scheduler.addJob(token);
	});
}


var computeSoftwareOrder = function (params, token) {
	// Compute the dependenciess
	dependencies = {};
	for (var key in params) {
		var soft = params[key];

		// Unique identifier for an execution (Needed if the are multiple executions
		// of the same tool in one run).
		soft.params.id = key;

		// look for dependencies
		for (var id in soft.params.inputs) {
			var file = soft.params.inputs[id];
			if (dependencies[file] == undefined)
				dependencies[file] = [];
			dependencies[file].push(key);
		}
	}


	// Compute the order from the dependencies
	var order = [];
	var filesAvailable = [];

	// Add to the available files all the uploads
	var filenames = fs.readdirSync('/app/data/' + token);
	for (var idx in filenames) {
		filesAvailable.push(filenames[idx]);
	}

	// DFS on files
	while (filesAvailable.length > 0) {
		var filename = filesAvailable.pop();

		if (dependencies[filename] == undefined)
			continue;

		var dep = dependencies[filename];
		delete dependencies[filename];

		// Will look for each soft if it can be executed
		for (var soft_id in dep) {
			var soft = params[key];

			// Look if each dependencie is satisfied
			var isExecutable = true;
			for (var id in soft.params.inputs) {
				var file = soft.params.inputs[id];
				if (dependencies[file] != undefined) {
					isExecutable = false;
					break;
				}
			}

			// Add the software in the queue if it's not already present
			if (isExecutable && order.indexOf(soft_id) == -1) {
				order.push(soft_id);
				for (var id in soft.params.inputs) {
					var file = soft.params.inputs[id];
					filesAvailable.push(file);
				}
			}
		}
	}

	return order;
}





// ----- Software executions -----


exports.run = function (token, config, callback) {
	var soft_name = config.name;

	switch (soft_name) {
		case 'pandaseq':
			runPandaseq(token, config, callback);
		break;
		default:
			callback(token, 'Software ' + soft_name + ' undetecteed');
	}
}

var runPandaseq = function (token, config, callback) {
	console.log("Running pandaseq with the command line:");
	console.log('/app/lib/pandaseq/pandaseq \
		-f /app/data/' + token + '/' + config.params.inputs.fwd + ' \
		-r /app/data/' + token + '/' + config.params.inputs.rev + ' \
		-w /app/data/' + token + '/' + config.params.outputs.assembly);
	//callback(token, null, "Ok");

	// var child = exec('/app/lib/pandaseq/pandaseq \
	// 	-f /app/data/' + token + '/' + config.params.inputs.fwd + ' \
	// 	-r /app/data/' + token + '/' + config.params.inputs.rev + ' \
	// 	-w /app/data/' + token + '/' + config.params.outputs.assembly);

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
}




// var runPandaseq = function (token, params, callback) {
// 	exec('/app/lib/pandaseq/pandaseq \
// 		-f /app/data/' + token + '/' + params.fwd + ' \
// 		-r /app/data/' + token + '/' + params.rev + ' \
// 		-w /app/data/' + token + '/' + params.output,
// 	function (error, stdout, stderr) {
// 		callback('ended');
// 	});

// 	//callback(token, err, log);
// }

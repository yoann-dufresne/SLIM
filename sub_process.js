const exec = require('child_process').exec;
const fs = require('fs');

exports.listen_commands = function (app) {
	app.post('/run', function (req, res) {
		params = req.body;

		// Token verifications
		if (params.token == undefined)
			res.status(403).send('No token present in the request')

		var token = params.token;
		delete params.token;

		// Verification of the existance of the token
		if (! fs.existsSync('/app/data/' + token)){
			res.status(403).send('Invalid token')
			return;
		}

		var order = computeSoftwareOrder(params, token);
		console.log(order);

		res.send(order);

		// switch (soft.name) {
		// 	case 'pandaseq':
		// 		runPandaseq(token, soft.params, function (str) {
		// 			res.send(str);
		// 		});
		// }
	});
}


var computeSoftwareOrder = function (params, token) {
	// Compute the dependanciess
	dependancies = {};
	for (var key in params) {
		var soft = params[key];

		// Unique identifier for an execution (Needed if the are multiple executions
		// of the same tool in one run).
		soft.params.id = key;

		// look for dependancies
		for (var id in soft.params.inputs) {
			var file = soft.params.inputs[id];
			if (dependancies[file] == undefined)
				dependancies[file] = [];
			dependancies[file].push(key);
		}
	}


	// Compute the order from the dependancies
	var order = [];
	var filesAvailable = [];

	// Add to the available files all the uploads
	var filenames = fs.readdirSync('/app/data/' + token);
	for (var idx in filenames) {
		filesAvailable.push(filenames[idx]);
	}

	console.log(JSON.stringify(dependancies));
	console.log(JSON.stringify(filesAvailable));

	// DFS on files
	while (filesAvailable.length > 0) {
		var filename = filesAvailable.pop();

		if (dependancies[filename] == undefined)
			continue;

		var dep = dependancies[filename];
		delete dependancies[filename];

		// Will look for each soft if it can be executed
		for (var soft_id in dep) {
			console.log(soft_id);
			var soft = params[key];
			console.log(soft);

			// Look if each dependencie is satisfied
			var isExecutable = true;
			for (var id in soft.params.inputs) {
				var file = soft.params.inputs[id];
				console.log(file);
				if (dependancies[file] != undefined) {
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

// TODO !!!!
// var exec = require('child_process').exec;
// var child = exec('node ./commands/server.js');
// child.stdout.on('data', function(data) {
//     console.log('stdout: ' + data);
// });
// child.stderr.on('data', function(data) {
//     console.log('stdout: ' + data);
// });
// child.on('close', function(code) {
//     console.log('closing code: ' + code);
// });

var runPandaseq = function (token, params, callback) {
	exec('/app/lib/pandaseq/pandaseq \
		-f /app/data/' + token + '/' + params.fwd + ' \
		-r /app/data/' + token + '/' + params.rev + ' \
		-w /app/data/' + token + '/' + params.output,
	function (error, stdout, stderr) {
		callback('ended');
	});
}

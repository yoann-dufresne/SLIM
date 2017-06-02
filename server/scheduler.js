
const fs = require('fs');
const sub_process = require('./sub_process.js');


var waiting_jobs = [];
var running_jobs = {};


exports.start = function () {
	setInterval (scheduler, 10000);
};

var scheduler = function () {
	// Add a new job if not so busy
	if (Object.keys(running_jobs).length == 0 && waiting_jobs.length > 0) {
		var token = waiting_jobs.shift();
		fs.readFile ('/app/data/' + token + '/exec.log', (err, data) => {
			if (err) throw err;
			
			// Load the configuration file.
			running_jobs[token] = JSON.parse(data);
		});
	}
	
	// Update the software executions
	for (var token in running_jobs) {
		var job = running_jobs[token];
		if (job.status == "ready") {
			// Verify if ended
			if (job.order == null || job.order.length == 0) {
				job.status = 'ended';
				fs.writeFile('/app/data/' + token + '/exec.log', JSON.stringify(job), (err) => {});
				console.log(token + ': Ended');

				// Mayby problematic: TODO : verify with multiple jobs
				delete running_jobs[token];
				continue;
			}

			// Lanch the next software for the current job
			var nextId = job.order.shift();

			// Update the software status
			job.status = "running";
			job.running_soft = nextId;
			job.conf[nextId].status = "running";
			job.conf[nextId].log = 'out_' + nextId + '.log';

			// Callback of the sub-process
			sub_process.run(token, job.conf[nextId], (token, err) => {
				var job = running_jobs[token];

				// Abord the pipeline if an error occur.
				if (err) {
					job.status = 'aborted';
					job.msg = err;
					fs.writeFile('/app/data/' + token + '/exec.log', JSON.stringify(job), (err) => {});
					delete running_jobs[token];

					console.log(token + ': aborted');
					return;
				}

				// Add software output to the log file and modify the status.
				job.status = 'ready';
				job.conf[job.running_soft].status = "ended";
				delete job.running_soft;

				// Save the status
				running_jobs[token] = job;
				fs.writeFileSync('/app/data/' + token + '/exec.log', JSON.stringify(job));
			});

			// Save the staatus
			running_jobs[token] = job;
			fs.writeFileSync('/app/data/' + token + '/exec.log', JSON.stringify(job));
			console.log (token + ': status updated');
		}
	}
};

exports.addJob = function (token) {
	waiting_jobs.push(token);
};



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

		// Modify the the parameters if there are joken tokens in the inputs
		let files = getAllFiles(params, token);
		//console.log(JSON.stringify(params), '\n\n');
		var test = expand_parameters (params, files);
		console.log(JSON.stringify(test));

		// TODO : to remove
		res.send("canceled");
		return;
		// /TODO

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

		waiting_jobs.push(token);
	});
}

exports.expose_status = function (app) {
	app.get('/status', function (req, res) {
		// If no token, send back a general status
		if (req.query.token == undefined) {
			res.send(JSON.stringify({queue_size: waiting_jobs.length}));
			return ;
		}

		var token = req.query.token;
		var execFile = '/app/data/' + token + '/exec.log';
		// Invalid token
		if (!fs.existsSync(execFile)) {
			res.status(403).send('Invalid token');
			return ;
		}

		// Send back execution status
		fs.readFile(execFile, (err, data) => {
			var exec = JSON.parse(data);
			var status = {global:exec.status, jobs:{}};

			if (status.global == 'aborted')
				status.msg = exec.msg;

			for (var idx in exec.conf) {
				if (exec.conf[idx].status == undefined)
					status.jobs[idx] = 'ready';
				else
					status.jobs[idx] = exec.conf[idx].status;
			}

			res.send(JSON.stringify(status));
		});
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
		var filename = filesAvailable.shift();

		if (dependencies[filename] == undefined)
			continue;

		var dep = dependencies[filename];
		delete dependencies[filename];

		// Will look for each soft if it can be executed
		for (var soft_id in dep) {
			soft_id = dep[soft_id];

			var soft = params[soft_id];

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
				for (var id in soft.params.outputs) {
					var file = soft.params.outputs[id];
					filesAvailable.push(file);
				}
			}
		}
	}

	return order;
}


var expand_parameters = (params, no_joker_files) => {
	for (var soft_id in params) {
		var inputs = params[soft_id].params.inputs;
		var outputs = params[soft_id].params.outputs;

		// Store all the files for a common joker subpart
		var configurations = {};

		// Explore all the inputs
		for (var in_id in inputs) {
			var filename = inputs[in_id];

			// Save for 
			if (filename.includes('*')) {
				let begin = filename.substring(0, filename.indexOf('*'));
				let end = filename.substring(filename.indexOf('*')+1);

				// Look for corresponding files
				for (var idx=0 ; idx<no_joker_files.length ; idx++) {
					var candidate = no_joker_files[idx];
					// If the file correspond, extract the core text
					if (candidate.startsWith(begin) && candidate.endsWith(end)) {
						var core = candidate.substring(begin.length);
						core = core.substring(0, core.indexOf(end));

						// Get the config
						var config = configurations[core] ? configurations[core] :
							JSON.parse(JSON.stringify(params[soft_id]));
						// Update the config
						config.params.inputs[in_id] = candidate;
						configurations[core] = config;
					}
				}
			}
		}

		var conf_array = [];
		// Update outputs if *
		for (id in configurations) {
			let config = configurations[id];
			for (out_id in config.params.outputs) {
				let filename = config.params.outputs[out_id];

				if (filename.includes('*')) {
					// Save the joker
					if (!config.out_jokers)
						config.out_jokers = {};
					config.out_jokers[out_id] = filename;

					// Replace the * by the complete name
					config.params.outputs[out_id] = filename.replace('\*', id);
				}
			}

			conf_array.push(config);
		}
		// Update if no joker
		if (conf_array.length == 0) {
			conf_array.push(params[soft_id]);
		}

		params[soft_id] = conf_array;
	}

	return params;
};


var getAllFiles = (params, token) => {
	// Get Uploaded files
	var filenames = fs.readdirSync('/app/data/' + token);

	// Get the files that will be created
	for (var soft_id in params) {
		var outputs = params[soft_id].params.outputs;

		for (var out_id in outputs) {
			let filename = outputs[out_id];
			if (filenames.indexOf(filename) == -1)
				filenames.push(filename);
		}
	}

	return filenames
};

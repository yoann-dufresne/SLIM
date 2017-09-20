
const fs = require('fs');
const si = require('systeminformation');
const formidable = require('formidable');

const sub_process = require('./sub_process.js');
const uploads = require('./files_upload.js');
const mailer = require('./mail_manager.js');
const accounts = require('./accounts.js');


var waiting_jobs = [];
var running_jobs = {};


// --- Parametric values ---
var NB_CORES = 1;
var MAX_JOBS = 1;
const CORES_BY_RUN = 8;
const SCHEDULE_TIME = 10000;


exports.urls = {};


exports.start = function () {
	si.cpu((data) => {
		NB_CORES = data.cores;
		MAX_JOBS = Math.ceil(NB_CORES/CORES_BY_RUN);

		console.log('Scheduler started on an ' + NB_CORES + ' cores cpu');
		console.log(MAX_JOBS + ' executions can be done simultaneously');
		setInterval (scheduler, SCHEDULE_TIME);
	});
};

var scheduler = function () {
	// Add a new job if not so busy
	if (Object.keys(running_jobs).length < MAX_JOBS && waiting_jobs.length > 0) {
		let token = waiting_jobs.shift();
		fs.readFile ('/app/data/' + token + '/exec.log', (err, data) => {
			if (err) throw err;
			
			// Load the configuration file.
			running_jobs[token] = JSON.parse(data);
		});
	}
	
	// Update the software executions
	for (let token in running_jobs) {
		let directory = '/app/data/' + token + '/';

		let job = running_jobs[token];
		if (job.status == "ready") {
			// Verify if ended
			if (job.order == null || job.order.length == 0) {
				job.status = 'ended';
				fs.writeFile(directory + 'exec.log', JSON.stringify(job), (err) => {});
				console.log(token + ': Ended');

				// Mayby problematic:
				uploads.trigger_job_end(token);
				delete running_jobs[token];
				continue;
			}

			// Lanch the next software for the current job
			let nextId = job.order.shift();

			// Update the software status
			job.status = "running";
			job.running_soft = nextId;

			// Define output log files and status for all the sub-jobs in the current job
			// Sub-jobs are input/output variations on the same software
			let configs_array = job.conf[nextId];
			for (let sub_idx=0 ; sub_idx<configs_array.length ; sub_idx++) {
				configs_array[sub_idx].status = "waiting";
				configs_array[sub_idx].log = 'out_' + nextId + '_' + sub_idx + '.log';
				// Clear pevious log if exists
				let filepath = directory + configs_array[sub_idx].log;
				if (fs.existsSync(filepath))
					fs.unlinkSync(filepath);
			}
			job.conf[nextId] = configs_array;

			// Save the status
			running_jobs[token] = job;
			fs.writeFileSync(directory + 'exec.log', JSON.stringify(job));
			console.log (token + ': status updated');

			// Start the sub-process
			sub_process_start(token, configs_array);
		}
	}
};


var sub_process_start = (tok, configs_array) => {
	let token = tok;
	let job = running_jobs[token];
	job.next_sub_idx = 0;
	job.sub_ended = 0;

	job.conf[job.running_soft][0].status = 'running';
	fs.writeFileSync('/app/data/' + token + '/exec.log', JSON.stringify(job));

	var sub_process_callback = (os, err) => {
		let my_sub_idx = os.idx;

		// Abord the pipeline if an error occur.
		if (err) {
			console.log(token + ': error in sub exec ' + my_sub_idx);
			job.conf[job.running_soft][my_sub_idx].status = 'aborted';
		} else {
			// Add software output to the log file and modify the status.
			job.conf[job.running_soft][my_sub_idx].status = "ended";
		}
		
		// Save the status
		job.sub_ended += 1;
		running_jobs[token] = job;

		// recursively call sub_process_start
		if (job.next_sub_idx < configs_array.length) {
			sub_process.run(
				{token:token, cores:CORES_BY_RUN, idx:job.next_sub_idx},
				configs_array[job.next_sub_idx],
				sub_process_callback
			);
			job.next_sub_idx += 1;
		} else if (job.sub_ended == configs_array.length) {// Stop the job
			let nbAborted = 0;
			for (let idx=0 ; idx<configs_array.length ; idx++)
				if (job.conf[job.running_soft][idx].status == 'aborted')
					nbAborted += 1;

			// Abort the execution
			if (nbAborted == configs_array.length) {
				delete running_jobs[token]
				job.status = 'aborted';
			}
			// Reset the status for next job
			else {
				job.status = 'ready';

				// Compact output if needed
				if (job.conf[job.running_soft][0].out_jokers) {
					sub_process.compress_outputs(token, job.conf[job.running_soft][0].out_jokers);
				}
			}

			delete job.running_soft;
			delete job.next_sub_idx;
			delete job.sub_ended;
		}
		fs.writeFileSync('/app/data/' + token + '/exec.log', JSON.stringify(job));
	}

	// Define limit of multiple similar software lanch.
	var limit = 1;
	if (!sub_process.multicore)
		limit = Math.min(configs_array.length, CORES_BY_RUN);

	// Lanch initial sub-softwares
	job.next_sub_idx = limit;
	for (let lanch_idx=0 ; lanch_idx<limit ; lanch_idx++)
		try {
			sub_process.run({token:token, cores:CORES_BY_RUN, idx:lanch_idx}, configs_array[lanch_idx], sub_process_callback);
		} catch (err) {
			// Continue the execution in case of bad module run
			console.log(err);
			job.status = 'aborted';
			fs.writeFileSync('/app/data/' + token + '/exec.log', JSON.stringify(job));
			delete running_jobs[token]
		}
};



// ----- Job submitions -----


exports.listen_commands = function (app) {
	app.post('/run', function (req, res) {
		var params = req.body;

		var form = new formidable.IncomingForm();
		let token = null;
		let file = null;

		form.on('field', function (field, value) {
			if (field == "token")
				token = value;
		});

		form.on('file', function(field, f) {
			if (field == "config")
				file = f;
		});

		form.on('end', function () {
			// Verify data integrity
			if (token == null || !accounts.tokens[token] || !file) {
				console.log('Wrong token', token);
				res.status(400).send('Wrong token');
				return;
			}

			// Save the url
			exports.urls[token] = req.protocol + '://' + req.get('host') + '?token=' + token;

			// Move the file in the fine directory
			let filename = '/app/data/' + token + '/' + 'config.log';

			// Remove previous config
			if (fs.existsSync(filename))
				fs.unlinkSync(filename);

			// Parse config
			fs.renameSync(file.path, filename);
			let txt = fs.readFileSync(filename, 'utf8');
			let params = JSON.parse(txt);

			// Answer the client
			run_job(params, (code, msg) => {
				res.status(code).send(msg ? msg : "");
			});
		});
		form.parse(req);
	});
}


var run_job = (params, callback) => {
	// Token verifications
	if (params.token == undefined) {
		callback(403, 'No token present in the request')
		return;
	}

	var token = params.token;
	var mail = params.mail;
	delete params.token;
	delete params.mail;

	// Verification of the existance of the token
	if (! fs.existsSync('/app/data/' + token)){
		callback(403, 'Invalid token')
		return;
	}
	// Save URL and mail address
	mailer.mails[token] = mail;

	// Send a mail and cancel the directory removal
	if (uploads.deletions[token])
			clearTimeout(uploads.deletions[token]);
	mailer.send_address(token);

	// Save the conf and return message
	fs.writeFileSync('/app/data/' + token + '/pipeline.conf', JSON.stringify(params));
	console.log(token + ': configuration saved!');

	// Create the execution log file
	var logFile = '/app/data/' + token + '/exec.log';
	
	for (var idx in params) {
		params[idx].status = "waiting";
	}
	var exe = {
		status: "waiting",
		conf: params,
		order: null
	};
	fs.writeFileSync(logFile, JSON.stringify(exe));
	callback(200, 'Pipeline started');
	
	// Schedule the softwares
	var order = computeSoftwareOrder(params, token);

	// If dependencies are not satisfied
	if (order.length < Object.keys(exe.conf).length) {
		exe.status = 'aborted';
		exe.msg = "dependencies not satisfied: " +
			JSON.stringify(Object.keys(global_dependencies[token]));
		console.log("dependencies not satisfied:\n", global_dependencies[token]);

		fs.writeFileSync(logFile, JSON.stringify(exe));
		return;
	}

	// Explicit input file names
	let files = getAllFiles(params, token);
	exe.conf = expand_parameters(token, params, files, order)

	// Finalise status
	exe.status = 'ready';
	exe.order = order;
	fs.writeFileSync(logFile, JSON.stringify(exe));

	waiting_jobs.push(token);
};



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
			res.send('{}');
			return ;
		}

		// Send back execution status
		let data = fs.readFileSync(execFile);
		var exec = JSON.parse(data);
		var status = {global:exec.status, jobs:{}};

		if (status.global == 'aborted')
			status.msg = exec.msg;

		// Browse process
		for (var idx in exec.conf) {
			sub_status = {};
			// Analyse the sub process results
			for (var sub_idx=0 ; sub_idx<exec.conf[idx].length ; sub_idx++) {
				let st = exec.conf[idx][sub_idx].status;
				sub_status[st] = sub_status[st] ? sub_status[st] + 1 : 1;
			}

			// Write
			switch (Object.keys(sub_status).length ) {
			case 0:
				status.jobs[idx] = 'ready';
				break;
			case 1:
				status.jobs[idx] = Object.keys(sub_status)[0];
				break;
			default:
				// If aborted
				if (sub_status['aborted']) {
					if (sub_status['aborted'] == exec.conf[idx].length)
						status.jobs[idx] = 'aborted';
					else
						status.jobs[idx] = 'errors';
					break;
				}

				// If it's running
				var total = 0;
				for (var key in sub_status) {
					total += sub_status[key];
				}

				status.jobs[idx] = 'running';
				status.sub_jobs = total;
				status.sub_ended = sub_status['ended'] ? sub_status['ended'] : 0;
			}
		}

		res.send(JSON.stringify(status));
	});
}


var global_dependencies = {};
var computeSoftwareOrder = function (params, token) {
	// Compute the dependenciess
	var dependencies = {};
	for (let key in params) {
		let soft = params[key];

		// Unique identifier for an execution (Needed if the are multiple executions
		// of the same tool in one run).
		soft.params.id = key;

		// look for dependencies
		for (let id in soft.params.inputs) {
			let file = soft.params.inputs[id];
			file = file.replace('$', '*');

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
	// Add the jokers
	if (uploads.jokers[token])
		filesAvailable = filesAvailable.concat(Object.keys(uploads.jokers[token]));

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

	global_dependencies[token] = dependencies;
	return order;
}

var expand_parameters = (token, params, no_joker_files, order) => {
	for (var idx in order) {
		var soft_id = order[idx];

		// $ expantions
		var inputs = demux_files(params[soft_id].params.inputs, no_joker_files);
		params[soft_id].params.inputs = inputs;

		// * demultiplexing
		var dev_params = demux_executions(token, params, soft_id, no_joker_files);
		// Copy soft parameters
		params[soft_id] = dev_params[soft_id];
		// Add jokers
		for (var id in dev_params.out_jokers)
			params.out_jokers[id] = dev_params.out_jokers[id];
		// Add new files to list
		for (var idx in dev_params.new_files) {
			var filename = dev_params.new_files[idx];
			if (!no_joker_files.includes(filename))
				no_joker_files.push(filename);
		}
	}

	return params;
}

// From one entry, demux entry files
var demux_files = (inputs, files) => {
	// Explore all the inputs
	for (let file_id in inputs) {
		let filename = inputs[file_id];

		if (filename.includes('$')) {
			delete inputs[file_id];
			let begin = filename.substring(0, filename.indexOf('$'));
			let end = filename.substring(filename.indexOf('$')+1);

			// Look for corresponding files
			for (let idx=0 ; idx<files.length ; idx++) {
				let candidate = files[idx];

				if (candidate.includes('$'))
					continue;

				// If the file correspond, extract the core text
				if (candidate.startsWith(begin) && candidate.endsWith(end)) {
					inputs[candidate] = candidate;
				}
			}
		}
	}

	return inputs;
}


// From one entry, generate multiple exactutions
var demux_executions = (token, params, soft_id, no_joker_files) => {
	var inputs = params[soft_id].params.inputs;
	var outputs = params[soft_id].params.outputs;

	// Store all the files for a common joker subpart
	var configurations = {};

	// Explore all the inputs
	for (var in_id in inputs) {
		var filename = inputs[in_id];

		// Save for 
		if (filename.includes('*')) {
			let files = get_joker_files(token, filename, no_joker_files);

			let prefix = filename.substring(0, filename.indexOf('*'));
			let suffix = filename.substring(filename.indexOf('*')+1);

			// // Look for corresponding files
			for (var idx=0 ; idx<files.length ; idx++) {
				let file = files[idx];
				let core = file.substr(prefix.length);
				core = core.substr(0, core.length-suffix.length);

				// Get the config
				var config = configurations[core] ? configurations[core] :
					JSON.parse(JSON.stringify(params[soft_id]));
				// Update the config
				config.params.inputs[in_id] = file;
				configurations[core] = config;
			}
		}
	}


	// Explore all the outputs
	var out_jokers = {};
	for (var out_id in outputs) {
		let filename = outputs[out_id];
		if (filename.includes('*')) {
			out_jokers[out_id] = filename;
		}
	}


	var conf_array = [];
	// Update outputs if * in input
	for (id in configurations) {
		let config = configurations[id];
		config.new_files = {};
		for (out_id in config.params.outputs) {
			let filename = config.params.outputs[out_id];

			if (filename.includes('*')) {
				// Replace the * by the complete name
				config.params.outputs[out_id] = filename.replace('\*', id);
				config.new_files[id] = config.params.outputs[out_id];
				no_joker_files.push(config.params.outputs[out_id]);
			}
		}
		if (Object.keys(out_jokers).length > 0)
			config.out_jokers = out_jokers;

		conf_array.push(config);
	}
	// Update if no joker
	if (conf_array.length == 0) {
		conf_array.push(params[soft_id]);
		if (Object.keys(out_jokers).length > 0)
			conf_array[0].out_jokers = out_jokers;
	}

	params[soft_id] = conf_array;
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
			if ((!filename.includes('*')) && filenames.indexOf(filename) == -1)
				filenames.push(filename);
		}
	}

	return filenames
};

var get_joker_files = (token, filename, no_joker_files) => {
	if (uploads.jokers[token] && uploads.jokers[token][filename]) {
		// Joker from zip
		return uploads.jokers[token][filename];
	} else {
		// Joker by filename
		let begin = filename.substring(0, filename.indexOf('*'));
		let end = filename.substring(filename.indexOf('*')+1);

		let filelist = [];
		// Look for corresponding files
		for (var idx=0 ; idx<no_joker_files.length ; idx++) {
			var candidate = no_joker_files[idx];

			if (candidate.includes('*'))
				continue;

			// If the file correspond, extract the core text
			if (candidate.startsWith(begin) && candidate.endsWith(end))
				filelist.push(candidate);
		}

		return filelist;
	}
}

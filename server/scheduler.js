
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
			if (job.order.length == 0) {
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

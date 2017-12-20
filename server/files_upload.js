const fs = require('fs');
const formidable = require('formidable');
const path = require('path');
const exec = require('child_process').spawn;

const mailer = require('./mail_manager.js');

exports.jokers = {};
exports.deletions = {};

exports.exposeDir = function (app) {
	// list data directory
	app.get('/list', function(req, res) {
		let token = req.query.token;

		fs.readdir("/app/data/" + token, function(err, items) {
			// If token incorrect
			if (!items) {
				res.status(403).send("bad token");
				console.log('/list bad token');
				return;
			}

			for (var idx=0 ; idx<items.length ; idx++) {
				if (items[idx].endsWith('.log') || items[idx].endsWith('.conf')) {
					items.splice(idx, 1);
					idx--;
				}
			}
			
			let jok = exports.jokers[token] ? exports.jokers[token] : {};

			items = items.concat(Object.keys(jok));
			res.send(items);
		});
	});
};


let files_to_process = {};

exports.upload = function (app) {
	app.get('/convertion', function(req, res) {
		var token = req.query.token;

		if (files_to_process[token])
			res.send(JSON.stringify(files_to_process[token]));
		else
			res.send('[]');
	});

	// Uploading files service
	app.post('/upload', function(req, res) {
		// create an incoming form object
		var form = new formidable.IncomingForm();

		// specify that we want to allow the user to upload multiple files in a single request
		form.multiples = true;

		// set upload directory corresponding to the token send
		var token = null;
		var onError = false;
		form.on('field', function(name, value) {
			if (onError)
				return;

			if (name == 'token') {
				if (fs.existsSync('/app/data/' + value)) {
					token = value;
					form.uploadDir = path.join(__dirname, '/data/' + value);
				} else {
					res.status(403).send('Invalid token');
					onError = true;
				}
			}	
		});

		// every time a file has been uploaded successfully,
		// convert and rename it to it's orignal name
		form.on('file', function(field, file) {
			if (onError)
				return;

			if (token == null)
				fs.unlink(file.path, function(){})
			else {
				// Remove file if already exists
				let filepath = '/app/data/' + token + '/' + file.name;
				if (fs.existsSync(filepath))
					fs.unlinkSync(filepath);

				if (file.name.endsWith('gz'))
					decompress_archive(token, file);
				else
					proccess_file(token, file, form.uploadDir);
			}
		});

		// log any errors that occur
		form.on('error', function(err) {
			console.log('An error has occured: \n' + err);
		});

		// once all the files have been uploaded, send a response to the client
		form.on('end', function() {
			if (onError)
				return;

			var send_success = () => {
				if (!files_to_process[token] || files_to_process[token].length > 0)
					setTimeout(send_success, 100);
				else
					res.send('success');
			}
			send_success();

			// Remove previous deletion delay
			if (exports.deletions[token])
				clearTimeout(exports.deletions[token]);

			// Delete data after 2h if they are not used.
			exports.deletions[token] = setTimeout(
				() => {
					require('child_process').exec('rm -rf /app/data/' + token, (err)=>{
						if (err)
							console.log(err);
						else
							console.log(token + ': files deleted');
					});
				},
				1000 * 3600 * 2
			);
		});

		// parse the incoming request containing the form data
		form.parse(req);
	});
};


var decompress_archive = (token, archive) => {
	if (archive.name.endsWith('.tar.gz'))
		decompress_tgz(token, archive);
	else
		decompress_gz(token, archive);
};

var decompress_gz = (token, archive) => {
	if (!files_to_process[token])
		files_to_process[token] = [];
	files_to_process[token].push(archive.name);
	
	fs.renameSync(archive.path, '/app/data/' + token + '/' + archive.name);
	archive.path = '/app/data/' + token + '/' + archive.name;

	let gunzip = exec('gunzip', [archive.path]);

	gunzip.stdout.on('data', (data) => {
		console.log(data);
	});
	gunzip.stderr.on('data', (data) => {
		console.log(`stderr: ${data}`);
	});
	gunzip.on('close', () => {
		files_to_process[token].splice (files_to_process[token].indexOf(archive.name), 1);
	});
};

let decompress_tgz = function (token, archive) {
	let dir = '/app/data/' + token + '/';

	if (!files_to_process[token])
		files_to_process[token] = [];
	files_to_process[token].push(archive.name);

	let prefix = null;
	let suffix = null;
	let file_list = [];

	exec('tar', ['-xvf', archive.path, '-C', dir])
	.stdout.on('data', (data) => {
		let names = data.toString('utf8').trim().split('\n');

		for (let name_idx=0 ; name_idx<names.length ; name_idx++) {
			data = names[name_idx];
			// Create file to process
			let file = {
				name: data,
				path: dir + data
			};
			file_list.push(file);

			// Determine maximal prefix
			if (prefix == null)
				prefix = file.name;
			else {
				// Get the first idx for different 
				let cmon_idx;
				for (cmon_idx=0 ; cmon_idx<prefix.length ; cmon_idx++)
					if (prefix[cmon_idx] != file.name[cmon_idx])
						break;
				prefix = prefix.substr(0, cmon_idx);
			}

			// Determine maximal suffix
			if (suffix == null)
				suffix = file.name;
			else {
				let delta_size = file.name.length - suffix.length;

				// Get the first idx for different 
				let cmon_idx;
				for (cmon_idx=suffix.length-1 ; cmon_idx>=0 ; cmon_idx--) {
					if (suffix[cmon_idx] != file.name[cmon_idx + delta_size])
						break;
				}
				suffix = suffix.substr(cmon_idx+1);
			}
		}
	})
	.on('close', () => {
		fs.unlinkSync(archive.path);

		// Create an archive joker
		if (file_list.length > 1 && (prefix.length > 0 || suffix.length > 0)) {
			let files = [];
			for (let idx in file_list) {
				let file = file_list[idx];
				proccess_file(token, file, dir);
				files.push(file.name);
			}

			if (!exports.jokers[token])
				exports.jokers[token] = {};

			file_list2 = file_list.map((file) => {return file.name;});
			exports.jokers[token][prefix + '*' + suffix] = file_list2;
		}

		files_to_process[token].splice (files_to_process[token].indexOf(archive.name), 1);
	});
};


var proccess_file = (token, file, upload_dir) => {
	// Add files to convertion array
	if (!files_to_process[token])
		files_to_process[token] = [];
	files_to_process[token].push(file.name);

	// Transform in unix format
	exec('dos2unix', [file.path, '-q'])
	.on('close', () => {
		exec('mac2unix', [file.path, '-q'])
		.on('close', () => {
			// Rename
			fs.renameSync(file.path, path.join(upload_dir, file.name));

			files_to_process[token].splice (files_to_process[token].indexOf(file.name), 1);
		});
	});
};



exports.trigger_job_end = (token) => {
	// End mail
	mailer.send_end_mail (token);

	// Reminder
	setTimeout (
		() => {mailer.send_delete_reminder(token)},
		1000 * 3600 * 23
	);

	// Delete environment 24h15 after the process end
	setTimeout (
		() => {require('child_process').exec('rm -rf /app/data/' + token, (err)=>{
			if (err)
				console.log(err);
			else
				console.log(token + ': files deleted');
		});},
		1000 * 3600 * 24 + 15 * 60000
	);	
};

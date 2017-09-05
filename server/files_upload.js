const fs = require('fs');
const formidable = require('formidable');
const path = require('path');
const exec = require('child_process').spawn;

exports.jokers = {};

exports.exposeDir = function (app) {
	// list data directory
	app.get('/list', function(req, res) {
		fs.readdir("/app/data/" + req.query.token, function(err, items) {
			// If token incorrect
			if (!items) {
				res.status(403).send("bad token");
				console.log('/list bad call');
				return;
			}

			for (var idx=0 ; idx<items.length ; idx++) {
				if (items[idx].endsWith('.log') || items[idx].endsWith('.conf')) {
					items.splice(idx, 1);
					idx--;
				}
			}
			
			res.send(items);
		});
	});
}


let files_to_convert = {};

exports.upload = function (app) {
	app.get('/convertion', function(req, res) {
		var token = req.query.token;

		if (files_to_convert[token])
			res.send(JSON.stringify(files_to_convert[token]));
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
		form.on('field', function(name, value) {
			if (name == 'token') {
				if (fs.existsSync('/app/data/' + value)) {
					token = value;
					form.uploadDir = path.join(__dirname, '/data/' + value);
				} else {
					res.status(403).send('Invalid token')
				}
			}	
		});

		// every time a file has been uploaded successfully,
		// convert and rename it to it's orignal name
		form.on('file', function(field, file) {
			if (token == null)
				fs.unlink(file.path, function(){})
			else {
				// Remove file if already exists
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
			res.send('success');
		});

		// parse the incoming request containing the form data
		form.parse(req);
	});
};


var decompress_archive = (token, archive) => {
	let dir = '/app/data/' + token + '/';

	let ext = null;
	let file_list = [];

	exec('tar', ['-xvf', archive.path, '-C', dir])
	.stdout.on('data', (data) => {
		// Create file to process
		let file = {
			name: data.toString('utf8').trim(),
			path: dir + data.toString('utf8').trim()
		};
		file_list.push(file.name);

		// Determine file extensions
		let tmp_ext = file.name.substr(file.name.lastIndexOf('.')+1);
		if (ext == null) {
			ext = tmp_ext;
		} else if (ext == "" || ext != tmp_ext) {
			ext = "";
		}
	})
	.on('close', () => {
		fs.unlink(archive.path, ()=>{});

		// Create an archive joker
		if (file_list.length > 1 && ext != "") {
			let files = [];
			for (let idx=0 ; idx<file_list.length ; idx++) {
				let file = file_list[idx];
				proccess_file(token, file, dir);
				files.push(file.name);
			}

			let arch_name = archive.name.substr(0, archive.name.lastIndexOf('.tar.gz'));
			exports.jokers[arch_name + '*.' + ext] = file_list;
		}
	});
};


var proccess_file = (token, file, upload_dir) => {
	// Add files to convertion array
	if (!files_to_convert[token])
		files_to_convert[token] = [];
	files_to_convert[token].push(file.name);

	// Transform in unix format
	exec('dos2unix', [file.path, '-q'])
	.on('close', () => {
		exec('mac2unix', [file.path, '-q'])
		.on('close', () => {
			// Rename
			fs.rename(file.path, path.join(upload_dir, file.name), function (err) {
				if (err)
					console.log('Error during file upload: ' + err);

				files_to_convert[token].splice (files_to_convert[token].indexOf(file.name), 1);
			});
		});
	});
};

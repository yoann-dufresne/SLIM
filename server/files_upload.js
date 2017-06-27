const fs = require('fs');
const formidable = require('formidable');
const path = require('path');
const exec = require('child_process').spawn;

exports.exposeDir = function (app) {
	// list data directory
	app.get('/list', function(req, res) {
		fs.readdir("/app/data/" + req.query.token, function(err, items) {
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


exports.upload = function (app) {
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
				// Transform in unix format
				exec('dos2unix', [file.path]).on('close', () => {
					exec('mac2unix', [file.path]).on('close', () => {
						// Rename
						fs.rename(file.path, path.join(form.uploadDir, file.name), function (err) {
							if (err)
								console.log('Error during file upload: ' + err);
						});
					});
				});
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
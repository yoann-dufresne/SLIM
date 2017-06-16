const exec = require('child_process').spawn;
const fs = require('fs');


exports.name = 'toolbox';

exports.run = (token, config, callback) => {
	if (config.params.params.soft == "merge_fasta")
		exports.merge_fasta(token, config, callback);
};



var tmp_filename = () => {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

	for( var i=0; i < 10; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
};
exports.tmp_filename = tmp_filename;


// --- Merging fasta ---

exports.merge_fasta = (token, config, callback) => {
	var outfile = '/app/data/' + token + '/' + config.params.outputs.merged;

	// Write a new empty file
	fs.closeSync(fs.openSync(outfile, 'w'));

	// Process fasta one by one
	var fastas = Object.values(config.params.inputs);


	var merge = () => {
		var current_fasta = '/app/data/' + token + '/' + fastas.pop();
		
		// Copy the file
		var tmp_current = tmp_filename() + '.fasta';
		fs.linkSync(current_fasta, tmp_current);

		// Rereplicate
		exports.rereplicate(tmp_current, ()=> {
			// Read the tmp file
			var data = fs.readFileSync(tmp_current);

			// Append at the end and remove tmp files
			fs.appendFileSync(outfile, data);

			// Delete the tmp file
			fs.unlinkSync(tmp_current);

			if (fastas.length > 0)
				merge();
			else
				exports.dereplicate(outfile, ()=>{callback(token, null);});
		});
	};
	merge();
};



// --- Dereplication ---

exports.rereplicate = (filename, callback) => {
	console.log ('Rereplication for file ' + filename);
	var intermediate_file = tmp_filename() + '.fasta';

	var options = ['--rereplicate', filename,
		'--sizeout',
		'--output', intermediate_file];

	var child = exec('/app/lib/vsearch/bin/vsearch', options);
	child.on('close', (code) => {
		if (code != 0) {
			console.log("Error code " + code + " during rereplication");
			return;
		}

		fs.renameSync(intermediate_file, filename);
		callback();
	});
};


// --- Dereplication ---
exports.dereplicate = (filename, callback) => {
	console.log ('Dereplication for file ' + filename);
	var intermediate_file = tmp_filename() + '.fasta';

	var options = ['--derep_fulllength', filename,
		'--sizeout',
		'--output', intermediate_file];

	var child = exec('/app/lib/vsearch/bin/vsearch', options);
	child.on('close', (code) => {
		if (code != 0) {
			console.log("Error code " + code + " during dereplication");
			return;
		}

		fs.renameSync(intermediate_file, filename);
		callback();
	});
};


// --- Sorting ---
exports.sort = (filename, callback) => {
	console.log ('Sorting file ' + filename);
	var intermediate_file = tmp_filename() + '.fasta';

	var options = ['--sortbysize', filename,
		'--sizeout',
		'--output', intermediate_file];

	var child = exec('/app/lib/vsearch/bin/vsearch', options);
	child.on('close', (code) => {
		if (code != 0) {
			console.log("Error code " + code + " during dereplication");
			return;
		}

		fs.renameSync(intermediate_file, filename);
		callback();
	});
};

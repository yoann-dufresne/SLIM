const exec = require('child_process').spawn;
const fs = require('fs');
var lineReader = require('line-reader');


// --- generic tools ---
var tmp_filename = () => {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

	for( var i=0; i < 10; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
};
exports.tmp_filename = tmp_filename;


// --- Sorting ---
exports.sort = (filename, callback) => {
	console.log ('Sorting file ' + filename);
	var intermediate_file = tmp_filename() + '.fasta';

	var options = ['--sortbysize', filename,
		'--sizeout', '--quiet',
		'--minseqlength', '1',
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




// --- Fasta reader ---
class fastaReader {
	constructor (filename) {
		var that = this;

		lineReader.open(filename, function(err, reader) {
			if (err)
				console.log(err);
			else
				that.reader = reader;
		});
	}

	read_sequences (sequence_processor) {
		var that = this;

		// Wait until file is ready
		if (!this.reader) {
			setTimeout(()=>{that.read_sequences(sequence_processor);}, 100);
			return;
		}

		// Create new sequence
		if (!this.seq)
			this.seq = {value:""};

		// Close the file
		if (!this.reader.hasNextLine()) {
			this.reader.close(()=>{});

			if (this.callback) 
				this.callback();
			return;
		}

		// Add a new line
		var read_next_line = function () {
			that.reader.nextLine(function(err, line) {
				// EOF
				if (!line)
					that.callback();

				// Read header
				if (line.length > 0 && line[0] == '>') {
					var seq = that.seq;
					that.seq = {header:line.substr(1), value:""};

					if (seq.header)
						sequence_processor(seq);
					that.read_sequences(sequence_processor)
				// Read sequence value
				} else {
					that.seq.value += line;

					if (that.reader.hasNextLine())
						return read_next_line ();
					else {
						if (that.seq.header)
							sequence_processor(that.seq)

						that.callback();
					}
				}
			});
		}
		read_next_line();
	}

	onEnd (callback) {
		this.callback = callback;
	}
}
exports.fastaReader = (file) => {return new fastaReader(file)};



// --- Fasta reader ---
class fastqReader {
	constructor (filename) {
		var that = this;

		lineReader.open(filename, function(err, reader) {
			if (err)
				console.log(err);
			else
				that.reader = reader;
		});
	}

	read_sequences (sequence_processor) {
		var that = this;

		// Wait until file is ready
		if (!this.reader) {
			setTimeout(()=>{that.read_sequences(sequence_processor);}, 100);
			return;
		}

		// Add a new line
		var line_idx = 0;
		var seq;
		var read_next_line = function () {
			that.reader.nextLine(function(err, line) {
				// EOF
				if (!line)
					that.callback();

				// Read header
				if (line.length > 0) {
					if (line_idx == 0) {
						seq = {header:line.substr(1), value:"", quality:""};
					} else if (line_idx == 1) {
						seq.value = line;
					} else if (line_idx == 3) {
						seq.quality = line;
						line_idx = -1;
						sequence_processor(seq);
					}

					line_idx += 1;

					// Next lines
					// Close the file
					if (!that.reader.hasNextLine()) {
						that.reader.close(()=>{});

						if (that.callback) 
							that.callback();
						return;
					} else
						read_next_line();
				// Read sequence value
				} else {
					that.callback();
				}
			});
		}
		read_next_line();
	}

	onEnd (callback) {
		this.callback = callback;
	}
}
exports.fastqReader = (file) => {return new fastqReader(file)};

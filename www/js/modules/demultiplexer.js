
class DemultiplexerModule extends Module {
	constructor (params) {
		super ("demultiplexer");

		this.out_files = [];
		this.params = params;
	}

	onFileChange (file_manager, event) {
		/* Select elements for autocomplete fields */
		var elements = file_manager.getFiles();
		var fastq  = file_manager.getFiles(['.fastq', '.fastq.gz', '.fastq.bz2']);
		for (var idx=0 ; idx<fastq.length ; idx++)
			fastq[idx] = {value:fastq[idx], data:fastq[idx]};
		var fasta  = file_manager.getFiles(['.fasta']);
		for (var idx=0 ; idx<fasta.length ; idx++)
			fasta[idx] = {value:fasta[idx], data:fasta[idx]};
		var csv  = file_manager.getFiles(['.csv']);
		for (var idx=0 ; idx<csv.length ; idx++)
			csv[idx] = {value:csv[idx], data:csv[idx]};


		/* Change the autocomplete field */
		// Input fastq
		var that = this;
		$(this.r1_text).autocomplete({
			lookup: fastq,
			onSelect: function(suggestion) {
				that.r1_text.value = suggestion.data;
			}
		});
		$(this.r2_text).autocomplete({
			lookup: fastq,
			onSelect: function(suggestion) {
				that.r2_text.value = suggestion.data;
			}
		});

		// Input tags
		$(this.tags_text).autocomplete({
			lookup: csv,
			onSelect: function(suggestion) {
				that.tags_text.value = suggestion.data;
				that.tags_text.onchange();
			}
		});

		// Input primers
		$(this.primers_text).autocomplete({
			lookup: fasta,
			onSelect: function(suggestion) {
				that.primers_text.value = suggestion.data;
			}
		});
	}

	onLoad () {
		var that = this;

		// Register to the file manager
		file_manager.register_observer(function (man, event) {
			that.onFileChange(man, event);
		});

		// Define things
		this.defineIO();
	}

	defineIO () {
		// Save inputs
		var inputs = this.dom.getElementsByTagName('input');
		this.r1_text = inputs[0];
		this.r2_text = inputs[1];
		this.tags_text = inputs[2];
		this.primers_text = inputs[3];

		// Reload inputs
		if (this.params.inputs) {
			this.r1_text.value = this.params.inputs.r1;
			this.r2_text.value = this.params.inputs.r2;
			this.tags_text.value = this.params.inputs.tags;
			this.primers_text.value = this.params.inputs.primers;
		}

		this.out_area = this.dom.getElementsByClassName('file_list')[0];
		// Reload outputs
		if (this.params.outputs) {
			for (var filename in this.params.outputs) {
				this.out_files.push(filename)
				this.out_area.innerHTML += this.format_output(filename);
			}
		}

		// Load suggestions in the inputs
		this.onFileChange(file_manager, {});
		
		var that = this;
		// Change the output files using the tags file
		this.tags_text.onchange = function () {
			that.out_files = [];
			that.out_area.innerHTML = "";

			// The file is not uploaded
			if (file_manager.contents[that.tags_text.value] == undefined)
				return;

			// Get the file content
			var data = file_manager.contents[that.tags_text.value].data;
			for (var idx=0 ; idx<data.length ; idx++) {
				var sample = data[idx];

				// Add the run with joker
				if (that.out_files.indexOf(sample.run + "*_fwd.fastq") == -1) {
					that.out_files.push(sample.run + "*_fwd.fastq");
					that.out_files.push(sample.run + "*_rev.fastq");
				}

				// Add the sample outfiles
				that.out_files.push(sample.run + "_" + sample.sample + "_fwd.fastq");
				that.out_files.push(sample.run + "_" + sample.sample + "_rev.fastq");
			}

			// Add the files in the output text area
			for (var idx=0 ; idx<that.out_files.length ; idx++) {
				that.out_area.innerHTML += that.format_output(that.out_files[idx]);
			}

			// Notify the files manager
			var event = new Event('new_output');
			event.files = that.out_files;
			document.dispatchEvent(event);
		}
	}

	format_output(filename) {
		return '<p>' + filename +
		'  <a href="/data/' + exec_token + '/' + filename +
		(filename.includes('*') ? '.tar.gz' : '') +
		'"><img src="/imgs/download.png" class="download"></a></p>'
	}

	getConfiguration () {
		var config = super.getConfiguration()
		
		config.inputs.r1 = this.r1_text.value;
		config.inputs.r2 = this.r2_text.value;
		config.inputs.tags = this.tags_text.value;
		config.inputs.primers = this.primers_text.value;

		for (var idx=0 ; idx<this.out_files.length ; idx++) {
			var filename = this.out_files[idx];
			config.outputs[filename] = filename;
		}
		
		return config;
	}
};

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
		var lib_divs = this.illumina_div.getElementsByClassName('lib_div');
		for (let idx=0 ; idx<lib_divs.length ; idx++) {
			let lib_div = lib_divs[idx];

			let read_inputs = lib_div.getElementsByClassName('reads_file');

			let r1 = read_inputs[0];
			let r2 = read_inputs[1];
			$(r1).autocomplete({
				lookup: fastq,
				onSelect: function(suggestion) {
					r1.value = suggestion.data;
				}
			});
			$(r2).autocomplete({
				lookup: fastq,
				onSelect: function(suggestion) {
					r2.value = suggestion.data;
				}
			});
		}

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

		let as = this.dom.getElementsByClassName('options')[0].getElementsByTagName('a');
		as[0].href = file_manager.get_download_link('mistag_R1.fastq');
		as[1].href = file_manager.get_download_link('mistag_R2.fastq');

		// Define things
		this.defineIO();
	}

	create_R1R2_pair (library_name) {
		var pair_div = document.createElement('div');
		pair_div.classList.add('lib_div');
		pair_div.innerHTML = '<p>' + library_name + '</p>' +
			'<p class="illumina_read R1">R1 <input type="text" class="reads_file"></p>' +
			'<p class="illumina_read R2">R2 <input type="text" class="reads_file"></p>';

		return pair_div;
	}

	defineIO () {
		// Save inputs
		this.illumina_div = this.dom.getElementsByClassName('illumina_reads')[0];
		this.tags_text = this.dom.getElementsByClassName('demux_t2s')[0];
		this.primers_text = this.dom.getElementsByClassName('demux_primers')[0];
		this.mistags = this.dom.getElementsByClassName('demux_mistag')[0];

		// Reload inputs
		if (this.params.inputs) {
			var read_files = this.params.inputs.reads;
			for (var name in read_files) {
				var pair = read_files[name];
				
				this.illumina_div.appendChild(pair_div);
			}

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
			var libraries = [];
			for (var idx=0 ; idx<data.length ; idx++) {
				var sample = data[idx];

				// Add the run with joker
				if (!libraries.includes(sample.run)) {
					libraries.push(sample.run);
					that.out_files.push(sample.run + "*_fwd.fastq");
					that.out_files.push(sample.run + "*_rev.fastq");
				}

				// Add the sample outfiles
				that.out_files.push(sample.run + "_" + sample.sample + "_fwd.fastq");
				that.out_files.push(sample.run + "_" + sample.sample + "_rev.fastq");
			}

			// Create inputs for each library
			that.illumina_div.innerHTML = "";
			console.log (libraries);
			for (var l_idx in libraries) {
				var lib = libraries[l_idx];
				var lib_div = that.create_R1R2_pair(lib);
				that.illumina_div.appendChild(lib_div);
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
		'  <a href="' + file_manager.get_download_link(filename) +
		'"><img src="/imgs/download.png" class="download"></a></p>';
	}

	getConfiguration () {
		var config = super.getConfiguration()
		
		var read_pairs = {};
		var lib_divs = this.illumina_div.getElementsByClassName('lib_div');
		for (let idx=0 ; idx<lib_divs.length ; idx++) {
			let lib_div = lib_divs[idx];
			let read_inputs = lib_div.getElementsByClassName('reads_file');

			let lib_name = lib_div.firstChild.innerText;
			read_pairs[lib_name] = {
				r1: read_inputs[0].value,
				r2: read_inputs[1].value
			};
		}
		config.inputs.reads = read_pairs;

		config.inputs.tags = this.tags_text.value;
		config.inputs.primers = this.primers_text.value;

		for (var idx=0 ; idx<this.out_files.length ; idx++) {
			var filename = this.out_files[idx];
			config.outputs[filename] = filename;
		}

		config.params.mistags = this.mistags.checked;
		
		return config;
	}
};

module_manager.moduleCreators.demultiplexer = (params) => {
	return new DemultiplexerModule(params);
};


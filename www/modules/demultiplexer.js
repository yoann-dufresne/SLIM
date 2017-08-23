
class DemultiplexerModule extends Module {
	constructor (params) {
		super ("demultiplexer", "https://github.com/yoann-dufresne/amplicon_pipeline/wiki/Double-Tag-Demultiplexing-(DTD)");

		this.out_files = [];
		this.params = params;
	}

	onLoad () {
		let as = this.dom.getElementsByClassName('options')[0].getElementsByTagName('a');
		as[0].href = file_manager.get_download_link('mistag_R1.fastq');
		as[1].href = file_manager.get_download_link('mistag_R2.fastq');

		this.defineIO();
		super.onLoad();
		gui_file_updater.file_trigger();
	}

	create_R1R2_pair (library_name, pair) {
		if (!pair)
			pair = {r1:"", r2:""};
		var pair_div = document.createElement('div');
		pair_div.classList.add('lib_div');
		pair_div.innerHTML = '<p>' + library_name + '</p>' +
			'<p class="illumina_read R1">R1 '
				+ '<input type="text" name="' + library_name + '_R1" '
				+ 'class="reads_file input_file fastq" value="' + pair.r1 + '">'
			+ '</p><p class="illumina_read R2">R2 '
				+ '<input type="text" name="' + library_name + '_R2" '
				+ 'class="reads_file input_file fastq" value="' + pair.r2 + '">'
			+ '</p>';

		return pair_div;
	}

	defineIO () {
		// Save inputs
		this.illumina_div = this.dom.getElementsByClassName('illumina_reads')[0];

		// --- Reload inputs ---
		if (this.params.inputs) {
			// Reconstruct pair
			var pairs = {};
			for (let id in this.params.inputs) {
				// Detect inputs from pairs
				if (id.endsWith('_R1') || id.endsWith('_R2')) {
					let split = id.split('_');

					// Add new library
					if (!pairs[split[0]])
						pairs[split[0]] = {};

					// Add file
					pairs[split[0]][split[1].toLowerCase()] = this.params.inputs[id];
				}
			}

			// Create inputs
			for (var name in pairs) {
				var pair_div = this.create_R1R2_pair(name, pairs[name]);
				this.illumina_div.appendChild(pair_div);
			}
		}

		this.out_area = this.dom.getElementsByClassName('file_list')[0];
		// Reload outputs
		if (this.params.outputs) {
			for (var filename in this.params.outputs) {
				this.out_files.push(filename)
				this.out_area.innerHTML += this.format_output(filename);
			}
		}
		
		// Change the output files using the tags file
		var that = this;
		let tags_text = this.dom.getElementsByClassName('tags')[0];
		tags_text.onchange = function () {
			that.out_files = [];
			that.out_area.innerHTML = "";

			// The file is not uploaded
			if (file_manager.contents[tags_text.value] == undefined)
				return;

			// Get the file content
			var data = file_manager.contents[tags_text.value].data;
			var csv_name = tags_text.value;
			csv_name = csv_name.substr(0, csv_name.lastIndexOf('.'));
			var libraries = [];
			var nbLibs = 0;
			for (let idx=0 ; idx<data.length ; idx++) {
				let sample = data[idx];

				// Add the run with joker
				if (!libraries.includes(sample.run)) {
					libraries.push(sample.run);
					that.out_files.push(csv_name + '_' + sample.run + "*_fwd.fastq");
					that.out_files.push(csv_name + '_' + sample.run + "*_rev.fastq");
					nbLibs++;
				}

				// Add the sample outfiles
				that.out_files.push(csv_name + '_' + sample.run + "_" + sample.sample + "_fwd.fastq");
				that.out_files.push(csv_name + '_' + sample.run + "_" + sample.sample + "_rev.fastq");
			}
			// Add general file if there are multiple libraries
			if (nbLibs > 1) {
				that.out_files.push(csv_name + "*_fwd.fastq");
				that.out_files.push(csv_name + "*_rev.fastq");
			}

			// Create inputs for each library
			that.illumina_div.innerHTML = "";
			for (let l_idx in libraries) {
				let lib = libraries[l_idx];
				let lib_div = that.create_R1R2_pair(lib);
				that.illumina_div.appendChild(lib_div);
			}

			// Add the files in the output text area
			for (let idx=0 ; idx<that.out_files.length ; idx++) {
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
		'" download><img src="/imgs/download.png" class="download"></a></p>';
	}

	getConfiguration () {
		var config = super.getConfiguration()

		for (var idx=0 ; idx<this.out_files.length ; idx++) {
			var filename = this.out_files[idx];
			config.outputs[filename] = filename;
		}
		
		return config;
	}
};

module_manager.moduleCreators.demultiplexer = (params) => {
	return new DemultiplexerModule(params);
};


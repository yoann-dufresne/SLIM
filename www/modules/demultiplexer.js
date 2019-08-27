
class DemultiplexerModule extends Module {
	constructor (params) {
		super ("demultiplexer", "https://github.com/yoann-dufresne/amplicon_pipeline/wiki/Double-Tag-Demultiplexing-(DTD)");

		this.out_files = [];
		this.params = params;
	}

	onLoad () {
		let as = this.dom.getElementsByClassName('options')[0].getElementsByTagName('a');
		as[0].href = file_manager.get_download_link('mistags.tar.gz');

		this.defineIO();
		super.onLoad();
		gui_file_updater.file_trigger();
	}

	defineIO () {
		let tags_text = this.dom.getElementsByClassName('tags')[0];

		// Save inputs
		this.illumina_div = this.dom.getElementsByClassName('illumina_reads')[0];

		// --- Reload inputs ---
		if (this.params.inputs) {
			let libs = {};
			// Reconstruct pairs
			for (let input in this.params.inputs) {
				if (input.endsWith('_R1') || input.endsWith('_R2')) {
					// Retrive libname from filename
					let libname = input.substr(0, input.length-3);

					// If library already exist, pass
					if (libs[libname])
						continue;

					this.illumina_div.appendChild(this.create_R1R2_pair(libname, {
						r1: this.params.inputs[libname + '_R1'],
						r2: this.params.inputs[libname + '_R2']
					}));
					libs[libname] = true;
				}
			}
		}

		this.out_area = this.dom.getElementsByClassName('file_list')[0];
		// Reload outputs
		if (this.params.outputs) {
			var html = '';
			for (var filename in this.params.outputs) {
				this.out_files.push(filename)
				html += this.format_output(filename);
			}
			this.out_area.innerHTML = html;
		}

		// Change the output files using the tags file
		var that = this;
		tags_text.onchange = () => {that.generate_R1R2fields(()=>{})};
	}

	create_R1R2_pair (library_name, pair) {
		// Try to infer R1 and R2
		if (!pair) {
			pair = {r1:"", r2:""};

			// Browse all the files to auto assign values
			let fastqs = file_manager.getFiles(['fastq']);
			for (let idx in fastqs) {
				let fastq_name = fastqs[idx];

				// File suspected to correspond
				if (fastq_name.startsWith(library_name)) {

					// Verify presence of R1 or R2 in the name
					if (fastq_name.includes('R1'))
						pair.r1 = fastq_name;
					else if (fastq_name.includes('R2'))
						pair.r2 = fastq_name;
				}
			}
		}

		// Create the divs
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

	generate_R1R2fields (callback) {
		var that = this;
		var libs = [];

		let csv_filename = this.dom.getElementsByClassName('tags')[0].value;
		csv_filename = csv_filename.substr(0, csv_filename.lastIndexOf('.'));
		let out_fwd = csv_filename + '*_fwd.fastq';
		let out_rev = csv_filename + '*_rev.fastq';

		let out_files = [out_fwd, out_rev];

		Papa.parse("/data/" + exec_token + '/' + csv_filename + '.csv', {
			download: true,
			worker: true,
			header: true,
			step: function(row) {
				// Parse each line
				let lib = row.data[0].run;
				let sample = row.data[0].sample;

				if (!lib || lib == "")
					return;

				// Add library
				if (!libs.includes(lib))
					libs.push(lib);

				// Generate filenames
				let out_fwd = csv_filename + '_' + lib + '_' + sample + '_fwd.fastq';
				let out_rev = csv_filename + '_' + lib + '_' + sample + '_rev.fastq';
				out_files.push(out_fwd);
				out_files.push(out_rev);
			},
			complete: function() {
				that.illumina_div.innerHTML = "";
				that.out_area.innerHTML = "";

				for (let idx=0 ; idx<libs.length ; idx++) {
					// Create the fields R1 and R2 for each library
					that.illumina_div.appendChild(that.create_R1R2_pair(libs[idx]));

					// Generate jokers
					let out_fwd = csv_filename + '_' + libs[idx] + '*_fwd.fastq';
					let out_rev = csv_filename + '_' + libs[idx] + '*_rev.fastq';
					out_files.push(out_fwd);
					out_files.push(out_rev);
				}

				// Print outputs
				out_files.sort();
				for (let idx in out_files) {
					let filename = out_files[idx];
					that.out_area.innerHTML += that.format_output(filename);
				}

				// Notify the file adds
				var event = new Event('new_output');
				event.files = out_files;
				document.dispatchEvent(event);

				that.out_files = out_files;
				callback(that.illumina_div);
			},
			error: function(e) {
				console.log("Papaparse error:", e);
			}
		});
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

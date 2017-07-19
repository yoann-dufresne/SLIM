
class OtuVsearchModule extends Module {
	constructor (params) {
		super ("otu-vsearch");

		this.params = params;
	}

	onFileChange (file_manager, event) {
		var filenames = file_manager.getFiles(['fasta']);

		// Save checked
		var checked = {};
		var inputs = this.fasta_div.getElementsByTagName('input');
		for (let id in inputs) {
			let input = inputs[id];

			if (input.checked)
				checked[input.name] = input.name;
		}

		// Reset list
		this.fasta_div.innerHTML = "";

		// Recreate list
		for (let id in filenames) {
			let filename = filenames[id];

			this.fasta_div.innerHTML += '<p><input type="checkbox" name="' +
					filename + '"' + (checked[filename] ? ' checked' : '') +
					'>' + filename + '</p>';
		}

		var that = this;
		var tsv = file_manager.getFiles(['.tsv']);
		var auto_tsv = file_manager.get_autocomplete_format(tsv);
		$(this.origins).autocomplete({
			lookup: auto_tsv,
			onSelect: function(suggestion) {
				that.origins.value = suggestion.data;
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
		var that = this;

		// --- Inputs ---
		this.fasta_div = this.dom.getElementsByClassName('file_list')[0];

		// Reload inputs
		if (this.params.inputs) {
			for (let idx in this.params.inputs) {
				let filename = this.params.inputs[idx];
				this.fasta_div.innerHTML += '<p><input type="checkbox" name="' +
						filename + '" checked>' + filename + '</p>'
			}
		}
		this.onFileChange(file_manager, {});
		
		// --- Outputs ---
		var links = this.dom.getElementsByClassName('download_link');
		var outputs = this.dom.getElementsByClassName('output_filename');
		this.otus = outputs[0];
		this.otus_link = links[0];
		this.out_reads = outputs[1];
		this.out_reads_link = links[1];
		this.centroids = outputs[2];
		this.centroids_link = links[2];

		// Reload outputs
		if (this.params.outputs) {
			this.otus.value = this.params.outputs.otus_table;
			this.out_reads.value = this.params.outputs.out_reads;
			this.centroids.value = this.params.outputs.centroids;
		}
		
		// Update output values
		this.otus_val = this.otus.value;
		this.otus.onchange = () => {
			that.output_onchange ([that.otus_val], [that.otus.value], [that.otus_link]);
			that.otus_val = that.otus.value;
		};
		this.otus.onchange();

		this.out_reads_val = this.out_reads.value;
		this.out_reads.onchange = () => {
			that.output_onchange ([that.out_reads_val], [that.out_reads.value], [that.out_reads_link]);
			that.out_reads_val = that.out_reads.value;
		};
		this.out_reads.onchange();

		this.centroids_val = this.centroids.value;
		this.centroids.onchange = () => {
			that.output_onchange ([that.centroids_val], [that.centroids.value], [that.centroids_link]);
			that.centroids_val = that.centroids.value;
		};
		this.centroids.onchange();


		// --- Parameters ---
		this.similarity = this.dom.getElementsByClassName('similarity')[0];
		this.similarity.onchange = ()=>{that.nanVerification(that.similarity)};
	}

	getConfiguration () {
		var config = super.getConfiguration()
		
		var inputs = this.fasta_div.getElementsByTagName('input');
		for (let id in inputs) {
			let input = inputs[id];

			if (input.checked) {
				let name = input.name.replace('*', '$');
				config.inputs[name] = name;
			}
		}
		
		config.outputs.otus_table = this.otus.value;
		config.outputs.out_reads = this.out_reads.value;
		config.outputs.centroids = this.centroids.value;

		config.params.similarity = this.similarity.value;

		return config;
	}
};


module_manager.moduleCreators['otu-vsearch'] = (params) => {
	return new OtuVsearchModule(params);
};


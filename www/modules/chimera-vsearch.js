
class ChimeraModule extends Module {
	constructor (params) {
		super ("chimera-vsearch");

		this.params = params;
		this.filtered_value = "";
	}

	onFileChange (file_manager, event) {
		var fasta  = file_manager.getFiles(['.fasta']);
		for (var idx=0 ; idx<fasta.length ; idx++)
			fasta[idx] = {value:fasta[idx], data:fasta[idx]};


		/* Change the autocomplete field */
		// Input fastq
		var that = this;
		$(this.input).autocomplete({
			lookup: fasta,
			onSelect: function(suggestion) {
				that.input.value = suggestion.data;
			}
		});
	}

	onLoad () {
		var that = this;

		// Register to the file manager
		file_manager.register_observer(function (man, event) {
			that.onFileChange(man, event);
		});

		var inputs = this.dom.getElementsByTagName('input');
		var links = this.dom.getElementsByTagName('a');

		/// --- Inputs ---

		// Save inputs
		this.input = inputs[0];
		this.filtered = inputs[1];

		// Add suffix to output
		this.input.onchange = () => {
			var idx = that.input.value.indexOf('.fasta');
			var sub = that.input.value.substring(0, idx);

			that.filtered.value = sub + '_nonchimera.fasta';
			that.filtered.onchange();
		}

		// Reload inputs
		if (this.params.inputs) {
			this.input.value = this.params.inputs.input;
		}


		// --- outputs ----

		this.download_nonchimera = links[0];

		this.filtered_value = this.filtered.value;
		this.filtered.onchange = () => {
			// Remove previous output from global files
			var event = new Event('rmv_output');
			event.files = [that.filtered_value];
			document.dispatchEvent(event);

			// Add new output in global files
			var event = new Event('add_output');
			event.files = [that.filtered.value];
			document.dispatchEvent(event);
			that.filtered_value = that.filtered.value;

			// change download link
			that.download_nonchimera.href = '/data/' + exec_token + '/' + that.filtered_value;
		};
		this.filtered.onchange();

		// Reload outputs
		if (this.params.outputs) {
			this.filtered = this.params.outputs.nonchimeras;
		}

		// Load suggestions in the inputs
		this.onFileChange(file_manager, {});
	}

	getConfiguration () {
		var config = super.getConfiguration()
		
		config.inputs.input = this.input.value;
		config.outputs.nonchimeras = this.filtered.value;
		
		return config;
	}
};

module_manager.moduleCreators['chimera-vsearch'] = (params) => {
	return new ChimeraModule(params);
};


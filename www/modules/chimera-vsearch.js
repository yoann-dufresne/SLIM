
class ChimeraModule extends Module {
	constructor (params) {
		super ("chimera-vsearch");

		this.params = params;
		this.filtered_value = "";
		this.chimeras_value = "";
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
		this.chimeras_link = this.dom.getElementsByClassName('chimeras_link')[0];

		/// --- Inputs ---

		// Save inputs
		this.input = inputs[0];
		this.filtered = inputs[1];
		this.chimeras = inputs[2];

		// Add suffix to output
		this.input.onchange = () => {
			var idx = that.input.value.indexOf('.fasta');
			var sub = that.input.value.substring(0, idx);

			that.filtered.value = sub + '_nonchimeras.fasta';
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
			var event2 = new Event('new_output');
			event2.files = [that.filtered.value];
			document.dispatchEvent(event2);
			that.filtered_value = that.filtered.value;

			// change download link
			that.download_nonchimera.href = file_manager.get_download_link(that.filtered_value);
		};

		// Reload outputs
		if (this.params.outputs) {
			this.filtered.value = this.params.outputs.nonchimeras;
		}
		this.filtered.onchange();

		// --- options ---
		this.chimeras.onchange = () => {
			if (that.chimeras_value != "") {
				// Remove previous output from global files
				var event = new Event('rmv_output');
				event.files = [that.chimeras_value];
				document.dispatchEvent(event);
			}

			// Change the value
			that.chimeras_value = that.chimeras.value;

			if (that.chimeras_value != "") {
				// Add new output in global files
				var event = new Event('add_output');
				event.files = [that.chimeras_value];
				document.dispatchEvent(event);

				that.chimeras_link.innerHTML = '<a href="' +
					file_manager.get_download_link(that.chimeras_value) +
					'"><img src="/imgs/download.png" class="download"></a>';
			} else {
				that.chimeras_link.innerHTML = "";
			}
		}

		if (this.params.outputs && this.params.outputs.chimeras) {
			this.chimeras.value = this.params.outputs.chimeras;
			this.chimeras.onchange();
		}

		// Load suggestions in the inputs
		this.onFileChange(file_manager, {});
	}

	getConfiguration () {
		var config = super.getConfiguration()
		
		config.inputs.input = this.input.value;
		config.outputs.nonchimeras = this.filtered.value;

		if (this.chimeras_value != "")
			config.outputs.chimeras = this.chimeras_value;
		
		return config;
	}
};

module_manager.moduleCreators['chimera-vsearch'] = (params) => {
	return new ChimeraModule(params);
};


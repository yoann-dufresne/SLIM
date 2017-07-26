
class DereplicationModule extends Module {
	constructor (params) {
		super ("fasta-dereplication");

		this.params = params;
	}

	onFileChange (file_manager, event) {
		var fasta = file_manager.getFiles(['.fasta']);
		for (var idx=0 ; idx<fasta.length ; idx++)
			fasta[idx] = {value:fasta[idx], data:fasta[idx]};

		/* Change the autocomplete field */
		var that = this;
		$(this.fasta).autocomplete({
			lookup: fasta,
			onSelect: function(suggestion) {
				that.fasta.value = suggestion.data;
				that.fasta.onchange();
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
		this.fasta = this.dom.getElementsByClassName('file_selector')[0];

		this.fasta.onchange = () => {
			that.derep.value = that.fasta.value.substr(0, that.fasta.value.lastIndexOf('.')) + '_derep.fasta';
			that.derep.onchange();
		};

		// Reload inputs
		if (this.params.inputs) {
			this.fasta.value = this.params.inputs.fasta;
		}
		
		// --- Outputs ---
		this.derep = this.dom.getElementsByClassName('output_filename')[0];
		this.down_link = this.dom.getElementsByClassName('download_link')[0];

		// Reload outputs
		if (this.params.outputs) {
			this.derep.value = this.params.outputs.derep;
		}
		this.derep.onchange = function () {
			that.output_onchange ([that.derep_val], [that.derep.value], [that.down_link]);
			that.derep_val = that.derep.value;
		}
		this.derep.onchange();

		var filenames = file_manager.getFiles();
		this.onFileChange(file_manager, {files:filenames});
	}

	getConfiguration () {
		var config = super.getConfiguration()
		
		config.inputs.fasta = this.fasta.value;
		
		config.outputs.derep = this.derep.value;
		
		return config;
	}
};


module_manager.moduleCreators['fasta-dereplication'] = (params) => {
	return new DereplicationModule(params);
};



class OtuVsearchModule extends Module {
	constructor (params) {
		super ("otu-vsearch");

		this.params = params;
	}

	onFileChange (file_manager, event) {
		var that = this;
		var fasta = file_manager.getFiles(['.fasta']);
		var auto = file_manager.get_autocomplete_format(fasta);

		$(this.fasta).autocomplete({
			lookup: auto,
			onSelect: function(suggestion) {
				that.fasta.value = suggestion.data;
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
		var inputs = this.dom.getElementsByTagName('input');
		this.fasta = inputs[0];
		// Reload inputs
		if (this.params.inputs) {
			this.fasta.value = this.params.inputs.fasta;
		}
		this.onFileChange(file_manager, {});
		// Create output regarding input
		this.fasta.onchange = () => {
			let value = that.fasta.value;
			value = value.substr(0, value.indexOf('.tsv'));
			that.otus.value = value + '.tsv';
			that.otus.onchange();
		}
		
		// --- Outputs ---
		this.otus = inputs[1];
		this.otus_link = this.dom.getElementsByClassName('download_link')[0];

		// Reload outputs
		if (this.params.outputs) {
			this.otus.value = this.params.outputs.otus;
		}
		
		// Update output values
		this.otus_val = this.otus.value;
		this.otus.onchange = () => {
			that.output_onchange (
				[that.otus_val],
				[that.otus.value],
				[that.otus_link]
			);
			that.otus_val = that.otus.value;
		};
		this.otus.onchange();


		// --- Parameters ---
		this.similarity = this.dom.getElementsByClassName('similarity')[0];
		this.similarity.onchange = ()=>{that.nanVerification(that.threshold)};
	}

	getConfiguration () {
		var config = super.getConfiguration()
		
		config.inputs.fasta = this.fasta.value;
		
		config.outputs.otus_table = this.otus.value;

		config.params.similarity = this.similarity.value;

		return config;
	}
};


module_manager.moduleCreators['otu-vsearch'] = (params) => {
	return new OtuVsearchModule(params);
};



class OtuVsearchModule extends Module {
	constructor (params) {
		super ("otu-vsearch");

		this.params = params;
	}

	onFileChange (file_manager, event) {
		var that = this;

		var fasta = file_manager.getFiles(['.fasta']);
		var auto_fasta = file_manager.get_autocomplete_format(fasta);
		$(this.fasta).autocomplete({
			lookup: auto_fasta,
			onSelect: function(suggestion) {
				that.fasta.value = suggestion.data;
				that.fasta.onchange();
			}
		});

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
		var inputs = this.dom.getElementsByTagName('input');
		this.fasta = inputs[0];
		this.origins = inputs[1];

		// Reload inputs
		if (this.params.inputs) {
			this.fasta.value = this.params.inputs.fasta;
			this.origins.value = this.params.inputs.origins;
		}
		this.onFileChange(file_manager, {});
		// Create output regarding input
		this.fasta.onchange = () => {
			let value = that.fasta.value;
			value = value.substr(0, value.indexOf('.fasta'));
			that.otus.value = value + '_otus.tsv';
			that.out_reads.value = value + '_clustered.fasta';
			
			that.otus.onchange();
			that.out_reads.onchange();
		}
		
		// --- Outputs ---
		var links = this.dom.getElementsByClassName('download_link');

		this.otus = inputs[2];
		this.otus_link = links[0];
		this.out_reads = inputs[3];
		this.out_reads_link = links[1];

		// Reload outputs
		if (this.params.outputs) {
			this.otus.value = this.params.outputs.otus_table;
			this.out_reads.value = this.params.outputs.out_reads;
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


		// --- Parameters ---
		this.similarity = this.dom.getElementsByClassName('similarity')[0];
		this.similarity.onchange = ()=>{that.nanVerification(that.similarity)};
	}

	getConfiguration () {
		var config = super.getConfiguration()
		
		config.inputs.origins = this.origins.value;
		config.inputs.fasta = this.fasta.value;
		
		config.outputs.otus_table = this.otus.value;
		config.outputs.out_reads = this.out_reads.value;

		config.params.similarity = this.similarity.value;

		return config;
	}
};


module_manager.moduleCreators['otu-vsearch'] = (params) => {
	return new OtuVsearchModule(params);
};


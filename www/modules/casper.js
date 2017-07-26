
class CasperModule extends Module {
	constructor (params) {
		super ("casper");

		this.params = params;
	}

	onFileChange (file_manager, event) {
		var that = this;
		var fastq = file_manager.getFiles(['.fastq']);
		var auto = [];
		for (var idx=0 ; idx<fastq.length ; idx++) {
			var filename = fastq[idx];
			auto.push({value:filename, data:filename});
		}

		$(this.fwd).autocomplete({
			lookup: auto,
			onSelect: function(suggestion) {
				that.fwd.value = suggestion.data;
				that.fwd.onchange();
			}
		});

		$(this.rev).autocomplete({
			lookup: auto,
			onSelect: function(suggestion) {
				that.rev.value = suggestion.data;
				that.rev.onchange();
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
		var inputs = this.dom.getElementsByClassName('file_selector');
		this.fwd = inputs[0];
		this.rev = inputs[1];

		this.fwd.onchange = () => {that.input_change()};
		this.rev.onchange = () => {that.input_change()};

		// Reload inputs
		if (this.params.inputs) {
			this.fwd.value = this.params.inputs.fwd;
			this.rev.value = this.params.inputs.rev;
		}
		
		// --- Outputs ---
		this.output_file = this.dom.getElementsByClassName('output_filename')[0];
		this.down_link = this.dom.getElementsByClassName('download_link')[0];

		// Reload outputs
		if (this.params.outputs) {
			this.output_file.value = this.params.outputs.assembly;
		}
		this.output_file.onchange = function () {
			that.output_onchange ([that.out_val], [that.output_file.value], [that.down_link]);
			that.out_val = that.output_file.value;
		}
		this.output_file.onchange();

		// --- Parameters ---
		this.kmer = this.dom.getElementsByClassName('kmer')[0];
		this.quality = this.dom.getElementsByClassName('quality')[0];
		this.mismatch = this.dom.getElementsByClassName('mismatch')[0];
		this.min_length = this.dom.getElementsByClassName('minLength')[0];

		if (this.params.params) {
			this.kmer.value = this.params.params.kmer;
			this.quality.value = this.params.params.quality;
			this.mismatch.value = this.params.params.mismatch;
			this.min_length.value = this.params.params.min_length;
		}

		this.kmer.onchange = ()=>{that.nanVerification(that.kmer)};
		this.quality.onchange = ()=>{nanVerification(that.quality)};
		this.mismatch.onchange = ()=>{nanVerification(that.mismatch)};
		this.min_length.onchange = ()=>{nanVerification(that.min_length)};

		var filenames = file_manager.getFiles();
		this.onFileChange(file_manager, {files:filenames});
	}

	input_change () {
		// If the names are standards
		if (this.fwd.value.includes('_fwd.fastq') && this.rev.value.includes('_rev.fastq')) {
			// Get the main name
			var i1 = this.fwd.value.indexOf('_fwd.fastq');
			var sub1 = this.fwd.value.substring(0, i1);
			var i2 = this.rev.value.indexOf('_rev.fastq');
			var sub2 = this.rev.value.substring(0, i2);

			if (sub2 == sub1) {
				this.output_file.value = sub1 + '_casper.fastaq';
				this.output_file.onchange();
			}
		}
	}

	getConfiguration () {
		var config = super.getConfiguration()
		
		config.inputs.fwd = this.fwd.value;
		config.inputs.rev = this.rev.value;
		
		config.outputs.assembly = this.output_file.value;

		config.params.kmer = this.kmer.value;
		config.params.quality = this.quality.value;
		config.params.mismatch = this.mismatch.value;
		config.params.min_length = this.min_length.value;
		
		return config;
	}
};


module_manager.moduleCreators.casper = (params) => {
	return new CasperModule(params);
};


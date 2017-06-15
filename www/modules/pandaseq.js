
class PandaseqModule extends Module {
	constructor (params) {
		super ("pandaseq");

		this.params = params;
	}

	onFileChange (file_manager, event) {
		var that = this;
		var fastq = file_manager.getFiles(['.fastq', '.fastq.gz', '.fastq.bz2']);
		var auto = [];
		for (var idx=0 ; idx<fastq.length ; idx++) {
			var filename = fastq[idx];
			auto.push({value:filename, data:filename});
		}

		$(this.fwd).autocomplete({
			lookup: auto,
			onSelect: function(suggestion) {
				that.fwd.value = suggestion.data;
			}
		});

		$(this.rev).autocomplete({
			lookup: auto,
			onSelect: function(suggestion) {
				that.rev.value = suggestion.data;
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
		this.fwd = inputs[0];
		this.rev = inputs[1];

		this.fwd.onchange = () => {that.input_change()};
		this.rev.onchange = () => {that.input_change()};

		// Reload inputs
		if (this.params.inputs) {
			this.fwd.value = this.params.inputs.fwd;
			this.rev.value = this.params.inputs.rev;
		}

		var filenames = file_manager.getFiles();
		this.onFileChange(file_manager, {files:filenames});
		
		// --- Outputs ---
		this.output_file = inputs[2];
		this.down_link = this.dom.getElementsByClassName('download_link')[0];

		// Reload outputs
		if (this.params.outputs) {
			this.output_file.value = this.params.outputs.assembly;
		}
		
		this.out_val = this.output_file.value;
		this.down_link.href = '/data/' + exec_token + '/' + this.out_val;

		this.output_file.onchange = function () {
			// Send a remove event for the precedent output value
			var event = new Event('rmv_output');
			event.files = [that.out_val];
			document.dispatchEvent(event);

			// Update the output value
			that.out_val = that.output_file.value;
			that.down_link.href = '/data/' + exec_token + '/' + that.out_val
				+ (that.out_val.includes('*') ? '.tar.gz' : '');
			event = new Event('new_output');
			event.files = [that.out_val];
			document.dispatchEvent(event);
		}
		this.output_file.onchange();

		// --- Parameters ---
		var options_div = this.dom.getElementsByClassName('options')[0];
		var inputs = options_div.getElementsByTagName('input');

		var nanVerification = (elem) => {
			if (isNaN(elem.value)) {
				elem.value = 0;
			}
		};

		this.threshold = inputs[0];
		this.threshold.onchange = ()=>{nanVerification(that.threshold)};
		this.min_length = inputs[1];
		this.min_length.onchange = ()=>{nanVerification(that.min_length)};
		this.max_length = inputs[2];
		this.max_length.onchange = ()=>{nanVerification(that.max_length)};
		this.min_overlap = inputs[3];
		this.min_overlap.onchange = ()=>{nanVerification(that.min_overlap)};
		this.max_overlap = inputs[4];
		this.max_overlap.onchange = ()=>{nanVerification(that.max_overlap)};
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
				this.output_file.value = sub1 + '_panda.fasta';
				this.output_file.onchange();
			}
		}
	}

	getConfiguration () {
		var config = super.getConfiguration()
		
		config.inputs.fwd = this.fwd.value;
		config.inputs.rev = this.rev.value;
		
		config.outputs.assembly = this.output_file.value;

		config.params.threshold = this.threshold.value;
		config.params.min_length = this.min_length.value;
		config.params.max_length = this.max_length.value;
		config.params.min_overlap = this.min_overlap.value;
		config.params.max_overlap = this.max_overlap.value;
		
		return config;
	}
};


module_manager.moduleCreators.pandaseq = (params) => {
	return new PandaseqModule(params);
};


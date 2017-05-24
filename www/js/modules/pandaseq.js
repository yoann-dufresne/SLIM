
class PandaseqModule extends Module {
	constructor () {
		super ("pandaseq");
	}

	onFileChange (file_manager, event) {
		var that = this;
		var files = file_manager.getFiles(['.fastq', '.fastq.gz', '.fastq.bz2']);
		var auto = [];
		for (var idx=0 ; idx<files.length ; idx++) {
			var filename = files[idx];
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
		var inputs = this.dom.getElementsByTagName('input');
		this.fwd = inputs[0];
		this.rev = inputs[1];

		var filenames = file_manager.getFiles();
		this.onFileChange(file_manager, {files:filenames});
		
		var that = this;
		this.output_file = this.dom.getElementsByTagName('input')[2];
		this.out_val = this.output_file.value;
		this.down_link = this.dom.getElementsByClassName('download_link')[0];
		this.down_link.href = '/data/' + exec_token + '/' + this.out_val;


		this.output_file.onchange = function () {
			// Send a remove event for the precedent output value
			var event = new Event('rmv_output');
			event.files = [that.out_val];
			document.dispatchEvent(event);

			// Update the output value
			that.out_val = that.output_file.value;
			that.down_link.href = '/data/' + exec_token + '/' + that.out_val;
			event = new Event('new_output');
			event.files = [that.out_val];
			document.dispatchEvent(event);
		}
		this.output_file.onchange();
	}

	getConfiguration () {
		var config = super.getConfiguration()
		
		config.inputs.fwd = this.fwd.value;
		config.inputs.rev = this.rev.value;
		
		config.outputs.assembly = this.output_file.value;
		
		return config;
	}
};



class PandaseqModule extends Module {
	constructor () {
		super ("demultiplexer");
	}

	onFileAdd (file_manager, event) {
		var files = event.files;
		for (var idx in files) {
			var filename = files[idx];

			if (filename.endsWith('.fastq')
					|| filename.endsWith('.fastq.gz')
					|| filename.endsWith('.fastq.bz2')) {

				// TODO
			}
		}
	}

	onFileRmv (file_manager, event) {
		// TODO
	}

	onLoad () {
		var that = this;

		// Register to the file manager
		// file_manager.register_add_observer(function (man, event) {
		// 	that.onFileAdd(man, event);
		// });
		// file_manager.register_rmv_observer(function (man, event) {
		// 	that.onFileRmv(man, event);
		// });

		// Define things
		this.defineIO();
	}

	defineIO () {
		// var selects = this.dom.getElementsByTagName('select');
		// this.fwd = selects[0];
		// this.rev = selects[1];

		// var filenames = file_manager.getFiles();
		// this.onFileAdd(file_manager, {files:filenames});
		
		// var that = this;
		// this.output_file = this.dom.getElementsByTagName('input')[0];
		// this.out_val = this.output_file.value;
		// this.down_link = this.dom.getElementsByClassName('download_link')[0];
		// this.down_link.href = '/data/' + exec_token + '/' + this.out_val;


		// this.output_file.onchange = function () {
		// 	// Send a remove event for the precedent output value
		// 	var event = new Event('rmv_output');
		// 	event.files = [that.out_val];
		// 	document.dispatchEvent(event);

		// 	// Update the output value
		// 	that.out_val = that.output_file.value;
		// 	that.down_link.href = '/data/' + exec_token + '/' + that.out_val;
		// 	event = new Event('new_output');
		// 	event.files = [that.out_val];
		// 	document.dispatchEvent(event);
		// }
		// this.output_file.onchange();
	}

	getConfiguration () {
		var config = super.getConfiguration()
		
		// config.inputs.fwd = this.fwd.value;
		// config.inputs.rev = this.rev.value;
		
		// config.outputs.assembly = this.output_file.value;
		
		return config;
	}
};
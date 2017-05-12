
class PandaseqModule extends Module {
	constructor () {
		super ("pandaseq");

		// set up listener on file creation
		var that = this;
		new_file_listeners.push(function(event) {that.newFileListener(event)});
	}

	newFileListener (event) {
		for (var idx in event.files) {
			var filename = event.files[idx];
			if (filename.endsWith('.fastq')
					|| filename.endsWith('.fastq.gz')
					|| filename.endsWith('.fastq.bz2')) {

				var opt = document.createElement('option');
				opt.value = filename; opt.innerHTML = filename;
				
				this.fwd.appendChild(opt);
				this.rev.appendChild(opt.cloneNode(true));
			}
		}
	}

	onLoad () {
		this.defineIO();

		var that = this;
		// Init files from uploads
		$.get('/list?token=' + exec_token, function (data) {
			that.newFileListener({files: data, type: 'uploaded'});
		});

		// Init files from modules
		this.newFileListener({files: generated_files, type: 'generated'});
	}

	defineIO () {
		var selects = this.dom.getElementsByTagName('select');
		this.fwd = selects[0];
		this.rev = selects[1];
		
		var that = this;
		this.output_file = this.dom.getElementsByTagName('input')[0];

		this.output_file.onchange = function () {
			raiseNewFilesEvent([that.output_file.value], 'generated');
		}
	}

	getConfiguration () {
		var config = {};
		var inputs = {};
		inputs.fwd = this.fwd.value;
		inputs.rev = this.rev.value;
		var outputs = {};
		outputs.assmbly = this.output_file.value;
		var params = {};

		config.params = params;
		config.inputs = inputs;
		config.output = outputs;
		
		return config;
	}
};


var panda_out_changed = function (elem) {
	console.log(elem);
	raiseNewFilesEvent('TODO', 'generated');
}


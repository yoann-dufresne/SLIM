
class PandaseqModule extends Module {
	constructor () {
		super ("pandaseq");

		// set up listener on file creation
		var that = this;
		new_file_listeners.push(function(event) {that.newFileListener(event)});

		// init files
		$.get('/list', function (data) {
			var event = {};
			event.files = data;
			that.newFileListener(event);
		});
	}

	newFileListener (event) {
		if (this.fwd == undefined)
			this.defineFwdRev();

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

	defineFwdRev () {
		var selects = this.dom.getElementsByTagName('select');
		this.fwd = selects[0];
		this.rev = selects[1];
		this.output_file = this.dom.getElementsByTagName('input')[0];
	}

	getConfiguration () {
		
		return {};
	}
};
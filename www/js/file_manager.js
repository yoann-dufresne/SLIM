
class FileManager {
	constructor () {
		this.server_files = {};
		this.futur_files = {};

		this.addObs = [];
		this.rmvObs = [];

		this.eventListeners();

		this.timeout_add = null;
		this.timeout_rmv = null;
	}

	load_from_server (callback) {
		var that = this;
		$.get('/list?token=' + exec_token, (data) => {
			// Get all the server files
			var event = new Event('new_file');
			event.files = data;
			document.dispatchEvent(event);
		});
	}

	get_download_link (filename) {
		var link = '/data/' + exec_token + '/' + filename;
		if (filename.includes('*'))
			link += '.tar.gz';

		return link;
	}

	get_autocomplete_format (files) {
		var formated = [];

		for (var idx in files) {
			var filename = files[idx];
			formated.push({value:filename, data:filename});
		}

		return formated;
	}

	getFiles (extentions = []) {
		if (extentions.length == 0)
			extentions = [... new Set(Object.keys(this.server_files).concat(Object.keys(this.futur_files)))];

		// Construct the file object
		var files = [];
		for (var idx in extentions) {
			if (this.server_files[extentions[idx]] != undefined)
				files = files.concat(this.server_files[extentions[idx]]);
			if (this.futur_files[extentions[idx]] != undefined)
				files = files.concat(this.futur_files[extentions[idx]]);
		}

		return files;
	}

	register_observer (callback) {
		this.addObs.push(callback);
		this.rmvObs.push(callback);
	}

	register_add_observer (callback) {
		this.addObs.push(callback);
	}

	register_rmv_observer (callback) {
		this.rmvObs.push(callback);
	}

	effective_add_notification () {
		let event = new Event('new_file');
		event.files = Array.from(new Set(this.new_files));

		for (let idx in this.addObs) {
			let callback = this.addObs[idx];
			callback(this, event);
		}
	}

	notifyAdd (params) {
		var that = this;

		if (this.timeout_add == null) {
			this.new_files = [];

			this.timeout_add = setTimeout(function() {
				that.effective_add_notification();
				that.timeout_add = null;
			}, 10);
		} else {
			clearTimeout(this.timeout_add);
			this.timeout_add = setTimeout(function() {
				that.effective_add_notification();
				that.timeout_add = null;
			}, 10);
		}
		this.new_files = this.new_files.concat(params.files);
	}

	effective_rmv_notification () {
		let event = new Event('rmv_file');
		event.files = Array.from(new Set(this.rmv_files));

		for (let idx in this.rmvObs) {
			let callback = this.rmvObs[idx];
			callback(this, event);
		}
	}

	notifyRmv (params) {
		var that = this;

		if (this.timeout_rmv == null) {
			this.rmv_files = [];

			this.timeout_rmv = setTimeout(function() {
				that.effective_rmv_notification();
				that.timeout_rmv = null;
			}, 10);
		} else {
			clearTimeout(this.timeout_rmv);
			this.timeout_rmv = setTimeout(function() {
				that.effective_rmv_notification();
				that.timeout_rmv = null;
			}, 10);
		}
		this.rmv_files = this.rmv_files.concat(params.files);
	}

	eventListeners () {
		var that = this;

		// When a file is uploaded
		document.addEventListener('new_file', (event) => {
			for (var idx in event.files) {
				var filename = event.files[idx];
				var extention = filename.substr(filename.lastIndexOf('.')+1);

				// Create new array if doesn't exist
				if (that.server_files[extention] == undefined)
					that.server_files[extention] = [];

				if (that.server_files[extention].indexOf(filename) == -1)
					that.server_files[extention].push(filename);
			}
			that.notifyAdd(event);
		});

		// When a file is deleted
		document.addEventListener('rmv_file', (event) => {
			for (var idx in event.files) {
				var filename = event.files[idx];
				var extention = filename.substr(filename.lastIndexOf('.')+1);

				if (that.futur_files[extention] != undefined) {
					var file_idx = that.server_files[extention].indexOf(filename);
					if (file_idx != -1)
						that.server_files[extention].splice(file_idx, 1);
				}
			}
			that.notifyRmv(event);
		});

		// When an output is defined
		document.addEventListener('new_output', (event) => {
			for (var idx in event.files) {
				var filename = event.files[idx];
				var extention = filename.substr(filename.lastIndexOf('.')+1);

				// Create new array if doesn't exist
				if (that.futur_files[extention] == undefined)
					that.futur_files[extention] = [];

				if (that.futur_files[extention].indexOf(filename) == -1)
					that.futur_files[extention].push(filename);
			}
			that.notifyAdd(event);
		});

		// When a file is undefined
		document.addEventListener('rmv_output', (event) => {
			for (var idx in event.files) {
				var filename = event.files[idx];
				var extention = filename.substr(filename.lastIndexOf('.')+1);

				if (that.futur_files[extention] != undefined) {
					var file_idx = that.futur_files[extention].indexOf(filename);
					if (file_idx != -1)
						that.futur_files[extention].splice(file_idx, 1);
				}
			}
			that.notifyRmv(event);
		});
	}
}

var file_manager = new FileManager ();

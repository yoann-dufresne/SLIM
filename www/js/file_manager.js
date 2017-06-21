
class FileManager {
	constructor () {
		this.server_files = [];
		this.futur_files = [];

		this.addObs = [];
		this.rmvObs = [];

		this.eventListeners();

		this.contents = {};
	}

	load_from_server () {
		var that = this;
		$.get('/list?token=' + exec_token, (data) => {
			// Get all the server files
			var event = new Event('new_file');
			event.files = data;
			document.dispatchEvent(event);

			// Load the content of CSV files
			for (var idx=0 ; idx<data.length ; idx++) {
				var filename = data[idx];

				if (!filename.endsWith('.csv'))
					continue;

				$.get('/data/' + exec_token + '/' + filename, (data) => {
					that.contents[filename] = Papa.parse(data, {header: true});
				});
			}
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

	filterFiles (filenames, extentions) {
		var filtered = [];

		for (var eIdx in extentions) {
			var ext = extentions[eIdx];
			for (var idx in filenames) {
				var filename = filenames[idx];
				if (filename.endsWith(ext))
					filtered.push(filename);
			}
		}

		return filtered;
	}

	getFiles (extentions = []) {
		var files = this.server_files.concat(this.futur_files);

		if (extentions.length == 0)
			return files;

		files = this.filterFiles (files, extentions);
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

	notifyAdd (params) {
		for (var idx in this.addObs) {
			var callback = this.addObs[idx];
			callback(this, params);
		}
	}

	notifyRmv (params) {
		for (var idx in this.rmvObs) {
			var callback = this.rmvObs[idx];
			callback(this, params);
		}
	}

	eventListeners () {
		var that = this;

		// When a file is uploaded
		document.addEventListener('new_file', (event) => {
			for (var idx in event.files) {
				var filename = event.files[idx];
				if (that.server_files.indexOf(filename) == -1)
					that.server_files.push(filename);
			}
			that.notifyAdd(event);
		});

		// When a file is deleted
		document.addEventListener('rmv_file', (event) => {
			for (var idx in event.files) {
				var filename = event.files[idx];
				var file_idx = that.server_files.indexOf(filename);
				if (file_idx != -1)
					that.server_files.splice(file_idx, 1);
			}
			that.notifyRmv(event);
		});

		// When an output is defined
		document.addEventListener('new_output', (event) => {
			for (var idx in event.files) {
				var filename = event.files[idx];
				if (that.futur_files.indexOf(filename) == -1)
					that.futur_files.push(filename);
			}
			that.notifyAdd(event);
		});

		// When a file is undefined
		document.addEventListener('rmv_output', (event) => {
			for (var idx in event.files) {
				var filename = event.files[idx];
				var file_idx = that.futur_files.indexOf(filename);
				if (file_idx != -1)
					that.futur_files.splice(file_idx, 1);
			}
			that.notifyRmv(event);
		});
	}
}

var file_manager = new FileManager ();

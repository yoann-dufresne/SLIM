
class FileManager {
	constructor () {
		this.server_files = [];
		this.futur_files = [];

		this.addObs = [];
		this.rmvObs = [];

		this.eventListeners();

		this.contents = {};
	}

	getFiles () {
		return this.server_files.concat(this.futur_files).sort();
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
					that.server_files.splice(file_idx);
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
					that.futur_files.splice(file_idx);
			}
			that.notifyRmv(event);
		});
	}
}

var file_manager = new FileManager ();

var tmp = {
	onFileChange: function(file_manager, event) {
		var filenames = file_manager.getFiles(['fasta']);

		// Save checked
		var checked = {};
		var inputs = this.div_selection.getElementsByTagName('input');
		for (var id in inputs) {
			input = inputs[id];

			if (input.checked)
				checked[input.name] = input.name;
		}

		// Reset list
		this.div_selection.innerHTML = "";

		// Recreate list
		for (var id in filenames) {
			var filename = filenames[id];

			this.div_selection.innerHTML += '<p><input type="checkbox" name="' +
					filename + '"' + (checked[filename] ? ' checked' : '') +
					'>' + filename + '</p>';
		}
	},

	onLoad: function(dom, params) {
		this.div_selection = dom.getElementsByClassName('file_list')[0];
		this.merged = dom.getElementsByClassName('merged')[0];
		this.download_link = dom.getElementsByTagName('a')[0];

		// Reload
		if (params.inputs) {
			for (var id in params.inputs) {
				var filename = params.inputs[id].replace('$','*');
				this.div_selection.innerHTML += '<p><input type="checkbox" name="' +
						filename + '" checked>' + filename + '</p>'
			}
		}
		if (params.outputs) {
			this.merged.value = params.outputs.merged;
		}

		// On clics
		var that = this;
		this.merged.onchange = () => {
			that.download_link.href = file_manager.get_download_link(that.merged.value);
		};
		this.merged.onchange();
	},

	getConfiguration: function(config) {
		var inputs = this.div_selection.getElementsByTagName('input');
		for (var id in inputs) {
			input = inputs[id];

			if (input.checked) {
				var name = input.name.replace('*', '$');
				config.inputs[name] = name;
			}
		}

		config.outputs.merged = this.merged.value;

		return config;
	}
};


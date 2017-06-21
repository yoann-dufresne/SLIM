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
		this.merged_link = dom.getElementsByTagName('a')[0];
		this.origins = dom.getElementsByClassName('origins')[0];
		this.origins_link = dom.getElementsByTagName('a')[1];

		// --- Inpuuts ---
		if (params.inputs) {
			for (var id in params.inputs) {
				var filename = params.inputs[id].replace('$','*');
				this.div_selection.innerHTML += '<p><input type="checkbox" name="' +
						filename + '" checked>' + filename + '</p>'
			}
		}

		// --- Outputs ---
		if (params.outputs) {
			this.merged.value = params.outputs.merged;
			this.origins.value = params.outputs.origins;
		}
		this.merged_value = this.merged.value;
		this.origins_value = this.origins.value;

		// On clicks
		var that = this;
		var mod = new Module(null);
		this.merged.onchange = () => {
			mod.output_onchange(
				[that.merged_value], [that.merged.value], [that.merged_link]);
			that.merged_value = that.merged.value;
		};
		this.merged.onchange();

		this.origins.onchange = () => {
			mod.output_onchange(
				[that.origins_value], [that.origins.value], [that.origins_link]);
			that.origins_value = that.origins.value;
		};
		this.origins.onchange();
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
		config.outputs.origins = this.origins.value;

		return config;
	}
};


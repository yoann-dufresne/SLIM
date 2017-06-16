var tmp = {
	onFileChange: (file_manager, event) => {
		var filenames = file_manager.getFiles(['fasta']);
		for (var id in filenames) {
			var filename = filenames[id];

			this.div_selection += '<p><input type="checkbox" name="' + filename
					+ '">' + filename '</p>';
		}
	},

	onLoad: (dom) => {
		this.selectedFiles = [];
		this.div_selection = dom.getElementsByClassName('file_selection')[0];
		this.merged = dom.getElementsByClassName('merged')[0];
		this.download_link = dom.getElementsByTagName('a')[0];

		var that = this;
		this.merged.onchange = () => {
			that.download_link.href = file_manager.get_download_link(that.merged.value);
		}
	},

	getConfiguration: (config) => {
		var inputs = this.div_selection.getElementsByTagName('input');
		for (var id in inputs) {
			input = inputs[id];

			if (input.checked)
				config.inputs[input.name] = input.name;
		}

		config.outputs.merged = this.merged.value;

		return config;
	}
}


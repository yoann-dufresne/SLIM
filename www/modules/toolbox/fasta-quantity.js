var tmp = {
	onFileChange: function(file_manager, event) {
		var filenames = file_manager.getFiles(['fasta']);
		var formated_filenames = file_manager.get_autocomplete_format(filenames);

		var that = this;
		$(this.to_filter).autocomplete({
			lookup: formated_filenames,
			onSelect: function(suggestion) {
				// Include the new value
				that.to_filter.value = suggestion.data;
				
				// Trigger changes on outputs
				that.filtered.onchange();
			}
		});
	},

	onLoad: function(dom, params) {
		this.to_filter = dom.getElementsByClassName('to_filter')[0];
		this.threshold = dom.getElementsByClassName('threshold')[0];
		this.filtered = dom.getElementsByClassName('filtered')[0];
		this.filtered_link = dom.getElementsByClassName('filtered_link')[0];

		// --- Inputs ---
		if (params.inputs) {
			this.to_filter.value = params.inputs.to_filter;
			this.threshold.value = params.params.threshold
		}

		// --- Outputs ---
		if (params.outputs) {
			this.filtered.value = params.outputs.filtered;
		}
		this.filtered_value = this.filtered.value;

		// On clicks
		var that = this;

		this.threshold.onchange = () => {
			that.filtered.onchange();
		};

		var mod = new Module(null);
		this.filtered.onchange = () => {
			// Change the output name
			var name = that.to_filter.value.length >= 6 ? that.to_filter.value : '.fasta';
			name = name.substr(0, name.length-6);
			that.filtered.value = name + '_filtered-' + that.threshold.value + '.fasta';
			// Change links and values
			mod.output_onchange(
				[that.filtered_value], [that.filtered.value], [that.filtered_link]);
			that.filtered_value = that.filtered.value;
		};
		this.filtered.onchange();

		this.onFileChange(file_manager, null);
	},

	getConfiguration: function(config) {
		config.inputs.to_filter = this.to_filter.value;
		config.params.threshold = this.threshold.value;

		config.outputs.filtered = this.filtered.value;

		return config;
	}
};


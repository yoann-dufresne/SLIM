
class OtuVsearchModule extends Module {
	constructor (params) {
		super ("otu-vsearch");

		this.params = params;
	}

	onFileChange (file_manager, event) {
		var that = this;
		var csv = file_manager.getFiles(['csv']);
		var auto_csv = file_manager.get_autocomplete_format(csv);
		$(this.t2s).autocomplete({
			lookup: auto_csv,
			onSelect: function(suggestion) {
				that.t2s.value = suggestion.data;
			}
		});
	}

	onLoad () {
		super.onLoad();
		var that = this;

		// Register to the file manager
		file_manager.register_observer(function (man, event) {
			that.onFileChange(man, event);
		});

		// --- Parameters ---
		this.sorted = this.dom.getElementsByClassName('t2s_usage')[0];
		this.t2s = this.dom.getElementsByClassName('t2s_value')[0];

		// Reload params
		// config.params.sorted = this.sorted.checked ? this.t2s.value : "";
		if (this.params.params && this.params.params.ordered_vsearch && this.params.params.ordered_vsearch == 'true') {
			this.sorted.checked = this.params.params.ordered_vsearch;
		}

		this.sorted.onchange = () => {
			that.sorted.value = that.sorted.checked;
			
			if (that.sorted.checked) {
				that.t2s.style.display = "inline-block";
			} else {
				that.t2s.style.display = "none";
			}
		}
		this.sorted.onchange();

		// Load autosuggestions
		this.onFileChange(file_manager, {});
	}

	getConfiguration () {
		var config = super.getConfiguration();

		// config.params.sorted = this.sorted.checked ? this.t2s.value : "";

		return config;
	}
};


module_manager.moduleCreators['otu-vsearch'] = (params) => {
	return new OtuVsearchModule(params);
};


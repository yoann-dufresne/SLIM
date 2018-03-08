
class LuluModule extends Module {
	constructor (params) {
		super ("LULU", "https://github.com/tobiasgf/lulu");

		this.params = params;
	}

	onLoad () {
		super.onLoad();

		let otus_table = this.dom.getElementsByClassName('tsv')[0]
		let otus_lulu = this.dom.getElementsByClassName('output_zone')[0].getElementsByTagName('input')[0];

		otus_table.onchange = () => {
			otus_lulu.value = otus_table.value.substr(0, otus_table.value.lastIndexOf('.')) + '_lulu.tsv';
			otus_lulu.onchange();
		};
	}

	getConfiguration () {
		var config = super.getConfiguration();

		// config.params.sorted = this.sorted.checked ? this.t2s.value : "";

		return config;
	}
};


module_manager.moduleCreators['LULU'] = (params) => {
	return new LuluModule(params);
};


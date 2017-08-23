
class MistagFilterModule extends Module {
	constructor (params) {
		super ("mistag_filter", "https://github.com/FranckLejzerowicz/mistag_filter/wiki/Mistag_filter_module");

		this.params = params;
	}

	onLoad () {
		super.onLoad();
		var that = this;
		var inputfasta = this.dom.getElementsByClassName('input_file')[0];
		inputfasta.onchange = () => {
			let mistagfasta = that.dom.getElementsByClassName('output_zone')[0].getElementsByTagName('input')[0];
			let mistagstats = that.dom.getElementsByClassName('output_zone')[0].getElementsByTagName('input')[1];
			mistagfasta.value = inputfasta.value.substr(0, inputfasta.value.lastIndexOf('.')) + '_mistagFiltered.fasta';
			mistagstats.value = inputfasta.value.substr(0, inputfasta.value.lastIndexOf('.')) + '_mistagFiltered_stats.tsv';
			mistagfasta.onchange();
			mistagstats.onchange();
		};
	}

	getConfiguration () {
		var config = super.getConfiguration()
		config.params.out = this.dom.getElementsByClassName('outMistag')[0].checked;
		return config;
	}
};


module_manager.moduleCreators['mistag_filter'] = (params) => {
	return new MistagFilterModule(params);
};


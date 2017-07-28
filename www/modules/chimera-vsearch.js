
class ChimeraModule extends Module {
	constructor (params) {
		super ("chimera-vsearch", "https://github.com/yoann-dufresne/amplicon_pipeline/wiki/Chimera-Vsearch");

		this.params = params;
		this.filtered_value = "";
		this.chimeras_value = "";
	}

	onLoad () {
		super.onLoad();
		var that = this;

		var inputs = this.dom.getElementsByTagName('input');
		let input = inputs[0];
		let filtered = inputs[1];

		// Add suffix to output
		input.onchange = () => {
			var idx = input.value.indexOf('.fasta');
			if (idx == -1)
				return;
			
			var sub = input.value.substring(0, idx);

			filtered.value = sub + '_uchime.fasta';
			filtered.onchange();
		}
	}
};

module_manager.moduleCreators['chimera-vsearch'] = (params) => {
	return new ChimeraModule(params);
};


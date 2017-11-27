
class AssignVsearchModule extends Module {
	constructor (params) {
		super ("assignment-vsearch");
		this.params = params;
	}

	onLoad () {
		super.onLoad();

		var input = this.dom.getElementsByClassName('input_file')[0];
		var output = this.dom.getElementsByClassName('assigned_vsearch')[0];

		input.onchange = () => {
			var filename = input.value.substr(0, input.value.lastIndexOf('.'));
			output.value = filename + '_assigned-vsearch.tsv';
			output.onchange();
		};
	}
};

module_manager.moduleCreators['assignment-vsearch'] = (params) => {
	return new AssignVsearchModule(params);
};



class FastaFilteringModule extends Module {
	constructor (params) {
		super ("fasta-filtering");

		this.params = params;
	}

	onLoad () {
		super.onLoad();

		let fasta = this.dom.getElementsByClassName('input_file')[0];
		fasta.onchange = () => {
			let name = fasta.substr(0, fasta.lastIndexOf('.'));
		};
	}
};


module_manager.moduleCreators['fasta-filtering'] = (params) => {
	return new FastaFilteringModule(params);
};


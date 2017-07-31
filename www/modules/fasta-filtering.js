
class FastaFilteringModule extends Module {
	constructor (params) {
		super ("fasta-filtering");

		this.params = params;
	}

	onLoad () {
		super.onLoad();

		let fasta = this.dom.getElementsByClassName('input_file')[0];
		let out = this.dom.getElementsByClassName('output_zone')[0];
		fasta.onchange = () => {
			let name = fasta.value.substr(0, fasta.value.lastIndexOf('.'));
			out.value = name + '_filtered.fasta';
		};
	}
};


module_manager.moduleCreators['fasta-filtering'] = (params) => {
	return new FastaFilteringModule(params);
};



class TrimmingModule extends Module {
	constructor (params) {
		super ("fasta-trimming");

		this.params = params;
	}

	onLoad () {
		super.onLoad();

		let fasta = this.dom.getElementsByClassName('input_file')[0];
		let trimmed_fasta = this.dom.getElementsByClassName('output_zone')[0].getElementsByTagName('input')[0];

		fasta.onchange = () => {
			trimmed_fasta.value = fasta.value.substr(0, fasta.value.lastIndexOf('.')) + '_trimmed.fasta';
			trimmed_fasta.onchange();
		};
	}
};


module_manager.moduleCreators['fasta-trimming'] = (params) => {
	return new TrimmingModule(params);
};


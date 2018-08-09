
class NremoverModule extends Module {
	constructor (params) {
		super ("fasta-remove-ambiguous-reads");

		this.params = params;
	}

	onLoad () {
		super.onLoad();

		let fasta = this.dom.getElementsByClassName('input_file')[0];
		let cleaned_fasta = this.dom.getElementsByClassName('output_zone')[0].getElementsByTagName('input')[0];

		fasta.onchange = () => {
			cleaned_fasta.value = fasta.value.substr(0, fasta.value.lastIndexOf('.')) + '_noN.fasta';
			cleaned_fasta.onchange();
		};
	}
	getConfiguration () {
	let conf = super.getConfiguration();

	return conf;

	};
};



module_manager.moduleCreators['fasta-remove-ambiguous-reads'] = (params) => {
	return new NremoverModule(params);
};


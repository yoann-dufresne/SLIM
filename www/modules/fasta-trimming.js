
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
	getConfiguration () {
	let conf = super.getConfiguration();

	// retieve the checked value of the radio html for trim_mode
	var radios = document.getElementsByName('trim_mode');
	for (let i=0 ; i<radios.length ; i++)
		if (radios[i].checked)
			conf.params.trim_mode = radios[i].value

	radios = document.getElementsByName('keep_reads');
	// retieve the checked value of the radio html for keep_reads
	for (let i=0 ; i<radios.length ; i++)
		if (radios[i].checked)
			conf.params.keep_reads = radios[i].value

	return conf;

	};
};



module_manager.moduleCreators['fasta-trimming'] = (params) => {
	return new TrimmingModule(params);
};


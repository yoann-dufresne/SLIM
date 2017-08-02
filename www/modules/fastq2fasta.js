
class Fastq2FastaModule extends Module {
	constructor (params) {
		super ("fastq2fasta");

		this.params = params;
	}

	onLoad () {
		super.onLoad();

		let fastq = this.dom.getElementsByClassName('input_file')[0];
		let fasta = this.dom.getElementsByClassName('output_zone')[0].getElementsByTagName('input')[0];
		fastq.onchange = () => {
			fasta.value = fastq.value.substr(0, fastq.value.lastIndexOf('.')) + '.fasta';
			fasta.onchange();
		};
	}
};


module_manager.moduleCreators['fastq2fasta'] = (params) => {
	return new Fastq2FastaModule(params);
};


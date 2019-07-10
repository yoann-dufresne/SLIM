
class FastqNoPrimerModule extends Module {
	constructor (params) {
		super ("fastq-primers-filtering");
		this.params = params;
	}

	onLoad () {
		super.onLoad();

		let primers = this.dom.getElementsByClassName('input_file')[0];
		let fwd = this.dom.getElementsByClassName('input_file')[1];
		let rev = this.dom.getElementsByClassName('input_file')[2];

		let out_fwd = this.dom.getElementsByClassName('output_zone')[0].getElementsByTagName('input')[0];
		let out_rev = this.dom.getElementsByClassName('output_zone')[1].getElementsByTagName('input')[0];

		fwd.onchange = () => {
			out_fwd.value = fwd.value.substr(0, fwd.value.lastIndexOf('.')) + '_noPrimers.fastq';
			out_fwd.onchange();
		};
		rev.onchange = () => {
			out_rev.value = rev.value.substr(0, rev.value.lastIndexOf('.')) + '_noPrimers.fastq';
			out_rev.onchange();
		};
	}
};


module_manager.moduleCreators['fastq-primers-filtering'] = (params) => {
	return new FastqNoPrimerModule(params);
};

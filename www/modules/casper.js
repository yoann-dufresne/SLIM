
class CasperModule extends Module {
	constructor (params) {
		super ("casper");

		this.params = params;
	}

	onLoad () {
		super.onLoad();
		var that = this;

		// Rewrite output on input changes
		var inputs = this.dom.getElementsByClassName('input_file');
		this.fwd = inputs[0]; this.rev = inputs[1];
		this.fwd.onchange = this.rev.onchange = () => {that.input_change()};
	}

	input_change () {
		// If the names are standards
		if (this.fwd.value.includes('_fwd.fastq') && this.rev.value.includes('_rev.fastq')) {
			// Get the main name
			var i1 = this.fwd.value.indexOf('_fwd.fastq');
			var sub1 = this.fwd.value.substring(0, i1);
			var i2 = this.rev.value.indexOf('_rev.fastq');
			var sub2 = this.rev.value.substring(0, i2);

			if (sub2 == sub1) {
				let output_file = this.dom.getElementsByClassName('output_zone')[0];
				output_file = output_file.getElementsByTagName('input')[0];
				output_file.value = sub1 + '_casper.fastq';
				output_file.onchange();
			}
		}
	}
};


module_manager.moduleCreators.casper = (params) => {
	return new CasperModule(params);
};


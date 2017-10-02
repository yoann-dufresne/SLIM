
class OtuFilteringModule extends Module {
	constructor (params) {
		super ("otu-filtering");

		this.params = params;
	}

	onLoad () {
		super.onLoad();

		var ins = this.dom.getElementsByClassName('input_file');
		var outs = this.dom.getElementsByClassName('output_zone');

		// OTU matrix io
		var matrix = ins[0];
		var matrix_out = outs[0].getElementsByTagName('input')[0];
		matrix.onchange = () => {
			var threshold = this.dom.getElementsByClassName('param_value')[0].value;
			let name = matrix.value.substr(0, matrix.value.lastIndexOf('.'));
			matrix_out.value = name + '_filtered_' + threshold + '.tsv';
		};

		// Centroids fasta io
		var centroids = ins[1];
		var centroids_out = outs[1].getElementsByTagName('input')[0];
		centroids.onchange = () => {
			var threshold = this.dom.getElementsByClassName('param_value')[0].value;
			let name = centroids.value.substr(0, centroids.value.lastIndexOf('.'));
			centroids_out.value = name + '_filtered_' + threshold + '.fasta';
		};

		// Clusterised reads fasta io
		var reads = ins[2];
		var reads_out = outs[2].getElementsByTagName('input')[0];
		reads.onchange = () => {
			var threshold = this.dom.getElementsByClassName('param_value')[0].value;
			let name = reads.value.substr(0, reads.value.lastIndexOf('.'));
			reads_out.value = name + '_filtered_' + threshold + '.fasta';
		};
	}
};


module_manager.moduleCreators['otu-filtering'] = (params) => {
	return new OtuFilteringModule(params);
};


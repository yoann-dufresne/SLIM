
class OligotypingModule extends Module {
	constructor (params) {
		super ("oligotyping");
		this.params = params;
	}

	onLoad () {
		super.onLoad();
		var that = this;
		var what = this;
		var thing = this;
		var fasta = this.dom.getElementsByClassName('fasta')[0];
		var c_param = what.dom.getElementsByClassName('autoCompo')[0];
		var sc_param = that.dom.getElementsByClassName('manuCompo')[0];
		var s_param = that.dom.getElementsByClassName('nSamples')[0];
		var a_param = that.dom.getElementsByClassName('pAbund')[0];
		var A_param = that.dom.getElementsByClassName('abundSum')[0];
		var M_param = that.dom.getElementsByClassName('abundOligo')[0];

		this.fasta = fasta;
		this.c_param = c_param;
        this.sc_param = sc_param;
        this.s_param = s_param;
        this.a_param = a_param;
        this.A_param = A_param;
        this.M_param = M_param;

		this.c_param.onchange = () => {that.c_change()};
		this.sc_param.onchange = () => {what.sc_change()};
		this.fasta.onchange = this.s_param.onchange = this.a_param.onchange = this.A_param.onchange = this.M_param.onchange = () => {thing.input_change()};
	}

	c_change () {
		let manuCompo = this.dom.getElementsByClassName('manuCompo')[0];
		let dir = this.dom.getElementsByClassName('output_zone')[0].getElementsByTagName('input')[0];
		var fasta = this.dom.getElementsByClassName('input_file')[0];
		if (this.c_param.value != '') {
			this.sc_param.value = '';
		} else {
			manuCompo.value = this.sc_param.value;
		}
		dir.value = fasta.value.substr(0, fasta.value.lastIndexOf('.'));
		if (this.c_param.value != '')
			dir.value = dir.value + '-c' + this.c_param.value;
		if (this.sc_param.value != '')
			dir.value = dir.value + '-sc' + this.sc_param.value;
		dir.value = dir.value + '-a' + this.a_param.value + '-A' + this.A_param.value + '-M' + this.M_param.value + '.tar.gz';
		dir.onchange();
	}

	sc_change () {
		let autoCompo = this.dom.getElementsByClassName('autoCompo')[0];
		let dir = this.dom.getElementsByClassName('output_zone')[0].getElementsByTagName('input')[0];
		var fasta = this.dom.getElementsByClassName('input_file')[0];
		if (this.sc_param.value != '') {
			this.c_param.value = '';
		} else {
			autoCompo.value = this.c_param.value;;
		}
		dir.value = fasta.value.substr(0, fasta.value.lastIndexOf('.'));
		if (this.c_param.value != '')
			dir.value = dir.value + '-c' + this.c_param.value;
		if (this.sc_param.value != '')
			dir.value = dir.value + '-sc' + this.sc_param.value.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g,'').split(' ').length;
		dir.value = dir.value + '-a' + this.a_param.value + '-A' + this.A_param.value + '-M' + this.M_param.value + '.tar.gz';
		dir.onchange();
	}

	input_change () {
		let dir = this.dom.getElementsByClassName('output_zone')[0].getElementsByTagName('input')[0];
		var fasta = this.dom.getElementsByClassName('input_file')[0];
		dir.value = fasta.value.substr(0, fasta.value.lastIndexOf('.'));
		if (this.c_param.value != '')
			dir.value = dir.value + '-c' + this.c_param.value;
		if (this.sc_param.value != '')
			dir.value = dir.value + '-sc' + this.sc_param.value;
		dir.value = dir.value + '-a' + this.a_param.value + '-A' + this.A_param.value + '-M' + this.M_param.value + '.tar.gz';
		dir.onchange();
	}
};


module_manager.moduleCreators['oligotyping'] = (params) => {
	return new OligotypingModule(params);
};


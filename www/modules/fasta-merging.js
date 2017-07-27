
class FastaMergingModule extends Module {
	constructor (params) {
		super ("fasta-merging");

		this.params = params;
	}
};


module_manager.moduleCreators['fasta-merging'] = (params) => {
	return new FastaMergingModule(params);
};


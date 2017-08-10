
class AssignVsearchModule extends Module {
	constructor (params) {
		super ("assignment-vsearch");
		this.params = params;
	}
};

module_manager.moduleCreators['assignment-vsearch'] = (params) => {
	return new AssignVsearchModule(params);
};


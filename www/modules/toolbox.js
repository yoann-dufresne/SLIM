

class ToolboxModule extends Module {
	constructor (params) {
		super ("toolbox");

		this.params = params;
	}

	onFileChange (file_manager, event) {
		if (this.js)
			this.js.onFileChange(file_manager, event);
	}

	onLoad () {
		var that = this;

		// Register to the file manager
		file_manager.register_observer((man, event) => {
			that.onFileChange(man, event);
		});

		// register important objects
		this.select_tool = this.dom.getElementsByTagName('select')[0];
		this.tool_div = this.dom.getElementsByClassName('tool')[0];

		// Load the right html depending of the select
		this.select_tool.onchange = () => {
			if (that.select_tool.value != "") {
				$.get('/modules/toolbox/' + that.select_tool.value + '.html', (data) =>{
					// HTML
					that.tool_div.innerHTML = data;

					// Load js
					$.get('/modules/toolbox/' + that.select_tool.value + '.js', (data) =>{
						eval(data);
						that.js = tmp;
					}).done (() => {
						that.js.onLoad(that.tool_div);
						this.onFileChange(file_manager, null);
					});
				});
			}
		};
	}

	getConfiguration () {
		var config = super.getConfiguration()
		config = this.js.getConfiguration(config);
		return config;
	}
};

module_manager.moduleCreators['toolbox'] = (params) => {
	return new ToolboxModule(params);
};


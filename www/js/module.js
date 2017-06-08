

// Objects to create and store pipeline modules

var __next_id = 0;
class Module {
	constructor (name) {
		this.name = name;
		this.id = __next_id++;
		this.toDOMelement();
	}

	specificDOMelements () {
		var specific = document.createElement('div');
		specific.classList.add('specific');
		this.dom.appendChild(specific);

		var that = this;
		$.get('/modules/' + this.name + '.html', function (data) {
			specific.innerHTML = data;
		}).done (function() {that.onLoad()});
	}

	onLoad () {

	}

	getConfiguration () {
		return {inputs:{}, outputs:{}, params:{}};
	}

	toDOMelement () {
		// DOM element creation
		this.dom = document.createElement('div');
		this.dom.classList.add('module');
		this.dom.idx = this.id;

		var header = document.createElement('div');
		header.classList.add('mod_head');
		// Title
		var title = document.createElement('h3');
		title.innerHTML = "Module " + this.name;
		header.appendChild(title);
		// Execution status
		header.innerHTML += '<img src="imgs/spinner.gif" alt="Spinner" class="spinner" />\
		<p class="status">ready</p>';
		this.dom.appendChild(header);

		// Module content
		this.specificDOMelements();

		// Remove module
		var rmv = document.createElement('button');
		rmv.innerHTML = 'Remove this module';
		var that = this;
		rmv.onclick = function () {
			// remove from modules list
			var idx = module_manager.modules.indexOf(that);
			if (idx > -1) {
				module_manager.modules.splice(idx, 1);
			}
			// remove from dom
			modules_div.removeChild(that.dom);
			// remove outputs from the accessible files
			var outputs = that.getConfiguration().outputs;
			var files = Object.values(outputs);
			var event = new Event('rmv_output');
			event.files = files;
			document.dispatchEvent(event);
		}
		this.dom.appendChild(rmv);
	}
};


class ModuleManager {
	constructor() {
		var that = this;
		this.modules = [];

		$.get("/softwares", function( data ) {
			data = JSON.parse(data);
			that.available_modules = data;

			var modules_list = document.querySelector('#module_list');
			for (var idx in data) {
				var opt = document.createElement('option');
				opt.innerHTML = data[idx];
				opt.value = data[idx];
				modules_list.appendChild(opt);
			}
		});

		this.moduleCreators = {};
	}

	loadModules () {
		if (!this.available_modules || this.available_modules.length == 0) {
			// If modules are not still loaded, try again in 50ms
			var that = this;
			setTimeout(()=>{that.loadModules()}, 50);
			return;
		}

		// Load each module
		for (var idx=0 ; idx<this.available_modules.length ; idx++) {
			var name = this.available_modules[idx];

			$.get('/modules/' + name + '.js', (data) => {
				eval(data);
			});
		}
	}

	createModule (name, params, status) {
		if (!this.moduleCreators[name])
			return;

		// Create the module
		var module = this.moduleCreators[name](params);
		this.modules.push(module);

		// Add the module to the dom
		var div = document.querySelector('#modules');
		div.appendChild(module.dom);

		// Modify the execution status
		if (status) {
			module.dom.classList.add(status);

			var p_stat = module.dom.getElementsByClassName('status')[0];
			p_stat.innerHTML = status;
		}
	}
};
var module_manager = new ModuleManager();
module_manager.loadModules();



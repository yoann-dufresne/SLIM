

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
		$.get('/js/modules/' + this.name + '.html', function (data) {
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

		this.dom_modules = 

		$.get("/softwares", function( data ) {
			that.available_modules = data;

			var modules_list = document.querySelector('#module_list');
			for (var idx in data) {
				var opt = document.createElement('option');
				opt.innerHTML = data[idx];
				opt.value = data[idx];
				modules_list.appendChild(opt);
			}
		});
	}

	createModule (name, params, status) {
		var module;
		// Create the module object
		switch (name) {
			case 'pandaseq':
				module = new PandaseqModule(params);
				break;
			case 'demultiplexer':
				module = new DemultiplexerModule(params);
				break;
			default:
				return
		}

		// Add the module to module list
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




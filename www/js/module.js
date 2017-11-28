

// Objects to create and store pipeline modules

var __next_id = 0;
class Module {
	constructor (name, doc) {
		if (name == null)
			return;

		this.name = name;
		this.doc = doc;
		this.id = __next_id++;
	}

	specificDOMelements (callback) {
		this.specific = document.createElement('div');
		this.specific.classList.add('specific');
		this.dom.appendChild(this.specific);

		this.specific.innerHTML = module_manager.htmls[this.name];
		var that = this;
		that.onLoad();
		callback();	
	}

	createOptionBox (option) {
		var box = document.createElement("div");
		box.style.marginTop = '10px';
		
		// Expand options
		var expand = document.createElement("button");
		expand.classList.add('expandOptions');
		expand.innerHTML = 'More options';
		expand.onclick = () => {
			expand.style.display = 'none';
			option.style.display = 'inline-block';
		}
		box.appendChild(expand);

		// Retract options
		var retract = document.createElement("button");
		retract.classList.add('retractOptions');
		retract.innerHTML = 'Less options';
		retract.onclick = () => {
			expand.style.display = 'inline-block';
			option.style.display = 'none';
		}
		option.insertBefore(retract, option.firstChild);
		var line = document.createElement('hr');
		option.insertBefore(line, option.firstChild);
		option.style.display = 'none';

		box.appendChild(option);
		return box;
	}

	output_onchange (prev_vals, new_vals) {
		// Send a remove event for the precedent output value
		var event = new Event('rmv_output');
		event.files = prev_vals;
		document.dispatchEvent(event);

		// Update the output value
		event = new Event('new_output');
		event.files = new_vals;
		document.dispatchEvent(event);
	}

	onLoad () {
		var that = this;

		// --- Parameters ---
		var params = this.dom.getElementsByClassName('param_value');
		for (let par_id=0 ; par_id<params.length ; par_id++) {
			let param = params[par_id];

			// Add number verifications for parameters
			if (param.classList.contains('number'))
				param.onchange = () => {that.nanVerification(param);};

			// Reload parameters
			if (this.params.params)
				param.value = this.params.params[param.name];
		}

		// --- Inputs ---
		if (this.params.inputs) {
			// Reload input files
			var in_files = this.dom.getElementsByClassName('input_file');
			for (let in_id=0 ; in_id<in_files.length ; in_id++) {
				let input = in_files[in_id];

				if (this.params.inputs[input.name] != undefined)
					input.value = this.params.inputs[input.name].replace('$', '*');
			}

			// Reload input lists
			var in_lists = this.dom.getElementsByClassName('input_list');
			for (let list_id=0 ; list_id<in_lists.length ; list_id++) {
				let in_list = in_lists[list_id];
				var html = '';

				for (let in_id in this.params.inputs) {
					// Detect list items
					if (!in_id.startsWith('list_'))
						continue;

					// Detect list id
					let loaded_list_id = in_id.split('_')[1];
					if (loaded_list_id == list_id) {
						html += '<p><input type="checkbox" name="' + this.params.inputs[in_id].replace('$', '*')
							+ '" class="checklist" checked> ' + this.params.inputs[in_id].replace('$', '*') + '</p>';
					}
				}
				in_list.innerHTML = html;
			}
		}

		// --- Outputs ---
		var out_zones = this.dom.getElementsByClassName('output_zone');

		for (let zone_id=0 ; zone_id<out_zones.length ; zone_id++) {
			let out_zone = out_zones[zone_id];
			let out_input = out_zone.getElementsByTagName('input')[0];
			let link = out_zone.getElementsByTagName('a')[0];

			// Reload outputs
			if (this.params.outputs && this.params.outputs[out_input.name]){
				out_input.value = this.params.outputs[out_input.name];
				out_input.old_value = out_input.value;
			}

			// On change events
			out_input.onchange = function () {
				if (out_input.old_value == undefined)
					that.output_onchange ([], [out_input.value]);
				else
					that.output_onchange ([out_input.old_value], [out_input.value]);
				out_input.old_value = out_input.value;
				
				// Joker case
				let val = out_input.value;
				if (val.includes('*'))
					val += '.tar.gz';
				
				// Create the download link
				if (link)
					link.href = '/data/' + exec_token + '/' + val;
			}
			out_input.onchange();
		}
	}

	getConfiguration () {
		var config = {inputs:{}, outputs:{}, params:{}};

		// Simple file inputs
		var in_files = this.dom.getElementsByClassName('input_file');
		for (let in_id=0 ; in_id<in_files.length ; in_id++) {
			let input = in_files[in_id];

			config.inputs[input.name] = input.value;
		}


		// Complete inputs on file lists
		var in_lists = this.dom.getElementsByClassName('input_list');
		for (let list_id=0 ; list_id<in_lists.length ; list_id++) {
			let in_list = in_lists[list_id];
			let inputs = in_list.getElementsByClassName('checklist');

			for (let in_id=0 ; in_id<inputs.length ; in_id++) {
				let input = inputs[in_id];
				if (input.checked) {
					if (in_list.classList.contains('agregate'))
						config.inputs['list_' + list_id + '_' + in_id] = input.name.replace('*', '$');
					else
						config.inputs['list_' + list_id + '_' + in_id] = input.name;
				}
			}
		}


		// Complete outputs on output zones
		var out_zones = this.dom.getElementsByClassName('output_zone');
		for (let zone_id=0 ; zone_id<out_zones.length ; zone_id++) {
			let out_input = out_zones[zone_id].getElementsByTagName('input')[0];
			
			if (out_input.value != '')
				config.outputs[out_input.name] = out_input.value;
		}


		// Adding parameters
		var params = this.dom.getElementsByClassName('param_value');
		for (let par_id=0 ; par_id<params.length ; par_id++) {
			let param = params[par_id];

			if (param.tagName.toUpperCase() == "INPUT" && param.type == "checkbox")
				config.params[param.name] = param.checked;
			else
				config.params[param.name] = param.value;
		}


		return config;
	}

	toDOMelement () {
		// DOM element creation
		this.root = document.createDocumentFragment();
		this.dom = document.createElement('div');
		this.dom.classList.add('module');
		this.dom.idx = this.id;
		this.root.appendChild(this.dom);

		var header = document.createElement('div');
		header.classList.add('mod_head');
		// Title
		var title = document.createElement('h3');
		var doc = this.doc ? (' <a target="_blank" href="' + this.doc + '">' +
			'<img src="imgs/information.png" alt="help" class="info"></a>') : "";
		var terminal_output = '<img src="imgs/term.png" alt="Soft output" class="term_ico">'
		title.innerHTML = "Module " + this.name + doc + terminal_output;
		header.appendChild(title);
		// Execution status
		header.innerHTML += '<img src="imgs/spinner.gif" alt="Spinner" class="spinner" />\
		<p class="status">ready</p>';
		this.dom.appendChild(header);

		var that = this;
		var transformOptions = () => {
			// Options format
			var option = that.dom.getElementsByClassName('options');
			if (option.length > 0) {
				option = option[0];
				var clone = option.cloneNode(true);
				that.specific.replaceChild(clone, option);
				var optionBox = that.createOptionBox(option);
				that.specific.replaceChild(optionBox, clone);
			}
		}

		// Output screen
		this.term = document.createElement("p");
		this.term.classList.add('out_term');
		var icon = this.dom.getElementsByClassName('term_ico')[0];
		icon.onclick = () => {
			that.term.style.height = '200px';
			that.term.style.display = 'inline-block';
			$.get('/logs?token=' + exec_token + '&soft_id=' + that.dom.idx, (data) => {
				that.term.innerHTML = data.replace(/\n/g, '<br>');
			});
		};
		this.dom.appendChild(this.term);

		// Module content
		this.specificDOMelements(transformOptions);

		// Remove module
		var rmv = document.createElement('button');
		rmv.classList.add('rmv_module');
		rmv.innerHTML = 'Remove this module';
		rmv.onclick = function () {
			// remove from modules list
			delete module_manager.modules[that.id];
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


	nanVerification (elem) {
		if (isNaN(elem.value)) {
			elem.value = 0;
		}
	};
};


class ModuleManager {
	constructor() {
		var that = this;
		this.modules = {};
		this.htmls = {};
		this.loadings = 1;

		$.get("/softwares", function( data ) {
			data = JSON.parse(data);
			that.available_modules = [];

			let modules_list = document.querySelector('#module_list');
			for (var category in data) {
				// Create categories in the select options
				let opt_grp = document.createElement('optgroup');
				opt_grp.label = category;
				let modules = data[category];

				for (let idx in modules) {
					// Add the module to the available ones
					that.available_modules.push(modules[idx]);

					// Add the option in the select
					let opt = document.createElement('option');
					opt.innerHTML = modules[idx];
					opt.value = modules[idx];
					opt_grp.appendChild(opt);

					that.loadings += 1;
					$.get('/modules/' + modules[idx] + '.html', function (data) {
						that.htmls[modules[idx]] = data;
					}).done (() => {that.loadings -= 1;});
				}
				
				modules_list.appendChild(opt_grp);
			}

			that.loadings -= 1;
		});

		this.moduleCreators = {};
	}

	isLoading () {
		return this.loadings != 0;
	}

	loadModules () {
		if (!this.available_modules || this.available_modules.length == 0) {
			// If modules are not still loaded, try again in 50ms
			var that = this;
			setTimeout(()=>{that.loadModules()}, 50);
			return;
		}

		// Load each module
		for (let idx=0 ; idx<this.available_modules.length ; idx++) {
			let name = this.available_modules[idx];

			console.log('/modules/' + name + '.js')
			$.get('/modules/' + name + '.js', (data) => {
				try {
					eval(data);
				} catch (e) {
					console.error("Errors while load module " + name + "\n"
						+ "On line " + e.lineNumber);
				}
			});
		}
	}

	createModule (name, params, status) {
		if (!this.moduleCreators[name]) {
			console.log('Missing module ' + name);
			return;
		}

		// Create the module
		if (params.idx)
			__next_id = params.idx;
		var module = this.moduleCreators[name](params);
		module.toDOMelement();
		this.modules[module.id] = module;

		// Add the module to the dom
		var div = document.querySelector('#modules');
		div.appendChild(module.root);
		gui_file_updater.file_trigger();

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



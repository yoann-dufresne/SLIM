
// Objects to create and store pipeline modules

class Module {
	constructor (name) {
		this.name = name;
		this.toDOMelement();
	}

	specificDOMelements () {
		var specific = document.createElement('div');
		specific.classList.add('specific');
		this.dom.appendChild(specific);

		$.get('/js/modules/' + this.name + '.html', function (data) {
			specific.innerHTML = data;
		});
	}

	getConfiguration () {
		return {};
	}

	toDOMelement () {
		// DOM element creation
		this.dom = document.createElement('div');
		this.dom.classList.add('module');

		var title = document.createElement('h3');
		title.innerHTML = "Module " + this.name;
		this.dom.appendChild(title);

		this.specificDOMelements();

		var rmv = document.createElement('button');
		rmv.innerHTML = 'Remove this module';
		var that = this;
		rmv.onclick = function () {
			// remove from modules list
			var idx = modules.indexOf(that);
			if (idx > -1) {
				modules.splice(idx, 1);
			}
			// remove from dom
			modules_div.removeChild(that.dom);
		}
		this.dom.appendChild(rmv);
	}
};



// Modules additions/deletions
var modules = [];
var add_button = document.querySelector('#add_module');
var modules_div = document.querySelector('#modules');
var modules_list = document.querySelector('#module_list');

var available_modules = [];
$.get("/softwares", function( data ) {
	available_modules = data;

	for (var idx in available_modules) {
		var opt = document.createElement('option');
		opt.innerHTML = available_modules[idx];
		opt.value = available_modules[idx];
		modules_list.appendChild(opt);
	}
});

add_button.onclick = function () {
	var mod;
	switch (modules_list.value) {
		case 'pandaseq':
			mod = new PandaseqModule();
	}

	modules.push(mod);
	modules_div.appendChild(mod.dom);
};

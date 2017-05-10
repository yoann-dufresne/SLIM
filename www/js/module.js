
// Objects to create and store pipeline modules

class Module {
	constructor (name) {
		this.name = name;
		this.dom = null;
		this.config = {};
	}

	specificDOMelements () {
		var p = document.createElement('p');
		p.innerHTML = "Ga Bu Zo Meu";
		this.dom.appendChild(p);
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

var available_modules = [];
$.get("/softwares", function( data ) {
	available_modules = data;
});

add_button.onclick = function () {
	var mod = new Module('Test');
	mod.toDOMelement();

	modules.push(mod);
	modules_div.appendChild(mod.dom);
};

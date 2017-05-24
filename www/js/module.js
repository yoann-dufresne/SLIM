

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





/* This class auto reload input choices when their classes are correctly set.
 * The file suggestions will be automatically set using the class names of the objects
 * as a file filter.
 * Here a list of the classes that will trigger auto-reloading
 * input_list: for checkbox lists.
 */


class FileUpdater {

	constructor (file_manager) {
		this.prev_values = {};

		var that = this;
		file_manager.register_observer(() => {
			that.file_trigger();
		});

		this.previousCall = 0;
		this.timeout = null;
	}

	/* Function triggered when files change */
	file_trigger () {
		var that = this;
		var up_func = () => {
			that.update_input_lists();
			that.update_input_files();
			that.timeout = null;
		};
		
		let time = new Date().getTime();
		if (time - this.previousCall < 200) {
			if (this.timeout != null)
				clearTimeout(this.timeout);

			this.timeout = setTimeout(up_func, 200);
		} else
			up_func();
		this.previousCall = time;
	}

	update_input_files () {
		var that = this;
		var modules = module_manager.modules;
		for (let mod_idx in modules) {
			var input_files = modules[mod_idx].dom.getElementsByClassName('input_file');

			for (let id_file=0 ; id_file<input_files.length ; id_file++) {
				let input_file = input_files[id_file];

				// Get all the file list for autocomplete
				let autocomplete = file_manager.getFiles(input_file.classList).filter((val)=>{return typeof(val) == "string"});
				
				// Transform the file list to autocomplete format
				for (let idx=0 ; idx<autocomplete.length ; idx++) {
					autocomplete[idx] = {value:autocomplete[idx], data:autocomplete[idx]};
				}

				// Setup the jquery autocomplete
				$(input_file).autocomplete({
					lookup: autocomplete,
					onSelect: function(suggestion) {
						// Read values
						let prev = that.prev_values[mod_idx + '_' + input_file.name];
						input_file.value = suggestion.data;

						// Compare and execute specific actions
						if (input_file.onchange != undefined && prev != input_file.value)
							input_file.onchange();

						// Update previous values
						that.prev_values[mod_idx + '_' + input_file.name] = suggestion.data;
					}
				});
			}
		}
	}

	/* Update the file lists by looking at the div classes */
	update_input_lists () {
		var input_lists = document.getElementsByClassName('input_list');

		for (let id_list=0 ; id_list<input_lists.length ; id_list++) {
			let input_list = input_lists[id_list];
			let checked = [];
			
			// Save checked files
			let inputs = input_list.getElementsByTagName('input');
			for (let input_id=0 ; input_id<inputs.length ; input_id++) {
				let input = inputs[input_id];
				if (input.checked)
					checked.push(input.name);
			}


			// Recreate file list
			input_list.innerHTML = "";

			let classes = input_list.classList;
			let filenames = file_manager.getFiles(classes);
			for (let file_id in filenames) {
				let filename = filenames[file_id];
				input_list.innerHTML += '<p><input type="checkbox" name="' + filename + '" class="checklist"'
					+ (checked.includes(filename) ? ' checked' : '') + '> ' + filename + '</p>';
			}

			// Add reloaded inputs
			for (let id_check=0 ; id_check<checked.length ; id_check++) {
				let check = checked[id_check];

				if (!filenames.includes(check)) {
					input_list.innerHTML += '<p><input type="checkbox" name="' + check
						+ '" class="checklist" checked> ' + check + '</p>';
				}
			}
		}
	}
}

var gui_file_updater = new FileUpdater(file_manager);

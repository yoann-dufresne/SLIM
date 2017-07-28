
/* This class auto reload input choices when their classes are correctly set.
 * The file suggestions will be automatically set using the class names of the objects
 * as a file filter.
 * Here a list of the classes that will trigger auto-reloading
 * input_list: for checkbox lists.
 */


class FileUpdater {

	constructor (file_manager) {
		var that = this;
		file_manager.register_observer(() => {
			that.file_trigger();
		});
	}

	/* Function triggered when files change */
	file_trigger () {
		this.update_input_lists();
		this.update_input_files();
	}

	update_input_files () {
		var input_files = document.getElementsByClassName('input_file');

		for (let id_file=0 ; id_file<input_files.length ; id_file++) {
			let input_file = input_files[id_file];

			// Get all the file list for autocomplete
			let autocomplete = file_manager.getFiles(input_file.classList);
			// Transform the file list to autocomplete format
			for (let idx=0 ; idx<autocomplete.length ; idx++) {
				autocomplete[idx] = {value:autocomplete[idx], data:autocomplete[idx]};
			}

			// Setup the jquery autocomplete
			$(input_file).autocomplete({
				lookup: autocomplete,
				onSelect: function(suggestion) {
					input_file.value = suggestion.data;
					if (input_file.onchange)
						input_file.onchange();
				}
			});
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

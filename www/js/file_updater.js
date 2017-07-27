
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
	}

	/* Update the file lists by looking at the div classes */
	update_input_lists () {
		var input_lists = document.getElementsByClassName('input_list');

		for (let id_list=0 ; id_list<input_lists.length ; id_list++) {
			let input_list = input_lists[id_list];
			let checked = [];
			
			// Save checked files
			let inputs = input_list.getElementsByTagName('input');
			for (let input_id in inputs) {
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
		}
	}
}

var gui_file_updater = new FileUpdater(file_manager);

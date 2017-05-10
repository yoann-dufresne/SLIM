
var new_file_listeners = [];

document.addEventListener('new_file', function (e) {
	for (idx in new_file_listeners) {
		new_file_listeners[idx](e);
	}
}, false);


var new_file_listeners = [];

document.addEventListener('new_file', function (e) {
	for (idx in new_file_listeners) {
		new_file_listeners[idx](e);
	}
}, false);

var raiseNewFilesEvent = function (filenames, type) {
	var event = new Event('new_file');
	event.files = filenames;
	event.type = type;
	document.dispatchEvent(event);
}


var rmv_file_listeners = [];

document.addEventListener('rmv_file', function (e) {
	for (idx in rmv_file_listeners) {
		rmv_file_listeners[idx](e);
	}
}, false);



// --- Actions on load ---
var on_token_generated = () => {
	file_manager.load_from_server();
}




// --- Token managment ---
var exec_token = '';

// Get token from url
var url = window.location.href;
var url_split = url.split('?')[1];
var url_params = {};
if (url_split) {
	var split = url_split.split('&');
	for (var idx=0 ; idx<split.length ; idx++) {
		var key_val = split[idx].split('=');
		url_params[key_val[0]] = key_val[1];
	}

	if (url_params.token)
		exec_token = url_params.token;
}

// Generate exec token
$.get('/token_generation' + (exec_token == '' ? '' : '?token=' + exec_token))
.done(function(data) {
	exec_token = data;
	history.pushState({urlPath:'/?token=' + data},'', '/?token=' + data);
	on_token_generated();
});





// --- Actions on load ---
var on_token_generated = () => {
	// Files loading
	file_manager.load_from_server();

	// Modules loading
	$.get('/data/' + exec_token + '/pipeline.conf')
	.done((data) => {
		if (data && data != '')
			load_modules(JSON.parse(data));
	});
}

var load_modules = (log) => {
	// Wait for modules loading
	if (Object.keys(module_manager.moduleCreators).length == 0) {
		setTimeout(()=>{load_modules (log);}, 50);
		return;
	}

	// For each module in the log file
	for (var idx in log) {
		var soft = log[idx];

		// Create the module
		var module = module_manager.createModule (soft.name, soft.params, soft.status);
	}

	// Update status
	update_run_status(exec_token, (status)=> {
		if (['ready', 'running', 'waiting'].includes(status.global)) {
			// Set update interval
			var inter = setInterval(()=>{
				update_run_status(exec_token, (status) =>{
					if (['ended', 'aborted'].includes(status.global))
						clearInterval(inter);
				});
			}, 5000);

			// Froze the start button
			document.querySelector('#start').disabled = true;
		}
	});
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



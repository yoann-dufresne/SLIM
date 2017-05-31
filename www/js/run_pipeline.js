
// --- Modules additions/deletions ---
var add_button = document.querySelector('#add_module');
var modules_div = document.querySelector('#modules');
var modules_list = document.querySelector('#module_list');

for (var idx in module_manager.available_modules) {
	var opt = document.createElement('option');
	opt.innerHTML = module_manager.available_modules[idx];
	opt.value = module_manager.available_modules[idx];
	modules_list.appendChild(opt);
}

add_button.onclick = function () {
	var mod = module_manager.createModule(modules_list.value, {});
	module_manager.modules.push(mod);
	modules_div.appendChild(mod.dom);
};


// --- Pipeline execution ---
var run = document.querySelector('#start');

var status_interval;
run.onclick = function () {
	var config = {token:exec_token};
	for (var idx in module_manager.modules) {
		var module = module_manager.modules[idx];

		config[module.id] = {
			name: module.name,
			params: module.getConfiguration()
		};
	}

	$.post( "/run", config)
	.done(function( data ) {
		console.log("Run started");
		run.disabled = true;
	});

	status_interval = setInterval(()=>{update_run_status(exec_token);}, 5000);
	update_run_status(exec_token);
};


// --- Status update ---

var update_run_status = (token) => {
	$.get('/status?token=' + token).done((data) => {
		var server_status = JSON.parse(data);

		// Stop the update when the run is over
		if (server_status.global == 'ended' || server_status.global == 'aborted') {
			clearInterval(status_interval);
			run.disabled = false;

			for (var key in server_status.jobs)
				if (server_status.jobs[key] != 'ended')
					server_status.jobs[key] = 'aborted'
		}

		// Update the GUI
		console.log(server_status);
		for (var idx in modules_div.children) {
			var element = modules_div.children[idx];
			if (element.tagName != 'DIV')
				continue;

			var divIdx = element.idx;

			// Remove previous class values
			var possible_status = ['running', 'ready', 'ended', 'aborted'];
			for (var sIdx in possible_status) {
				element.classList.remove(possible_status[sIdx]);
			}

			// Add the new status
			if (server_status.jobs[divIdx]) {
				element.classList.add(server_status.jobs[divIdx]);
				var status = element.getElementsByClassName('status')[0];
				status.innerHTML = server_status.jobs[divIdx];
			}

		}
	});
}

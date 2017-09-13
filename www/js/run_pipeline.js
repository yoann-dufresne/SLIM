
// --- Modules additions/deletions ---
var add_button = document.querySelector('#add_module');
var modules_div = document.querySelector('#modules');

add_button.onclick = function () {
	var modules_list = document.querySelector('#module_list');
	module_manager.createModule(modules_list.value, {});
};


// --- Pipeline execution ---
var run = document.querySelector('#start');

var get_config = () => {
	var config = {
		token:exec_token,
		mail: document.getElementById('mail').value
	};
	for (var idx in module_manager.modules) {
		var module = module_manager.modules[idx];

		config[module.id] = {
			name: module.name,
			params: module.getConfiguration()
		};
	}

	return config;
};

var status_interval;
run.onclick = function () {
	// Verify mail address
	let mail_value = document.getElementById('mail').value;
	if (mail_value.includes('@'))
		document.getElementById('warnings').innerHTML = '';
	else {
		document.getElementById('warnings').innerHTML = '<p>A valid mail address should be entered</p>';
		return;
	}

	// Get config
	var config = get_config();
	var file = new File([JSON.stringify(config)], "config.log", {
		type: "text/plain",
	});

	// Form
	var formData = new FormData();
	formData.append("config", file);
	formData.append("token", exec_token);

	// Request sender
	var request = new XMLHttpRequest();
	request.open("POST", "/run");
	request.send(formData);
	run.disabled = true;
	
	status_interval = setInterval(()=>{update_run_status(exec_token);}, 5000);
	update_run_status(exec_token);
};


// --- Status update ---

var update_run_status = (token, callback=(status)=>{}) => {
	$.get('/status?token=' + token).done((data) => {
		var server_status = JSON.parse(data);

		if (!server_status.global)
			return;

		// Stop the update when the run is over
		if (server_status.global == 'ended' || server_status.global == 'aborted') {
			clearInterval(status_interval);
			run.disabled = false;

			for (var key in server_status.jobs)
				if (!['ended', 'errors'].includes(server_status.jobs[key]))
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
			var possible_status = ['waiting', 'running', 'ready', 'ended', 'aborted', 'errors'];
			for (var sIdx in possible_status) {
				element.classList.remove(possible_status[sIdx]);
			}

			// Add the new status
			if (server_status.jobs[divIdx]) {
				element.classList.add(server_status.jobs[divIdx]);
				var status = element.getElementsByClassName('status')[0];
				status.innerHTML = server_status.jobs[divIdx];

				if (server_status.sub_jobs && server_status.sub_ended &&
						server_status.jobs[divIdx] == "running") {
					status.innerHTML += ' (' + server_status.sub_ended;
					status.innerHTML += '/' + server_status.sub_jobs + ')';
				}
			}
		}

		callback(server_status);
	});
}

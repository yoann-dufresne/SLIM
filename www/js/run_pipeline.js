
// --- Modules additions/deletions ---
var add_button = document.querySelector('#add_module');
var modules_div = document.querySelector('#modules');

add_button.onclick = function () {
	var modules_list = document.querySelector('#module_list');
	module_manager.createModule(modules_list.value, {});
};


// --- Pipeline execution ---
var run = document.querySelector('#start');
var mail_area = document.getElementById('mail');

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

mail_area.addEventListener("focusin", () => {
	if (mail_area.value == "Your email address") {
		mail_area.value = "";
	}
});
mail_area.addEventListener("focusout", () => {
	if (mail_area.value == "") {
		mail_area.value = "Your email address";
	}
});

var status_interval;
run.onclick = function () {
	// Verify mail address
	let mail_value = mail_area.value;
	if ((mail_value.length > 5 && mail_value.includes('@')) || mail_value == 'aaa')
		document.getElementsByClassName('gui_warnings')[1].innerHTML = '';
	else {
		document.getElementsByClassName('gui_warnings')[1].innerHTML = '<p>A valid mail address should be entered</p>';
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
	// Timeout added to wait for the server updated status
	setTimeout(() => {update_run_status(exec_token);}, 100);
};


// --- Status update ---

var update_run_status = (token, callback=(status)=>{}) => {
	let warnings_areas = document.getElementsByClassName("gui_warnings");

	$.get('/status?token=' + token).done((data) => {
		var server_status = JSON.parse(data);

		if (!server_status.global || !server_status.messages)
			return;

		// Print the messages from the server.
		msgs = "";
		for (let idx=0 ; idx<server_status.messages.length ; idx++) {
			let msg = server_status.messages[idx];
			msgs += '<p>' + msg + '</p>';
		}

		for (let idx=0 ; idx<warnings_areas.length ; idx++) {
			warnings_areas[idx].innerHTML = msgs;
		}

		// Stop the update when the run is over
		if (server_status.global == 'ended' || server_status.global == 'aborted') {
			clearInterval(status_interval);
			run.disabled = false;

			for (var key in server_status.jobs)
				if (!['ended', 'warnings'].includes(server_status.jobs[key]))
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
			var possible_status = ['waiting', 'running', 'ready', 'ended', 'aborted', 'warnings'];
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

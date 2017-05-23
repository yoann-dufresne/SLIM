
// --- Token managment ---
var exec_token = '';
$.get('/token_generation')
.done(function(data) {
	exec_token = data;
	console.log(data);
})


// --- Modules additions/deletions ---
var modules = [];
var add_button = document.querySelector('#add_module');
var modules_div = document.querySelector('#modules');
var modules_list = document.querySelector('#module_list');

var available_modules = [];
$.get("/softwares", function( data ) {
	available_modules = data;

	for (var idx in available_modules) {
		var opt = document.createElement('option');
		opt.innerHTML = available_modules[idx];
		opt.value = available_modules[idx];
		modules_list.appendChild(opt);
	}
});

add_button.onclick = function () {
	var mod;
	switch (modules_list.value) {
		case 'pandaseq':
			mod = new PandaseqModule();
			break;
		case 'demultiplexer':
			mod = new DemultiplexerModule();
			break;
	}

	modules.push(mod);
	modules_div.appendChild(mod.dom);
};


// --- Pipeline execution ---
var run = document.querySelector('#start');

var status_interval;
run.onclick = function () {
	var config = {token:exec_token};
	for (var idx in modules) {
		var module = modules[idx];

		config[module.id] = {
			name: module.name,
			params: module.getConfiguration()
		};
	}

	$.post( "/run", config)
	.done(function( data ) {
		console.log("Run ended");
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
		}

		// Update the GUI
		console.log(server_status);
		for (var idx in modules_div.children) {
			var element = modules_div.children[idx];
			if (element.tagName != 'DIV')
				continue;

			var divIdx = element.idx;

			// Remove previous class values
			var possible_status = ['running', 'ready', 'ended'];
			for (var sIdx in possible_status) {
				element.classList.remove(possible_status[sIdx]);
			}

			// Add the new status
			if (server_status.jobs[divIdx])
				element.classList.add(server_status.jobs[divIdx]);

		}
	});
}

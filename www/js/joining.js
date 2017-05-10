
var forward_list = document.querySelector("#forward_reads");
var reverse_list = document.querySelector("#reverse_reads");

// Fill the forward and reverse selector
new_file_listeners.push(function (e) {
	$.get("/list", function( data ) {
		forward_list.innerHTML = '';
		reverse_list.innerHTML = '';

		var filenames = data;
		if (filenames.length > 0) {
			for (var idx in filenames) {
				var opt = document.createElement("option");
				opt.value = filenames[idx];
				opt.innerHTML = filenames[idx];
				forward_list.appendChild(opt);

				opt = document.createElement("option");
				opt.value = filenames[idx];
				opt.innerHTML = filenames[idx];
				reverse_list.appendChild(opt);
			}
		}
	});
});


var button = document.querySelector("#up_submit");
var files_input = document.querySelector("#up_files");
var list = document.querySelector("#up_list");


var formData;
files_input.onchange = function (event) {
	files = event.target.files;
	
	if (files.length > 0){
		// One or more files selected, process the file upload

		// create a FormData object which will be sent as the data payload in the
		// AJAX request
		formData = new FormData();

		// loop through all the selected files
		for (var i = 0; i < files.length; i++) {
		  var file = files[i];

		  // add the files to formData object for the data payload
		  formData.append('uploads[]', file, file.name);
		}

	  }

}


button.onclick = function (event) {
	// Stop stuff happening
	event.stopPropagation();
	event.preventDefault();


	$.ajax({
		url: '/upload',
		type: 'POST',
		data: formData,
		cache:false,
		processData: false, // Don't process the files
		contentType: false, // Set content type to false as jQuery will tell the server its a query string request
		
		success: function(data, textStatus, jqXHR)
		{
			if(typeof data.error === 'undefined')
			{
				// Success so call function to process the form
				// submitForm(event, data);
				console.log('SUCCESS: ' + data.success);
				var event = new Event('new_file');
				document.dispatchEvent(event);
			}
			else
			{
				// Handle errors here
				console.log('ERRORS: ' + data.error);
			}
		},
		error: function(jqXHR, textStatus, errorThrown)
		{
			// Handle errors here
			console.log('ERRORS: ' + textStatus);
			// STOP LOADING SPINNER
		},

		xhr: function() {
			// create an XMLHttpRequest
			var xhr = new XMLHttpRequest();

			// listen to the 'progress' event
			xhr.upload.addEventListener('progress', function(evt) {

				if (evt.lengthComputable) {
					// calculate the percentage of upload completed
					var percentComplete = evt.loaded / evt.total;
					percentComplete = parseInt(percentComplete * 100);

					// update the Bootstrap progress bar with the new percentage
					$('.progress-bar').text(percentComplete + '%');
					$('.progress-bar').width(percentComplete + '%');

					// once the upload reaches 100%, set the progress bar text to done
					if (percentComplete === 100) {
						$('.progress-bar').html('Done');
					}
				}

			}, false);

			return xhr;
		}
	});
}

new_file_listeners.push(function (e) {
	$.get("/list", function( data ) {
		list.innerHTML = '';
		var filenames = data;

		if (filenames.length > 0) {
			list.innerHTML = '<p>Server file list</p>';
			var ul = document.createElement("ul");
			
			for (var idx in filenames) {
				var li = document.createElement("li");
				li.innerHTML = filenames[idx];
				ul.appendChild(li);
			}
			list.appendChild(ul);
		}
	});
});

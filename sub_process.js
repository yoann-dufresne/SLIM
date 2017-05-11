const exec = require('child_process').exec;



exports.listen_commands = function (app) {
	app.post('/run', function (req, res) {
		params = req.body;

		for (key in params) {
			var soft = params[key];

			console.log (soft.name);

			switch (soft.name) {
				case 'pandaseq':
					runPandaseq(soft.params, function (str) {
						res.send(str);
					});
			}
		}
	});
}

// TODO !!!!
// var exec = require('child_process').exec;
// var child = exec('node ./commands/server.js');
// child.stdout.on('data', function(data) {
//     console.log('stdout: ' + data);
// });
// child.stderr.on('data', function(data) {
//     console.log('stdout: ' + data);
// });
// child.on('close', function(code) {
//     console.log('closing code: ' + code);
// });

var runPandaseq = function (params, callback) {
	exec('/app/lib/pandaseq/pandaseq \
		-f /app/data/' + params.fwd + ' \
		-r /app/data/' + params.rev + ' \
		-w /app/data/tmp.txt',
	function (error, stdout, stderr) {
		callback('ended');
	});
}

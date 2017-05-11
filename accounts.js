const fs = require('fs');


export.token_generation = function (app) {
	app.use('/token_generation', function (req, res) {
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

		var token = '';
		for (var i=0 ; i<30 ; i++) {
			token += possible.charAt(Math.floor(Math.random() * possible.length));
		}

		res.send(token);
		fs.mkdir("/app/data/" + token);
	});
}

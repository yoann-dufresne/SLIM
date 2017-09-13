const fs = require('fs');


exports.tokens = {};

exports.token_generation = function (app) {
	app.get('/token_generation', function (req, res) {
		if ((!req.query.token) || (!fs.existsSync('/app/data/' + req.query.token))) {
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

			var token = '';
			for (var i=0 ; i<30 ; i++) {
				token += possible.charAt(Math.floor(Math.random() * possible.length));
			}

			fs.mkdir("/app/data/" + token, function(){res.send(token);});
			exports.tokens[token] = token;
		} else {
			res.send(req.query.token);
		}
	});
	
}

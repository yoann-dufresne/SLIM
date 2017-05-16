'use strict';

const express = require('express');
const pug = require('pug');
const bodyParser = require('body-parser')


// Pug webpages pre-compilation
const pipeline_GUI = pug.compileFile('/app/www/pipeline.pug');

// Constants
const PORT = 80;

// App
const app = express();
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.get('/', function (req, res) {
	res.send(pipeline_GUI());
});
app.use('/js', express.static('www/js'))
app.use('/css', express.static('www/css'))

app.use('/visu', express.static('/app/data'))
app.use('/softwares', express.static("www/pipeline_modules.json"))


app.listen(PORT);
console.log('Running on http://localhost:' + PORT);


// Accounts
const accounts = require('./accounts.js');
accounts.token_generation(app);

// Data exchanche
const filesIO = require("./files_upload.js");
filesIO.exposeDir(app);
filesIO.upload(app);

// Start job scheduler
const scheduler = require('./scheduler.js');
scheduler.start();
scheduler.listen_commands(app);
scheduler.expose_status(app);


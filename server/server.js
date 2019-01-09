'use strict';

var secured_server = false;

const express = require('express');
const pug = require('pug');
const bodyParser = require('body-parser')
const fs = require('fs');


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
app.use('/js', express.static('www/js'));
app.use('/css', express.static('www/css'));
app.use('/imgs', express.static('www/imgs'));
app.use('/modules', express.static('www/modules'));

app.use('/data', express.static('/app/data'));

// app.use('/softwares', express.static("www/pipeline_modules.json"));
const sub_process = require('./sub_process.js');
sub_process.expose_modules(app);
sub_process.expose_logs(app);

var server = null;
if (secured_server) {
  server = require('https');
  var certOptions = {
    key: fs.readFileSync('/app/ssl/server.key'),
    cert: fs.readFileSync('/app/ssl/server.crt')
  }

  server = server.createServer(certOptions, app);
} else {
  server = require('http');
  server = server.createServer(app);
}

server.listen(PORT);

console.log('Running on http(s)://localhost:' + PORT);


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


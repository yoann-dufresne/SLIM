'use strict';

const express = require('express');
const pug = require('pug');

// Pug webpages pre-compilation
const pipeline_GUI = pug.compileFile('/app/www/pipeline.pug');

// Constants
const PORT = 80;

// App
const app = express();
app.get('/', function (req, res) {
  res.send(pipeline_GUI());
});
app.use('/js', express.static('www/js'))
app.use('/css', express.static('www/css'))

app.use('/visu', express.static('data/tmp.txt'))
app.use('/softwares', express.static("www/pipeline_modules.json"))

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);



// Data exchanche
var filesIO = require("./files_upload.js");
filesIO.exposeDir(app);
filesIO.upload(app);

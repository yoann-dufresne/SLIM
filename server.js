'use strict';

const express = require('express');
const pug = require('pug');

// Pug webpages pre-compilation
const pipeline_GUI = pug.compileFile('/app/www/pipeline.pug');

// Constants
const PORT = 8080;

// App
const app = express();
app.get('/', function (req, res) {
  res.send(pipeline_GUI({name: 'Yoann'}));
});

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);

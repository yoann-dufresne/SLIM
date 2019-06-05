const Rexec = require('child_process').exec;
const fs = require('fs');
const tools = require('../toolbox');

exports.name = 'assignment-otu-IDTAXA';
exports.category = 'Assignment';
exports.multicore = true;

exports.run = function(os,config,callback){
  let token = os.token;
  let directory = '/app/data/' + token + '/';
  let filenameFasta = directory + config.params.inputs.fasta;
  let filenameOtu_table = directory + config.params.inputs.otu_table;
  let filenameClassifier = directory + config.params.inputs.classifier;
  let out_file = directory + config.params.outputs.assignIdTaxa;

  let threshold = config.params.params.threshold;
  let proc = os.cores;

  var command = ['/app/lib/R_scripts/otu-idtaxa.R',filenameFasta,filenameClassifier,out_file,threshold,proc,filenameOtu_table];

  var child = Rexec('Rscript '+command.join(' '));

  child.stdout.on('data', function(data) {
		console.log('STDOUT:' + data);
		fs.appendFileSync(directory + config.log, data);
	});
	child.stderr.on('data', function(data) {
		console.log('STDERR:' + data);
		fs.appendFileSync(directory + config.log, data);
	});

  child.on('close', (code) => {
		if (code != 0) {
			console.log("Error code " + code + " during IdTaxa");
			callback(os, code);
		} else {
			callback(os, null);
		}
	});

}

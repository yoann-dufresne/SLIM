const Rexec = require('child_process').exec;
const fs = require('fs');
const tools = require('../toolbox');

exports.name = 'DADA2';
exports.category = 'Clustering';
exports.multicore = true;

exports.run = function(os,config,callback){
  let token = os.token;
  let directory = '/app/data/' + token + '/';
  let tags = directory + config.params.inputs.tags;
  let fwd = config.params.inputs.fwd;
  let rev = config.params.inputs.rev;
  let by_lib = config.params.params.by_lib;
  let pool = config.params.params.pool;
  let asvs_seq = config.params.outputs.asvs_seq;
  let asvs_table = config.params.outputs.asvs_tab;
  let proc = os.cores;
  let stats = config.params.outputs.filter_stat;


  if (fwd == undefined && rev == undefined) {
    fwd = [];
    rev = [];

    let tagfilename = config.params.inputs.tags;
    tagfilename = tagfilename.substring(0, tagfilename.lastIndexOf('.'));

    for (let name in config.params.inputs) {
      if (name.startsWith(tagfilename)) {
        if (name.includes("fwd")) {
          fwd.push(config.params.inputs[name]);
        } else if (name.includes("rev")) {
          rev.push(config.params.inputs[name]);
        }
      }
    }
  } else {
    fwd = [fwd];
    rev = [rev];
  }

  fwd = fwd.join('£');
  rev = rev.join('£');

  var command = ['/app/lib/R_scripts/dada2.R',by_lib,tags,asvs_seq,asvs_table,token,proc,,stats,pool,fwd,rev];
  console.log('R command line:' + command.join(' '));

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
			console.log("Error code " + code + " during DADA2");
			callback(os, code);
		} else {
			callback(os, null);
		}
	});

}

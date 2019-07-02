class Dada2Module extends Module {
  constructor (params) {
  // lien de la doc
  super ("DADA2", "https://benjjneb.github.io/dada2/tutorial.html");

  this.params = params;
  }

  onLoad () {
    super.onLoad();
    // t2s
    let tags = this.dom.getElementsByClassName('input_file')[0];
    // fastq to be processed
    let fwd = this.dom.getElementsByClassName('input_file')[1].getElementsByTagName('fwd')[0];
    let rev = this.dom.getElementsByClassName('input_file')[2].getElementsByTagName('rev')[0];

    let rep_set = this.dom.getElementsByClassName('output_zone')[0].getElementsByTagName('input')[0];
    let asv_table = this.dom.getElementsByClassName('output_zone')[1].getElementsByTagName('input')[0];

  }
  getConfiguration () {
  let conf = super.getConfiguration();
  	// retieve the checked value of the radio html for trim_mode
  var radios = document.getElementsByName('by_lib');
  for (let i=0 ; i<radios.length ; i++)
  	if (radios[i].checked)
  		conf.params.by_lib = radios[i].value

  return conf;



  };
};

module_manager.moduleCreators['DADA2'] = (params) => {
  return new Dada2Module(params);
}

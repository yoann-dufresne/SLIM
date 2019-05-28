class AssignFastaIdTaxaModule extends Module {
  constructor (params) {
  // lien de la doc
  super ("assignment-fasta-IdTaxa", "http://www2.decipher.codes/Documentation/Documentation-ClassifySequences.html");

  this.params = params;
  }

  onLoad () {
    super.onLoad();

    let fasta = this.dom.getElementsByClassName('input_file')[0];
    let classifier = this.dom.getElementsByClassName('input_file')[1];
    let assignIdTaxa = this.dom.getElementsByClassName('output_zone')[0].getElementsByTagName('input')[0];

    let threshold = this.dom.getElementsByClassName('param_value')[0];

    fasta.onchange = () => {
      assignIdTaxa.value = fasta.value.substr(0,fasta.value.lastIndexOf('.'))+ '_assigned-idtaxa.tsv';
      assignIdTaxa.onchange();
    };
  }
};

module_manager.moduleCreators['assignment-fasta-IdTaxa'] = (params) => {
  return new AssignFastaIdTaxaModule(params);
}

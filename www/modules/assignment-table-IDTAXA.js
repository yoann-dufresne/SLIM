class AssignOtuIdTaxaModule extends Module {
  constructor (params) {
  // lien de la doc
  super ("assignment-table-IDTAXA", "https://github.com/trtcrd/SLIM/wiki/OTU---IDTAXA-classifier");

  this.params = params;
  }

  onLoad () {
    super.onLoad();

    let classifier = this.dom.getElementsByClassName('input_file')[0];
    let fasta = this.dom.getElementsByClassName('input_file')[1];
    let otu_table = this.dom.getElementsByClassName('input_file')[2];
    let assignIdTaxa = this.dom.getElementsByClassName('output_zone')[0].getElementsByTagName('input')[0];

    let threshold = this.dom.getElementsByClassName('param_value')[0];

    otu_table.onchange = () => {
      assignIdTaxa.value = otu_table.value.substr(0,otu_table.value.lastIndexOf('.'))+ '_assigned-idtaxa.tsv';
      assignIdTaxa.onchange();
    };
  }
};

module_manager.moduleCreators['assignment-table-IDTAXA'] = (params) => {
  return new AssignOtuIdTaxaModule(params);
}

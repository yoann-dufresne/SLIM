const fs = require('fs');
const lineReader = require('line-reader');


exports.assignment_to_otu_matrix = (assignments, matrix_in, matrix_out, threshold, callback) => {
	// Create output file and header
	fs.closeSync(fs.openSync(matrix_out, 'w'));

	lineReader.eachLine(matrix_in, function(line, last) {
		// Header
		if (line.startsWith('OTU')) {
			fs.appendFileSync(matrix_out, line + '\ttaxon\tmean identity\tref ids\n');
			return;
		} else if (line != '') {
			let split = line.split('\t');
			let cluster = split[0];

			if (assignments[cluster]) {
				let cons = consensus(assignments[cluster], threshold);
				fs.appendFile(matrix_out, line + '\t' + cons.taxon + '\t'
						+ cons.identity + '\t' + cons.ids.join(";") + '\n', ()=>{});
			} else {
				fs.appendFile(matrix_out, line + '\t\t0\t\n', ()=>{});
			}
		}

		if (last) {
			callback(null);
		}
	});
};


var consensus = (taxa, threshold) => {
	if (taxa.length == 0)
		return {taxon:'unassigned', identity:0, ids:[]};

	let used_taxa = taxa;
	let max_sim = 0;

	// Taxa filtering with direct acceptance
	for (let idx=0 ; idx<taxa.length ; idx++) {
		let taxon = taxa[idx];

		// Over the direct acceptance threshold
		if (taxon.similarity >= threshold) {
			// First to be over the threshold
			if (max_sim < taxon.similarity) {
				max_sim = taxon.similarity;
				used_taxa = [taxon];
			// Equals the maximum
			} else if (taxon.similarity == max_sim) {
				used_taxa.push(taxon);
			}
		}
	}

	// Create consensus taxonomy
	let detailed_taxa = used_taxa.map ((elem) => {return elem.taxon.split(';');});
	let mean = used_taxa.map((elem) => {return elem.similarity;})
		.reduce((sum, val) => {return sum + val}, 0)
		/ used_taxa.length;
	let ids = used_taxa.map((elem) => {return elem.sequence_id});

	// Taxo consensus
	let cons = used_taxa[0].taxon;
	if (used_taxa.length != 1)
		cons = taxo_consensus (detailed_taxa);

	return {taxon: cons, identity: mean, ids: ids};
};


var taxo_consensus = (detailed_taxa) => {
	let cons = '';
	let tax_id = 0;
	while (true) {
		// Reference taxon
		let taxon = detailed_taxa[0][tax_id];
		for (let idx=1 ; idx<detailed_taxa.length ; idx++) {
			// Verify the taxon for each assignment
			if (taxon != detailed_taxa[idx][tax_id])
				return cons.substr(1);
		}

		if (taxon == undefined || taxon == '')
			return cons.substr(1);

		cons += ';' + taxon;
		tax_id++;
	}
};

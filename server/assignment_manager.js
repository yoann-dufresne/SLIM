const fs = require('fs');
const lineReader = require('line-reader');


exports.assignment_to_otu_matrix = (assignments, matrix_in, matrix_out, threshold, callback) => {
	// Create output file and header
	fs.closeSync(fs.openSync(matrix_out, 'w'));

	lineReader.eachLine(matrix_in, function(line, last) {
		// Header
		if (line.startsWith('OTU')) {
			fs.appendFileSync(matrix_out, line + '\ttaxon\n');
			return;
		} else if (line != '') {
			let split = line.split('\t');
			let cluster = split[0];

			let cons = consensus(assignments[cluster], threshold);
			fs.appendFile(matrix_out, line + '\t' + cons + '\n', ()=>{});
		}

		if (last) {
			callback();
		}
	});

	let line_idx = 0;
};


var consensus = (taxa, threshold) => {
	if (taxa.length == 0)
		return 'unassigned';

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

	// Only one taxon remaining
	if (used_taxa.length == 1)
		return used_taxa[0].taxon;

	// Create consensus taxonomy
	detailed_taxa = taxa.map ((elem) => {return elem.taxon.split(';');});

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

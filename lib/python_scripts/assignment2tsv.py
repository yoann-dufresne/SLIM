import sys
from Bio import SeqIO

def read_uc(uc_filename, clusters=None):
	annotations = {}
	# headers: ['type', 'idx', 'length', 'similarity', 'orientation', 'nuy1', 'nuy2', 'compact', 'name', 'hit']

	with open(uc_filename) as fp:
		for line in fp:
			type, _, _, similarity, _, _, _, _, name, hit = line.strip().split("\t")

			if clusters != None:
				name = clusters[name]

			if not name in annotations:
				annotations[name] = []

			if type != "N":
				annotations[name].append({
					"similarity": (float(similarity) / 100.0),
					"sequence_id": hit[:hit.find(' ')],
					"taxon": hit[hit.find(' ')+1:]
				})

	return annotations



def to_tsv(uc_filename, outfile, consensus_threshold):
	annotations = read_uc(uc_filename)

	print("Write in {}".format(outfile))

	with open(outfile, "w") as fw:
		# Write the header
		fw.write("sequence\ttaxon\tmean similarity\treference ids\n")

		# List all the annotations
		for id, annotation in annotations.items():
			# Make a consensus taxonomy
			cons = consensus(annotation, consensus_threshold)
			# Write the outfile
			fw.write("{}\t{}\t{}\t{}\n".format(id, cons["taxon"], cons["identity"], ";".join(cons["ids"])));


def to_otu(uc_filename, outfile, consensus_threshold, otu_matrix, fasta_filename):
	clusters = fasta2cluster(fasta_filename)
	annotations = read_uc(uc_filename, clusters)
	# Normaly, no need for that ! VERIFICATION NEEDED §§ annotations = reads2clusters(annotations)

	with open(outfile, "w") as fw, open(otu_matrix) as fr:
		# Write the header
		header = fr.readline().strip()
		fw.write("{}\ttaxon\tmean identity\tref ids\n".format(header))

		# List all the otus
		for line in fr:
			line = line.strip()
			id = line[:line.find("\t")]
			annotation = annotations[id]
		# for id, annotation in annotations.items():
			# Make a consensus taxonomy
			cons = consensus(annotation, consensus_threshold)
			# Write the outfile
			fw.write("{}\t{}\t{}\t{}\n".format(line, cons["taxon"], cons["identity"], ";".join(cons["ids"])));



def consensus (taxa, threshold):
	if len(taxa) == 0:
		return {"taxon":"unassigned", "identity":0, "ids":[]}

	used_taxa = taxa
	max_sim = 0

	# Taxa filtering with direct acceptance
	for taxon in taxa:
		# Over the direct acceptance threshold
		if taxon["similarity"] >= threshold:
			# First to be over the threshold
			if max_sim < taxon["similarity"]:
				max_sim = taxon["similarity"]
				used_taxa = [taxon]
			# Equals the maximum
			elif taxon["similarity"] == max_sim:
				used_taxa.append(taxon)


	# Create consensus taxonomy
	detailed_taxa = [taxon["taxon"].split(";") for taxon in used_taxa]
	mean = sum([float(taxon["similarity"]) for taxon in used_taxa]) / len(used_taxa)
	ids = [taxon["sequence_id"] for taxon in used_taxa]

	# Taxo consensus
	cons = used_taxa[0]["taxon"]
	if len(used_taxa) != 1:
		cons = taxo_consensus (detailed_taxa)

	return {"taxon": cons, "identity": mean, "ids": ids}


def taxo_consensus (detailed_taxa):
	cons = '';
	tax_id = 0;
	while tax_id < len(detailed_taxa[0]):
		# Reference taxon
		taxon = detailed_taxa[0][tax_id]
		for idx in range(1, len(detailed_taxa)):
			# Verify the taxon for each assignment
			if taxon != detailed_taxa[idx][tax_id]:
				return cons[1:]

		if ((not taxon) or taxon == ''):
			break

		cons += ';' + taxon
		tax_id += 1

	return cons[1:]


def fasta2cluster (fasta_filename):
	clusters = {}

	for cluster_id, record in enumerate(SeqIO.parse(fasta_filename, "fasta")):
		header = record.description

		if "cluster=" in header:
			cluster_id = header.split("cluster=")[1].split(";")[0]
		else:
			cluster_id = header.split(";")[0]

		clusters[header] = cluster_id

	return clusters



if "__main__" == __name__:
	# Arguments parsing
	function = None
	uc_filename = ""
	consensus_threshold = 0
	outfile = ""
	fasta_filename = ""
	otu_in = ""

	for idx in range(len(sys.argv)):
		if sys.argv[idx] == '-out':
			outfile = sys.argv[idx+1]
			idx += 1
		elif sys.argv[idx] == "-uc":
			uc_filename = sys.argv[idx+1]
			idx += 1
		elif sys.argv[idx] == "-threshold":
			consensus_threshold = float(sys.argv[idx+1])
			idx += 1
		elif sys.argv[idx] == "-fasta":
			fasta_filename = sys.argv[idx+1]
			idx += 1
		elif sys.argv[idx] == "-otu_in":
			otu_in = sys.argv[idx+1]
			idx += 1

	if otu_in == "" or fasta_filename == "":
		to_tsv(uc_filename, outfile, consensus_threshold)
	else:
		to_otu(uc_filename, outfile, consensus_threshold, otu_in, fasta_filename)
	exit(0)

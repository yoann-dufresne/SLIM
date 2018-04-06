#### Rename the header of the rep-set fasta into OTU_ID for producing a pariwise match list 

import argparse
from Bio import SeqIO


def main():
	parser = argparse.ArgumentParser()
	parser.add_argument('--input', '-i', required=True, help='input fasta to rename')
	parser.add_argument('--output', '-o', required=False, help='output for LULU, keep only OTU_ID')
	# parser.add_argument('--output_rep_set', '-or', required=False, help='output as representative, >OTU_ID;ISU_ID;size=')
	args = parser.parse_args()

	# the order of the rep set follows the number of the otu table in the first column (not necessarly the order, proven after taxonomic assignment)
	cpt = 0

	# prepare the output for rep_set
	# rs = open(str(args.output_rep_set), w)

	with open(str(args.output), 'w') as fw:
		for record in SeqIO.parse(args.input, "fasta"):
			if args.input and args.output != "": # and args.output_rep_set == "":
				fw.write('>' + str(cpt) + '\n')
				fw.write(str(record.seq + '\n'))
				cpt += 1
			#elif args.input and args.output == "" and args.output_rep_set != "":
			#	rs.write('>OTU' + str(cpt) + "_" + record.description + '\n')
			#	rs.write(str(record.seq + '\n'))
			#	cpt += 1
			else:
				print("\nWrong argument given for trim position\n")
				parser.print_help()
				exit(1)


if __name__ == "__main__":
	main()
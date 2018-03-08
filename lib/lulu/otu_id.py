#### Rename the header of the rep-set fasta into OTU_ID for producing a pariwise match list 

import argparse
from Bio import SeqIO


def main():
	parser = argparse.ArgumentParser()
	parser.add_argument('--input', '-i', required=True, help='input fasta to rename')
	parser.add_argument('--output', '-o', required=True, help='output')
	args = parser.parse_args()

	# the order of the rep set follows the order of the otu table
	cpt = 0

	with open(str(args.output), 'w') as fw:
		for record in SeqIO.parse(args.input, "fasta"):
			if args.input and args.output != "":
				fw.write('>' + str(cpt) + '\n')
				fw.write(str(record.seq + '\n'))
				cpt += 1
			else:
				print("\nWrong argument given for trim position\n")
				parser.print_help()
				exit(1)


if __name__ == "__main__":
	main()
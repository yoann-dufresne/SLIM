### Rename the header of the rep-set fasta into OTU_ID for producing a pariwise match list

import argparse
from Bio import SeqIO


def main():
	parser = argparse.ArgumentParser()
	parser.add_argument('--input', '-i', required=True, help='input fasta to rename')
	parser.add_argument('--output', '-o', required=False, help='output for LULU, keep only OTU_ID')
	# parser.add_argument('--output_rep_set', '-or', required=False, help='output as representative, >OTU_ID;ISU_ID;size=')
	args = parser.parse_args()

	with open(str(args.output), 'w') as fw:
		for record in SeqIO.parse(args.input, "fasta"):
			if args.input and args.output != "": # and args.output_rep_set == "":
				fw.write('>' + record.description.split("cluster=")[1].split(";")[0] + '\n')
				fw.write(str(record.seq + '\n'))
				cpt += 1

			else:
				print("\nWrong argument given for trim position\n")
				parser.print_help()
				exit(1)


if __name__ == "__main__":
	main()

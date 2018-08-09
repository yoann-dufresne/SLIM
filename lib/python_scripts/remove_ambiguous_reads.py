#### Remove reads containing an ambiguous nucleotides 


import argparse
from Bio import SeqIO


def main():
	parser = argparse.ArgumentParser()
	parser.add_argument('--input', '-i', required=True, help='input fasta to filter')
	parser.add_argument('--output', '-o', required=True, help='output fasta without N')
	args = parser.parse_args()

	with open(str(args.output), 'w') as fw:
		for record in SeqIO.parse(args.input, "fasta"):
			if args.input and args.output != "": 
				if float(record.seq.count("N"))>0:
					continue
				else:
					fw.write('>' + record.description + '\n')
					fw.write(str(record.seq + '\n'))
			else:
				print("\nWrong argument given\n")
				parser.print_help()
				exit(1)


if __name__ == "__main__":
	main()





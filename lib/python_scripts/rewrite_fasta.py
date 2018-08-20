import sys
from Bio import SeqIO


def main():
	# arguments reader
	args = {}
	for idx, arg in enumerate(sys.argv):
		if arg[0] == "-":
			args[arg] = sys.argv[idx+1]

	# Error if no fasta
	if not ("-fasta_in" in args and "-fasta_out" in args):
		print("IO fasta files must be passed as input using -fasta_in and -fasta_out", file=sys.stderr)
		exit(1)

	with open(args["-fasta_out"], "w") as fw:
		for idx, record in enumerate(SeqIO.parse(args["-fasta_in"], "fasta")):
			# Get full name
			name = record.description

			# Concatenate with new 
			if name[-1] != ';':
				name += ';'
			name = "{}cluster=OTU{};".format(name, idx)

			# Output the sequences in a new fasta
			fw.write(">{}\n{}\n".format(name, record.seq))


if __name__ == "__main__":
	main()
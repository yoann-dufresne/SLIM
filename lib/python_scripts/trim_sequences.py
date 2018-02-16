#### Triming sequences based on a particular motif

import argparse
from Bio import SeqIO


def trim_before(motif, seq):
	idx = seq.find(motif)
	
	# if motif is not found 
	if idx == -1:
		return seq
	
	# if motif is found
	return seq[idx+len(motif):]
	

def trim_after(motif, seq):
	idx = seq.find(motif)
	
	# if motif is not found 
	if idx == -1:
		return seq
	
	# if motif is found
	return seq[:idx]


def trim_motif(motif, seq):
	return trim_after(motif, seq) + trim_before(motif, seq)


def main():
	parser = argparse.ArgumentParser()
	parser.add_argument('--trim_mode', '-tp', required=True, help='what to trim, before / after the motif, or remove the motif itself. Possible values: before, after, motif')
	parser.add_argument('--fasta', '-f', required=True, help='the fasta containing the sequences to be trimmed with the motif')
	parser.add_argument('--motif', '-m', required=True, help='the motif to search in the sequence')
	parser.add_argument('--output', '-o', required=True, help='output fasta filename')
	args = parser.parse_args()
	
	with open(str(args.output), 'w') as fw:
		for record in SeqIO.parse(args.fasta, "fasta"):
			fw.write('>' + record.description + '\n')
			if args.trim_mode == "before":
				fw.write(str(trim_before(args.motif, record.seq) + '\n'))
			elif args.trim_mode == "after":
				fw.write(str(trim_after(args.motif, record.seq) + '\n'))
			elif args.trim_mode == "motif":
				fw.write(str(trim_motif(args.motif, record.seq) + '\n'))
			else:
				print("\nWrong argument given for trim position\n")
				parser.print_help()
				exit(1)


if __name__ == "__main__":
	main()






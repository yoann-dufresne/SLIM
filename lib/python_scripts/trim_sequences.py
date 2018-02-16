#### Triming sequences based on a particular motif

import argparse

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
	parser.add_argument('--trim_position', '-tp', help='what to trim, before / after the motif, or remove the motif itself. Possible values: before, after, motif')
	parser.add_argument('--sequence', '-s', help='the sequence to search motif in')
	parser.add_argument('motifs', type=str, nargs='+',help='a list of motif(s) to search for in the sequence')
	args = parser.parse_args()
	
	for motif in args.motifs:
		if args.trim_position == "before":
			print(trim_before(motif, args.sequence))
		elif args.trim_position == "after":
			print(trim_after(motif, args.sequence))
		elif args.trim_position == "motif":
			print(trim_motif(motif, args.sequence))
		else:
			print("\nWrong argument given for trim position\n")
			parser.print_help()
	
	

if __name__ == "__main__":
	main()






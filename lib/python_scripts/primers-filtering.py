#### Discarding reads that still contain primers

import argparse
from Bio import SeqIO

def noPrimers(fastq, match):
	for k in fastq:
		id = k.id
		tmp = id.split(";")[0]
		if id != "*":
			if tmp not in match:
				yield k

def main():
	parser = argparse.ArgumentParser()
	parser.add_argument('--fastqR1', '-r1', required=True, help='the R1 (or fwd) fastq containing the sequences to be checked if on of the primer remained')
	parser.add_argument('--fastqR2', '-r2', required=True, help='the R2 (or rev)fastq containing the sequences to be checked if on of the primer remained')
	parser.add_argument('--primersR1', '-p1', required=True, help='the list of primers match on match using vsearch ')
	parser.add_argument('--primersR2', '-p2', required=True, help='the list of primers match on match using vsearch ')
	parser.add_argument('--outR1', '-o1', required=True, help='the filtered fastq files')
	parser.add_argument('--outR2', '-o2', required=True, help='the filtered fastq files')
	args = parser.parse_args()

	# import both match files
	ref_fwd=open(args.primersR1,'r')
	list_fwd = [i.split()[9] for i in ref_fwd]
	list_fwd = set(list_fwd)
	ref_rev=open(args.primersR2,'r')
	list_rev = [j.split()[9] for j in ref_rev]
	list_rev = set(list_rev)
	# concatenate the reads that had match
	list_match = list_fwd.union(list_rev)
	# parse the input fastq
	fast_fwd = SeqIO.parse(args.fastqR1, "fastq")
	fast_rev = SeqIO.parse(args.fastqR2, "fastq")
	# prep output
	R1=open(args.outR1,'w')
	R2=open(args.outR2,'w')
	# exports
	SeqIO.write(noPrimers(fast_fwd,list_match), R1, "fastq")
	SeqIO.write(noPrimers(fast_rev,list_match), R2, "fastq")


if __name__ == "__main__":
	main()

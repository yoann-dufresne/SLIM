#!/usr/bin/env python3
import sys
import os.path
from Bio import SeqIO


def main (inputs, output, origins_file):
	origins = {}
	names = {}
	next_id = 0

	# Parse the fasta files
	for input in inputs:
		# Verify file existance
		if not os.path.isfile(input):
			print('input is not a file')
			exit(1)

		sample_name = input[input.rfind('/')+1:input.rfind('.')]
		print(sample_name)

		# Read all the sequence in the input file to paste them in the output
		for seq_record in SeqIO.parse(input, "fasta"):
			# Create the ISU name
			if not seq_record.seq in names:
				names[seq_record.seq] = next_id
				origins[next_id] = {}
				next_id += 1
			name = names[seq_record.seq]

			# Save the ISU counts
			prev = origins[name][sample_name] if sample_name in origins[name] else 0
			size = 1
			if ';size=' in seq_record.id:
				size = seq_record.id[seq_record.id.find(';size=')+6:]
				if size.find(';') != -1:
					size = int(size[:size.find(';')])
				else:
					size = int(size.strip())
			origins[name][sample_name] = prev + size

	# Save the outputs
	with open(output, 'w') as out, open(origins_file, 'w') as orip:
		for seq in names:
			name = names[seq]
			
			# Write the origin file
			total = 0
			line = ''
			for sample_name in origins[name]:
				line = '{}\t{};size={}'.format(line, sample_name, origins[name][sample_name])
				total += origins[name][sample_name]
			orip.write('ISU_{};size={}{}\n'.format(name, total, line))

			# Write the fasta
			two_lines = '>ISU_{};size={}\n{}\n'.format(name, total, seq)
			out.write(two_lines)



if __name__ == '__main__':
	# Arguments parsing
	inputs = []
	output = 'merged.fasta'
	origins = 'origins.tsv'

	for idx in range(len(sys.argv)):
		if sys.argv[idx] == '-out':
			output = sys.argv[idx+1]
		elif sys.argv[idx] == '-ori':
			origins = sys.argv[idx+1]
		elif idx != 0 and sys.argv[idx-1][0] != '-':
			inputs.append(sys.argv[idx])

	main(inputs, output, origins)
	exit(0)

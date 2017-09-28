#!/usr/bin/env python3
import sys
from Bio import SeqIO


def main (threshold, matrix, centroids, reads):
	# Matrix
	filtered_clusters = filter_matrix(matrix, threshold)

	# Centroids
	if centroids != '':
		filter_centroids(centroids, filtered_clusters)


def filter_matrix (file, threshold):
	idx = file.rfind('.')
	output = '{}_filtered_{}.tsv'.format(file[0:idx-1], threshold)

	with open(file) as fp, open(output, 'w') as out:
		# Write header
		out.write(fp.readline())

		# Filter
		filtered_clusters = []
		for line in fp:
			# Parse line
			values = [int(val) for val in line.split('\t')]
			id = values[0]
			values = values[1:]
			s = sum(values)

			# Rewrite only if over or equals to the threshold
			if s < threshold:
				filtered_clusters.append(id)
			else:
				out.write(line)

		return filtered_clusters


def filter_centroids (filename, filtered_clusters):
	for idx, seq_record in enumerate(SeqIO.parse(filename, "fasta")):
		if len(filetered_clusters) == 0 or filtered_clusters[0] != idx:
			out.write('>{}\n{}\n'.format(seq_record.id, seq_record.seq))
		else:
			filtered_clusters = filetered_clusters[1:]


if __name__ == '__main__':
	# Arguments parsing
	matrix = ""
	centroids = ""
	reads = ""

	for idx in range(len(sys.argv)):
		if sys.argv[idx] == '-m':
			matrix = sys.argv[idx+1]
		elif sys.argv[idx] == '-c':
			centroids = sys.argv[idx+1]
		elif sys.argv[idx] == '-r':
			reads = sys.argv[idx+1]
		elif sys.argv[idx] == '-t':
			threshold = int(sys.argv[idx+1])

	main(threshold, matrix, centroids, reads)
	exit(0)

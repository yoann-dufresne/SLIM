#!/usr/bin/env python3
import sys
from Bio import SeqIO


def main (threshold, matrix, centroids, reads):
	# Matrix
	filtered_clusters = filter_matrix(matrix, threshold)

	# Centroids
	if centroids != '':
		filter_centroids(centroids, filtered_clusters, threshold)

	# reads
	if reads != '':
		filter_reads(reads, filtered_clusters, threshold)


def filter_matrix (file, threshold):
	print('Filter matrix')

	idx = file.rfind('.')
	output = '{}_filtered_{}.tsv'.format(file[0:idx], threshold)

	with open(file) as fp, open(output, 'w') as out:
		# Write header
		out.write(fp.readline())

		# Filter
		filtered_clusters = []
		for line in fp:
			# Parse line
			values = line.strip().split('\t')
			# values = [int(val) for val in line.strip().split('\t') if val.isdigit()]
			id = values[0]
			values = [int(val) for val in line.strip().split('\t')[1:] if val.isdigit()]
			#values = values_int[1:]
			s = sum(values)

			# Rewrite only if over or equals to the threshold
			if s < threshold:
				filtered_clusters.append(id)
			else:
				out.write(line)

		return frozenset(filtered_clusters)


def filter_centroids (filename, filtered_clusters, threshold):
	print('Filter the OTU centroids')

	idx = filename.rfind('.')
	output = '{}_filtered_{}.fasta'.format(filename[0:idx], threshold)

	with open(output, 'w') as out:
		for idx, seq_record in enumerate(SeqIO.parse(filename, "fasta")):
			idx = str('OTU'+str(idx))
			if not idx in filtered_clusters:
				#if 'cluster=' in seq_record.id:
				out.write('>{}\n{}\n'.format(seq_record.id, seq_record.seq))
				#else:
					#out.write('>{};cluster={};\n{}\n'.format(seq_record.id, idx, seq_record.seq))


def filter_reads (filename, filtered_clusters, threshold):
	print('filter the clusterized reads')

	filtered_clusters = filtered_clusters

	idx = filename.rfind('.')
	output = '{}_filtered_{}.fasta'.format(filename[0:idx], threshold)

	with open(output, 'w') as out:
		for seq_record in SeqIO.parse(filename, "fasta"):
			# Parse the cluster id
			cluster = seq_record.id
			cluster = cluster[cluster.find(';cluster=')+9:]
			cluster = int(cluster[:cluster.find(';')])
			cluster = str('OTU'+str(cluster))

			# Rewrite if cluster is not filtered
			if not cluster in filtered_clusters:
				out.write('>{}\n{}\n'.format(seq_record.id, seq_record.seq))


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

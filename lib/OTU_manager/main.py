import sys



def read_uc (filename, origins):
	# Init
	true_clusters = []
	clusters = {}
	
	# File reading
	with open(filename) as fp:
		for line in fp:
			# Line reading
			split = line.strip().split("\t")
			line_type, cluster_id, _, _, _, _, _, _, read_name, _ = split
			cluster_id = int(cluster_id)

			if line_type == 'C':
				true_clusters.append(cluster_id)
				continue

			# Matrix construction
			if not cluster_id in clusters:
				clusters[cluster_id] = {}
			
			# add values in origins
			for origin in origins[read_name]:
				if not origin in clusters[cluster_id]:
					clusters[cluster_id][origin] = 0

				clusters[cluster_id][origin] += origins[read_name][origin]

	# define the true matrix
	matrix = []
	true_clusters.sort()
	for idx in true_clusters:
		matrix.append(clusters[idx])

	return matrix


def read_origins (filename):
	origins = {}
	experiments = {}

	with open(filename) as fp:
		for line in fp:
			# Line reading
			split = line.strip().split("\t")
			idx = split[0]

			# Fill the origin matrix
			origins[idx] = {}
			for name in split[1:]:
				abundance = int(name.split(";size=")[1].split(';')[0])
				name = name.split(';')[0]
				origins[idx][name] = abundance
				experiments[name] = 0;

	return origins, list(experiments.keys())


def read_t2s (filename, true_names):
	order = []
	with open(filename) as fp:
		isHeader = True
		header = {}

		for line in fp:
			split = line.strip().split(',')

			# Reade the header
			if isHeader:
				for idx in range(len(split)):
					header[split[idx]] = idx
				isHeader = False
				continue

			# Read the experiments
			library = split[header['run']]
			sample = split[header['sample']]
			dst = library + '_' + sample

			brut_name = ""
			for name in true_names:
				if name.startswith(dst):
					brut_name = name
					break

			order.append({"src":brut_name, "dst":dst})

	return order


def print_otus (matrix, order):
	# Print the header
	print('OTU', end='')
	for sample in order:
		print('\t' + sample["dst"], end='')
	print()

	for idx in range(len(matrix)):
		# Print the cluster id
		print(idx, end='')
		
		# Print the values for each experiment
		for sample in order:
			if sample["src"] in matrix[idx]:
				print('\t' + str(matrix[idx][sample["src"]]), end='')
			else:
				print('\t0', end='')

		# New cluster
		print()


def main ():
	origins, experiments = read_origins (sys.argv[2])
	matrix = read_uc(sys.argv[1], origins)

	# Compute the basic order
	order = list(experiments)
	for idx in range(len(order)):
		order[idx] = {"src":order[idx], "dst":order[idx]}

	# get order from t2s
	if len(sys.argv) > 3:
		order = read_t2s(sys.argv[3], list(experiments))

	print_otus(matrix, order)


if __name__ == '__main__':
	# Error case
	if len(sys.argv) == 1:
		print('No filename found')
		exit(1)

	main()

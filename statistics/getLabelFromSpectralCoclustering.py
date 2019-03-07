####################################################################################
# Program to open a '.ncol' file and, with a user defined label, calculate and     #
# write a 'predictedVector' file, containing label values for each node.           #
# Author: Diego Silva Cintra                                                       #
# Date: 06 March 2019                                                              #
####################################################################################
import argparse
import json
import os
import numpy as np
from getAdjacencyMatrix import *
from sklearn.cluster.bicluster import SpectralCoclustering


# @desc Use SpectralBiclustering from scikit learn package to calculate clusters for given graph.
# @param {str} file .ncol file representing uncoarsened bipartite graph.
# @paran {str} label Label from bipartite graph to use as class.
# @param {int} side Which layer from bipartite graph to output labels - 0 for first, 1 for second, 2 for both.
# @param {tuple} vertices Tuple containing number of vertices for each layer of bipartite graph.
# @param {int} clusters Number of clusters.
# @param {str} output .txt filename output (just the name with no extension).
def getLabelFromSpectralCoclustering(file, label, side, vertices, clusters, output):
	# Step 1 - Initialize spectral co-clustering parameters #
	clustering = SpectralCoclustering(n_clusters=clusters, svd_method='arpack')
	# Step 2 - Get adjacency matrix and run coclustering #
	adjacencyMatrix = getAdjacencyMatrix(file, vertices)
	print("Running Coclustering algorithm for input graph.")
	results = clustering.fit(np.asarray(adjacencyMatrix))
	rows = []
	cols = []
	for el in results.row_labels_:
		rows.append(el)
	# Step 3 - Write out results to a vector containing labels #
	outputFile = open(output + '.txt', 'w')
	if(side == 0):
		outputFile.write(str(rows[:vertices[0]]))
		# outputFile.write(results.row_labels_)
	elif(side == 1):
		outputFile.write(str(rows[vertices[0]:]))
		# outputFile.write(results.column_labels_)
	else:
		outputFile.write(str(rows))
		# outputFile.write(results.row_labels_ + results.column_labels_)
	outputFile.close()



if __name__ == "__main__":
	# Instantiate argument parser
    description = 'Program to open a \'.ncol\' file and, with a user defined label, calculate and write a \'predictedVector\' file, containing label values for each node.'
    parser = argparse.ArgumentParser(description=description)
    parser._action_groups.pop()

    # Add argument group (required)
    required = parser.add_argument_group('required arguments')
    required.add_argument('-f', '--file', required=True, dest='file', action='store', type=str, default=None, help='.ncol file representing uncoarsened bipartite graph.')
    required.add_argument('-l', '--label', required=True, dest='label', action='store', type=str, default=None, help='Label from bipartite graph to use as class.')
    required.add_argument('-s', '--side', required=True, dest='side', action='store', type=int, default=None, help='Which layer from bipartite graph to output labels - 0 for first, 1 for second, 2 for both.')
    required.add_argument('-v', '--vertices', required=True, dest='vertices', action='store', nargs="+", type=int, metavar=('int', 'int'), default=None, help='Number of vertices for each layer of uncoarsened bipartite graph.')
    required.add_argument('-c', '--clusters', required=True, dest='clusters', action='store', type=int, default=None, help='Number of clusters.')

    # Add argument group (optional)
    optional = parser.add_argument_group('optional arguments')
    optional.add_argument('-o', '--output', required=False, dest='output', action='store', default='output', help='.txt filename output (just the name with no extension).')

    # Run parser
    options = parser.parse_args()

    getLabelFromSpectralCoclustering(options.file, options.label, options.side, options.vertices, options.clusters, options.output)
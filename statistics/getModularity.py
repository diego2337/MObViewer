####################################################################################
# Calculate modularity for a bipartite graph, given its 'predicted' labels after   #
# executing a cluster algorithm.                 								   #
# Author: Diego Silva Cintra                                                       #
# Date: 06 March 2019                                                              #
####################################################################################
import argparse
import json
import os
import igraph
from getNMI import *
from getAdjacencyMatrix import *

# @desc Get modularity of bipartite graph, given its true and predicted labels.
# @param {str} file .ncol file to be read.
# @param {tuple} vertices Tuple containing number of vertices for each layer of bipartite graph.
# @param {int} side Which layer from bipartite graph to output labels - 0 for first, 1 for second, 2 for both.
# @param {str} predicted .txt file containing vector with correct labels for clustered graph.
# @returns {float} Modularity.
def getModularity(file, vertices, side, predicted):
	# Step 1 - Open file and load to array #
	predictedFile = open(predicted, 'r')
	predictedArr = listToString(str(predictedFile.readlines()))
	predictedFile.close()
	# Step 2 - Open graph and load to igraph #
	ncolFile = load(file, [vertices[0],vertices[1]])
	# Step 3 - Calculate and return modularity #
	graphs = ncolFile.bipartite_projection()
	if(side == 0):
		return graphs[0].modularity(predictedArr)
	elif(side == 1):
		return graphs[1].modularity(predictedArr)
	else:
		return ((graphs[0].modularity(predictedArr) + graphs[1].modularity(predictedArr)) / 2.0)
	


if __name__ == "__main__":
	# Instantiate argument parser
    description = 'Calculate modularity for a bipartite graph, given its \'predicted\' labels after executing a cluster algorithm.'
    parser = argparse.ArgumentParser(description=description)
    parser._action_groups.pop()

    # Add argument group (required)
    required = parser.add_argument_group('required arguments')
    required.add_argument('-f', '--file', required=True, dest='file', action='store', type=str, default=None, help='.ncol filename to be read.')
    required.add_argument('-v', '--vertices', required=True, dest='vertices', action='store', nargs="+", type=int, metavar=('int', 'int'), default=None, help='Number of vertices for each layer of uncoarsened bipartite graph.')
    required.add_argument('-s', '--side', required=True, dest='side', action='store', type=int, default=None, help='Which layer from bipartite graph to output labels - 0 for first, 1 for second, 2 for both.')
    required.add_argument('-p', '--predicted', required=True, dest='predicted', action='store', type=str, default=None, help='.txt file containing vector with correct labels for clustered graph.')

    # Run parser
    options = parser.parse_args()

    print(getModularity(options.file, options.vertices, options.side, options.predicted))
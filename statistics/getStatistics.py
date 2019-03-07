####################################################################################
# Calculate modularity and NMI for a bipartite graph.							   #
# Author: Diego Silva Cintra                                                       #
# Date: 06 March 2019                                                              #
####################################################################################
import argparse
import json
import os
from getNMI import *
from getModularity import *
from getLabelFromJson import *
from getLabelFromSV import *
from getLabelFromSpectralCoclustering import *
from getMostCoarsened import *

# @desc Run scripts to get statistics.
# @param {str} file .json file representing uncoarsened bipartite graph.
# @param {str} ncol .ncol file to be read.
# @param {int} clusters Number of clusters.
# @param {str} label Label from bipartite graph to use as class.
# @param {int} side Which layer from bipartite graph to output labels - 0 for first, 1 for second, 2 for both.
# @param {tuple} vertices Number of vertices for each layer of uncoarsened bipartite graph.
# @returns {tuple} Values for [average nmi with multilevel paradigm, average nmi with co-cluster, modularity for multilevel paradigm, modularity for co-cluster]
def getStatistics(file, ncol, clusters, label, side, vertices):
	# Step 1 - Create true vector #
	fileName = file.split("/")[-1].split(".")[0]
	print("Creating true vector for " + fileName + ".")
	getLabelFromJson(file, label, side, "trueVector_" + fileName)
	# Step 2 - Create predicted vector for multilevel paradigm and spectral co-clustering #
	print("Creating predicted vectors for " + fileName + ".")
	getLabelFromSV("/".join(file.split("/")[:-1]) + "/" + getMostCoarsened(fileName, "/".join(file.split("/")[:-1])), vertices, label, side, "predictedVectorMP_" + fileName)
	getLabelFromSpectralCoclustering(ncol, label, side, vertices, clusters, "predictedVectorSC_" + fileName)
	# Step 3 - Calculate modularity and NMI #
	statistics = []
	print("Calculating NMI for " + fileName + " comparing to multilevel paradigm.")
	statistics.append(getNMI("trueVector_" + fileName + ".txt", "predictedVectorMP_" + fileName + ".txt"))
	print("Calculating NMI for " + fileName + " comparing to coclustering.")
	statistics.append(getNMI("trueVector_" + fileName + ".txt", "predictedVectorSC_" + fileName + ".txt"))
	print("Calculating modularity for " + fileName + " comparing to multilevel paradigm.")
	statistics.append(getModularity(ncol, vertices, side, "predictedVectorMP_" + fileName + ".txt"))
	print("Calculating modularity for " + fileName + " comparing to coclustering.")
	statistics.append(getModularity(ncol, vertices, side, "predictedVectorSC_" + fileName + ".txt"))
	return statistics


if __name__ == "__main__":
	# Instantiate argument parser
    description = 'Program to calculate average from \'getStatistics\' method.'
    parser = argparse.ArgumentParser(description=description)
    parser._action_groups.pop()

    # Add argument group (required)
    required = parser.add_argument_group('required arguments')
    required.add_argument('-f', '--file', required=True, dest='file', action='store', type=str, default=None, help='.json file representing uncoarsened bipartite graph.')
    required.add_argument('-n', '--ncol', required=True, dest='ncol', action='store', type=str, default=None, help='.ncol file to be read.')
    required.add_argument('-c', '--clusters', required=True, dest='clusters', action='store', type=int, default=None, help='Number of clusters.')
    required.add_argument('-l', '--label', required=True, dest='label', action='store', type=str, default=None, help='Label from bipartite graph to use as class.')
    required.add_argument('-s', '--side', required=True, dest='side', action='store', type=int, default=None, help='Which layer from bipartite graph to output labels - 0 for first, 1 for second, 2 for both.')
    required.add_argument('-v', '--vertices', required=True, dest='vertices', action='store', nargs="+", type=int, metavar=('int', 'int'), default=None, help='Number of vertices for each layer of uncoarsened bipartite graph.')

    # Run parser
    options = parser.parse_args()

    statistics = getStatistics(options.file, options.ncol, options.clusters, options.label, options.side, options.vertices)
    print("NMI for MP:")
    print(statistics[0])
    print("NMI for Spectral Coclustering:")
    print(statistics[1])
    print("Modularity for MP:")
    print(statistics[2])
    print("Modularity for Spectral Coclustering:")
    print(statistics[3])

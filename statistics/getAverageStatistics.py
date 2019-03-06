####################################################################################
# Program to calculate average from 'getStatistics' method.                        #
# Author: Diego Silva Cintra                                                       #
# Date: 26 February 2019                                                           #
####################################################################################
import argparse
import json
import os
from getLabelFromJson import *
from getLabelFromSV import *
from getLabelFromSpectralCoClustering import *
from getNMI import *
from getModularity import *
from getStatistics import *
from getAndProcessCoarsening import *

# @desc Get average from statistics for coarsened bipartite graph.
# @param {str} file .json file representing uncoarsened bipartite graph.
# @param {str} ncol .ncol file to be read.
# @param {int} clusters Number of clusters.
# @param {str} label Label from bipartite graph to use as class.
# @param {int} side Which layer from bipartite graph to output labels - 0 for first, 1 for second, 2 for both.
# @param {tuple} vertices Number of vertices for each layer of uncoarsened bipartite graph.
# @param {str} input Input to use for 'coarsening' of multilevel paradigm.
# @param {str} path Path where 'coarsening.py' file is.
# @param {int} times Number of times to run statistics, for average.
# @returns {tuple} Values for [nmi with multilevel paradigm for first layer, nmi with multilevel paradigm for second layer, average nmi with multilevel paradigm, nmi with co-cluster for first layer, nmi with co-cluster for second layer, average nmi with co-cluster, modularity for multilevel paradigm, modularity for co-cluster]
def getAverageStatistics(file, ncol, clusters, label, side, vertices, input, path, times):
	# Step 1 - Loop for n-times #
	averageStats = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
	for i in range(0, times):
        	print "Execution number " + str(i+1)
		# # Step 2 - Open 'input' and find 'directory' file #
  #       	f = open(input + "/input.json", "r")
		# entrada = json.load(f)
  #       	f.close()
		# Step 3 - Remove any elements in 'directory' path, avoid name conflicts between executions #
		print "Removing files from previous \'coarsening\' execution."
		# os.system('rm ' + "/".join(file.split("/")[:-1]) + '/((?!' + file.split("/")[-1].split(".")[0] + ').)*')
        	pwd = os.getcwd()
        	# print 'cd ' + "/".join(file.split("/")[:-1]) + '; rm $(find -type f ! -name ' + file.split("/")[-1] + '); cd ' + pwd
        	os.system('cd ' + "/".join(file.split("/")[:-1]) + '; rm -i $(find -type f ! -name ' + file.split("/")[-1] + '); cd ' + pwd)
		# Step 4 - Run all scripts to coarse and parse files #
		getAndProcessCoarsening(file.split("/")[-1].split(".")[0], "/".join(file.split("/")[:-1]), path, "/".join(input.split("/")[:-1]))
		# Step 5 - Get statistics #
	    	statistics = []
		statistics = getStatistics(file, ncol, clusters, label, side, vertices)
        	print statistics
	    	for j in range(0, len(averageStats)):
	    		averageStats[j] = averageStats[j] + statistics[j]
        	print "--------------------------------------------------------"
	# Step 6 - Calculate average #
	for k in range(0, len(averageStats)):
		averageStats[k] = averageStats[k] / times
	return averageStats

if __name__ == "__main__":
	# Instantiate argument parser
    description = 'Program to calculate average from \'getStatistics\' method.'
    parser = argparse.ArgumentParser(description=description)
    parser._action_groups.pop()

    # Add argument group (required)
    required = parser.add_argument_group('required arguments')
    required.add_argument('-f', '--file', required=True, dest='file', action='store', type=str, default=None, help='.json file representing uncoarsened bipartite graph.')
    required.add_argument('-n', '--ncol', required=True, dest='ncol', action='store', type=str, default=None, help='.ncol file to be read.')
    # required.add_argument('-g', '--coarsened', required=True, dest='coarsened', action='store', type=str, default=None, help='.json file representing coarsened bipartite graph.')
    required.add_argument('-c', '--clusters', required=True, dest='clusters', action='store', type=int, default=None, help='Number of clusters.')
    required.add_argument('-l', '--label', required=True, dest='label', action='store', type=str, default=None, help='Label from bipartite graph to use as class.')
    required.add_argument('-s', '--side', required=True, dest='side', action='store', type=int, default=None, help='Which layer from bipartite graph to output labels - 0 for first, 1 for second, 2 for both.')
    required.add_argument('-v', '--vertices', required=True, dest='vertices', action='store', nargs="+", type=int, metavar=('int', 'int'), default=None, help='Number of vertices for each layer of uncoarsened bipartite graph.')
    required.add_argument('-i', '--input', required=True, dest='input', action='store', type=str, default=None, help='.json file containing parameters for coarsening execution of multilevel paradigm.')
    required.add_argument('-p', '--path', required=True, dest='path', action='store', type=str, default=None, help='Path where \'coarsening.py\' file is.')

    # Add argument group (optional)
    optional = parser.add_argument_group('optional arguments')
    optional.add_argument('-t', '--times', required=False, dest='times', action='store', type=int, default=10, help='Number of times to run statistics, for average.')

    # Run parser
    options = parser.parse_args()

    averageStats = getAverageStatistics(options.file, options.ncol, options.clusters, options.label, options.side, options.vertices, options.input, options.path, options.times)
    print "NMI for Multilevel paradigm algorithm:"
    print averageStats[2]
    print "NMI for Spectral Co-Clustering algorithm:"
    print averageStats[5]
    print "Modularity for Multilevel paradigm algorithm:"
    print averageStats[6]
    print "Modularity for Spectral Co-Clustering algorithm:"
    print averageStats[7]

####################################################################################
# Program to automate tests on "MLBGViewer" system, varying number of clusters and #
# writing results to a .txt file.   											   #	
# Author: Diego Silva Cintra                                                       #
# Date: 28 February 2019                                                           #
####################################################################################
import argparse
import json
import os
from getAverageStatistics import *

# @desc Run automated tests for MLBGViewer tool, and write them to a file.
# @param {str} file .json file representing uncoarsened bipartite graph.
# @param {str} ncol .ncol file to be read.
# @param {str} label Label from bipartite graph to use as class.
# @param {int} side Which layer from bipartite graph to output labels - 0 for first, 1 for second, 2 for both.
# @param {tuple} vertices Number of vertices for each layer of uncoarsened bipartite graph.
# @param {str} input Input to use for 'coarsening' of multilevel paradigm.
# @param {str} path Path where 'coarsening.py' file is.
# @param {str} jsonConfigs .json file containing configuration files for multilevel paradigm execution.
# @param {int} times Number of times to run statistics, for average.
# @param {tuple} rang Range of clusters. Defaults to [5, 500].
# @param {int} period Interval between range of clusters. Defaults to 5.
# @param {str} output .txt filename output (just the name with no extension).
# @returns {tuple} Array of arrays containing results from NMI, modularity, and cluster variation.
# def automateMLBGViewerTests(file, ncol, label, side, vertices, input, path, json, times, rang, period, output):

# @desc Run automated tests for MLBGViewer tool, and write them to a file.
# @param {str} input Input to use for 'coarsening' of multilevel paradigm.
# @param {str} path Path where 'coarsening.py' file is.
# @param {str} jsonConfigs .json file containing configuration files for multilevel paradigm execution.
# @param {int} times Number of times to run statistics, for average.
# @param {tuple} rang Range of clusters. Defaults to [5, 500].
# @param {int} period Interval between range of clusters. Defaults to 5.
# @param {str} output .txt filename output (just the name with no extension).
# @returns {tuple} Array of arrays containing results from NMI, modularity, and cluster variation.
def automateMLBGViewerTests(input, path, jsonConfigs, times, rang, period, output):
	# Step 1 - Open json containing config jsons #

	configJsons = open(jsonConfigs, 'r')
	config = json.load(configJsons)
	outputFile = open(output, 'w')
	results = []
	# Step 2 - Set appropriate number of clusters for iterations # 
	for idx, jason in enumerate(config['jsons']):
		for i in range(rang[0], rang[1], period):
			# Step 3 - Change output to proper testing # 
			configFile = open(input, 'w')
			jason['global_min_vertices'][0] = jason['global_min_vertices'][1] = i
			json.dump(jason, configFile, indent=1)
			configFile.close()
			averageStats = getAverageStatistics(config['labels'][idx]['directory'] + jason['filename'], config['labels'][idx]['ncolName'], i, config['labels'][idx]['label'], config['labels'][idx]['side'], [int(config['labels'][idx]['vertices'].split(" ")[0]), int(config['labels'][idx]['vertices'].split(" ")[1])], input, path, times)
			results.append([averageStats[2],averageStats[5],averageStats[6],averageStats[7]])
		print "results:"
		print results


if __name__ == "__main__":
	# Instantiate argument parser
    description = 'Program to automate tests on "MLBGViewer" system, varying number of clusters and writing results to a .txt file.'
    parser = argparse.ArgumentParser(description=description)
    parser._action_groups.pop()

    # Add argument group (required)
    required = parser.add_argument_group('required arguments')
    # required.add_argument('-f', '--file', required=True, dest='file', action='store', type=str, default=None, help='.json file representing uncoarsened bipartite graph.')
    # required.add_argument('-n', '--ncol', required=True, dest='ncol', action='store', type=str, default=None, help='.ncol file to be read.')
    # required.add_argument('-c', '--clusters', required=True, dest='clusters', action='store', type=int, default=None, help='Number of clusters.')
    # required.add_argument('-l', '--label', required=True, dest='label', action='store', type=str, default=None, help='Label from bipartite graph to use as class.')
    # required.add_argument('-s', '--side', required=True, dest='side', action='store', type=int, default=None, help='Which layer from bipartite graph to output labels - 0 for first, 1 for second, 2 for both.')
    # required.add_argument('-v', '--vertices', required=True, dest='vertices', action='store', nargs="+", type=int, metavar=('int', 'int'), default=None, help='Number of vertices for each layer of uncoarsened bipartite graph.')
    required.add_argument('-i', '--input', required=True, dest='input', action='store', type=str, default=None, help='.json file containing parameters for coarsening execution of multilevel paradigm.')
    required.add_argument('-p', '--path', required=True, dest='path', action='store', type=str, default=None, help='Path where \'coarsening.py\' file is.')
    required.add_argument('-j', '--json', required=True, dest='json', action='store', type=str, default=None, help='.json file containing configuration files for multilevel paradigm execution.')

    # Add argument group (optional)
    optional = parser.add_argument_group('optional arguments')
    optional.add_argument('-t', '--times', required=False, dest='times', action='store', type=int, default=10, help='Number of times to run statistics, for average.')
    optional.add_argument('-r', '--range', required=False, dest='range', action='store', nargs="+", type=int, metavar=('int', 'int'), default=[5,500], help='Range of clusters. Defaults to [5, 500].')
    optional.add_argument('-d', '--period', required=False, dest='period', action='store', type=int, default=5, help='Interval between range of clusters. Defaults to 5.')
    optional.add_argument('-o', '--output', required=False, dest='output', action='store', default='output', help='.txt filename output (just the name with no extension).')

    # Run parser
    options = parser.parse_args()

    # automateMLBGViewerTests(options.file, options.ncol, options.label, options.side, options.vertices, options.input, options.path, options.json, options.times, options.range, options.period)
    automateMLBGViewerTests(options.input, options.path, options.json, options.times, options.range, options.period, options.output)
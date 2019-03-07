####################################################################################
# Calculate normalized mutual information for a bipartite graph, given its 'true'  #
# labels and 'predicted' ones after executing a cluster algorithm.                 #
# Author: Diego Silva Cintra                                                       #
# Date: 06 March 2019                                                              #
####################################################################################
import argparse
import json
import os
from sklearn.metrics.cluster import normalized_mutual_info_score

# @desc Parses a string in list format to actual list.
# @param {str} arr List like string array.
# @returns {list} Actual array.
def listToString(arr):
	arr = arr.split(',')
	arr[0] = arr[0].split('[')[-1]
	arr[-1] = arr[-1].split(']')[0]
	for idx, el in enumerate(arr):
		arr[idx] = int(arr[idx])
	return arr

# @desc Get NMI of bipartite graph, given its true and predicted labels.
# @param {str} true .txt file containing vector with correct labels for original graph.
# @param {str} predicted .txt file containing vector with correct labels for clustered graph.
# @returns {float} NMI value.
def getNMI(true, predicted):
	# Step 1 - Open files and load them into arrays #
	trueFile = open(true, 'r')
	trueArr = listToString(str(trueFile.readlines()))
	trueFile.close()
	predictedFile = open(predicted, 'r')
	predictedArr = listToString(str(predictedFile.readlines()))
	predictedFile.close()

	# Step 2- Calculate and return NMI #
	return normalized_mutual_info_score(trueArr, predictedArr)


if __name__ == "__main__":
	# Instantiate argument parser
    description = 'Calculate normalized mutual information for a bipartite graph, given its \'true\' labels and \'predicted\' ones after executing a cluster algorithm.'
    parser = argparse.ArgumentParser(description=description)
    parser._action_groups.pop()

    # Add argument group (required)
    required = parser.add_argument_group('required arguments')
    required.add_argument('-t', '--true', required=True, dest='true', action='store', type=str, default=None, help='.txt file containing vector with correct labels for original graph.')
    required.add_argument('-p', '--predicted', required=True, dest='predicted', action='store', type=str, default=None, help='.txt file containing vector with correct labels for clustered graph.')

    # Run parser
    options = parser.parse_args()

    print(getNMI(options.true, options.predicted))
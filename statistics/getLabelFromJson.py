####################################################################################
# Program to open a '.json' file and, with a user defined label, calculate and     #
# write a 'trueVector' file, containing label values for each node.                #
# Author: Diego Silva Cintra                                                       #
# Date: 05 March 2019                                                              #
####################################################################################
import argparse
import json
import os

# @desc Find labels from '.json' file and write vector to output.
# @param {str} file .json file representing uncoarsened bipartite graph.
# @param {str} label Label from bipartite graph to use as class.
# @param {int} side Which layer from bipartite graph to output labels - 0 for first, 1 for second, 2 for both.
# @param {str} output .txt filename output (just the name with no extension).
def getLabelFromJson(file, label, side, output):
	# Step 1 - Open file and load json into memory #
	jason = open(file, "r")
	jsonGraph = json.load(jason)
	jason.close()
	# Step 2 - Read and store number of vertices #
	if('vertices' in jsonGraph['graphInfo'][0]):
		v = 'vertices'
	else:
		v = 'vlayer'
	vertices = [int(jsonGraph['graphInfo'][0][v].split(' ')[0]), int(jsonGraph['graphInfo'][0][v].split(' ')[1]), int(jsonGraph['graphInfo'][0][v].split(' ')[0]) + int(jsonGraph['graphInfo'][0][v].split(' ')[1])]
	# Step 3 - For every labeled vertex of a given side, create a dictionary of classes and write values to a vector #
	if(side == 0 or side == 2):
		start = 0
	elif(side == 1):
		start = vertices[0]
		vertices[side] = vertices[side] + start
	labelDict = dict()
	labelIndex = 0
	labelArr = []
	for i in range(start, vertices[side]):
		if(label in jsonGraph['nodes'][i]):
			if(jsonGraph['nodes'][i][label] in labelDict):
				labelArr.append(labelDict[jsonGraph['nodes'][i][label]])
			else:
				labelDict[jsonGraph['nodes'][i][label]] = labelIndex
				labelIndex = labelIndex + 1
				labelArr.append(labelDict[jsonGraph['nodes'][i][label]])
	# Step 4 - Write out to output file #
	outputFile = open(output + ".txt", "w")
	outputFile.write(str(labelArr))
	outputFile.close()




if __name__ == "__main__":
	# Instantiate argument parser
    description = 'Program to open a \'.json\' file and, with a user defined label, calculate and write a \'trueVector\' file, containing label values for each node.'
    parser = argparse.ArgumentParser(description=description)
    parser._action_groups.pop()

    # Add argument group (required)
    required = parser.add_argument_group('required arguments')
    required.add_argument('-f', '--file', required=True, dest='file', action='store', type=str, default=None, help='.json file representing uncoarsened bipartite graph.')
    required.add_argument('-l', '--label', required=True, dest='label', action='store', type=str, default=None, help='Label from bipartite graph to use as class.')
    required.add_argument('-s', '--side', required=True, dest='side', action='store', type=int, default=None, help='Which layer from bipartite graph to output labels - 0 for first, 1 for second, 2 for both.')

    # Add argument group (optional)
    optional = parser.add_argument_group('optional arguments')
    optional.add_argument('-o', '--output', required=False, dest='output', action='store', default='output', help='.txt filename output (just the name with no extension).')

    # Run parser
    options = parser.parse_args()

    getLabelFromJson(options.file, options.label, options.side, options.output)
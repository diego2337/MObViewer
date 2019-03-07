####################################################################################
# Program to open '.json' files representing coarsened graph and calculate 		   #
# predicted labels.										                           #
# Author: Diego Silva Cintra                                                       #
# Date: 05 March 2019                                                              #
####################################################################################
import argparse
import json
import math
import os

# @desc Get labels from super-vertexes in coarsened bipartite graph.
# @param {str} file .json file representing coarsened bipartite graph.
# @param {tuple} verts Number of vertices for each layer of uncoarsened bipartite graph.
# @param {str} label Label from bipartite graph to use as class.
# @param {int} side Which layer from bipartite graph to output labels - 0 for first, 1 for second, 2 for both.
# @param {str} output .txt filename output (just the name with no extension).
def getLabelFromSV(file, verts, label, side, output):
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
	# Step 3 - For every vertex inside a super-vertex, set its label accordingly #
	if(side == 0 or side == 2):
		start = 0
	elif(side == 1):
		start = vertices[0]
		vertices[side] = vertices[side] + start
	predictedArr = []
	labelIndex = 0
	labelDict = dict()
	for i in range(0, verts[0]+verts[1]):
		predictedArr.append(-1)
	for i in range(start, vertices[side]):
		if("vertexes" in jsonGraph['nodes'][i]):
			for superVertex in jsonGraph['nodes'][i]['vertexes']:
				if(label in superVertex):
					if(superVertex[label] not in labelDict):
						labelDict[superVertex[label]] = labelIndex
						labelIndex = labelIndex + 1
					if(side == 1):
						predictedArr[int(superVertex['id'])] = i-vertices[0]
					else:
						predictedArr[int(superVertex['id'])] = i
	superVertexesSize = i
	# Step 4 - Fit array size and write to vector #
	if(side == 0):
		predictedArr = predictedArr[:verts[0]]
	elif(side == 1):
		predictedArr = predictedArr[verts[0]:]
	elif(side == 2):
		for i in range(0, len(predictedArr)):
			if(predictedArr[i] != -1):
				predictedArr[i] = predictedArr[i] % int(math.ceil(superVertexesSize/2))
	outputFile = open(output + '.txt', 'w')
	outputFile.write(str(predictedArr))

if __name__ == "__main__":
	# Instantiate argument parser
    description = 'Program to open \'.json\' files representing coarsened graph and calculate predicted labels.'
    parser = argparse.ArgumentParser(description=description)
    parser._action_groups.pop()

    # Add argument group (required)
    required = parser.add_argument_group('required arguments')
    required.add_argument('-f', '--file', required=True, dest='file', action='store', type=str, default=None, help='.json file representing coarsened bipartite graph.')
    required.add_argument('-v', '--vertices', required=True, dest='vertices', action='store', nargs="+", type=int, metavar=('int', 'int'), default=None, help='Number of vertices for each layer of uncoarsened bipartite graph.')
    required.add_argument('-l', '--label', required=True, dest='label', action='store', type=str, default=None, help='Label from bipartite graph to use as class.')
    required.add_argument('-s', '--side', required=True, dest='side', action='store', type=int, default=None, help='Which layer from bipartite graph to output labels - 0 for first, 1 for second, 2 for both.')

    # Add argument group (optional)
    optional = parser.add_argument_group('optional arguments')
    optional.add_argument('-o', '--output', required=False, dest='output', action='store', default='output', help='.txt filename output (just the name with no extension).')

    # Run parser
    options = parser.parse_args()

    getLabelFromSV(options.file, options.vertices, options.label, options.side, options.output)
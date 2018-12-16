########################################################################
# Program to convert .json graph to .gml, storing attributes included. #
# Author: Diego Silva Cintra                                           #
# Date: 23 November 2018                                               #
########################################################################
import argparse
import os
import sys
import json
from igraph import *

if __name__ == "__main__":
	# Instantiate argument parser
    description = 'Program to convert .json graph to .gml, storing attributes included.'
    parser = argparse.ArgumentParser(description=description)
    parser._action_groups.pop()

    # Add argument group (required)
    required = parser.add_argument_group('required arguments')
    required.add_argument('-j', '--json', required=True, dest='json', action='store', type=str, default=None, help='.json file.');
    required.add_argument('-n', '--ncol', required=True, dest='ncol', action='store', type=str, default=None, help='.ncol file corresponding to .json file.')

    # Add argument group (optional)
    optional = parser.add_argument_group('optional arguments')
    optional.add_argument('-o', '--output', required=False, dest='output', action='store', default='output', help='.gml filename output.')

    # Add arguments to parser
    parser._action_groups.append(required)
    parser._action_groups.append(optional)

    # Run parser
    options = parser.parse_args()

    # Step 1 - Load .json file in dictionary and .ncol in igraph #
    jsonF = open(options.json, 'r')
    jsonFile = json.load(jsonF)
    ncolFile = Graph.Read_Ncol(options.ncol)

    # Step 2 - For every vertex in ncolFile, assign attributes from jsonFile #
    # print len(ncolFile.vs)
    for idx, vertice in enumerate(ncolFile.vs):
    	for element in jsonFile['nodes'][idx]:
    		if(element is not 'id'):
				ncolFile.vs[idx][element] = str(jsonFile['nodes'][idx][element]).encode('utf-8')

    # Step 3 - Close files and write output to '.gml' #
    jsonF.close()
    ncolFile.write_gml(options.output + '.gml')
####################################################################################
# Simple program to open a .ncol file, representing a bipartite graph, and get its #
# adjacency matrix, using "igraph" library.                                        #
# Author: Diego Silva Cintra                                                       #
# Date: 14 February 2018                                                           #
####################################################################################
import argparse
import os
import sys
import igraph
import numpy as np
# from itertools import izip

# Read a .ncol file, since "Read_Ncol" results in unexpected behavior.
# @param {str} filename .ncol file to be read.
# @param {tuple} vertices Tuple containing number of vertices for each layer of bipartite graph.
# @returns {dict} Graph.
def load(filename, vertices):
    """
    Load ncol npartite graph and generate special attributes
    """

    # data = np.loadtxt(filename, skiprows=0, dtype='string')
    # NOTE - Only works for python3.x; Line above works for python2.x
    data = np.loadtxt(filename, skiprows=0, dtype='str')
    dict_edges = dict()
    for row in data:
        if len(row) == 3:
            dict_edges[(int(row[0]), int(row[1]))] = float(row[2])
        else:
            dict_edges[(int(row[0]), int(row[1]))] = 1
    edges, weights = zip(*dict_edges.items())
    graph = igraph.Graph(sum(vertices), list(edges)) # edge_attrs={'weight': weights}
    graph.es['weight'] = weights
    graph.vs['weight'] = 1
    types = []
    for i in range(len(vertices)):
        types += [i] * vertices[i]
    graph.vs['type'] = types
    graph.vs['name'] = range(graph.vcount())
    for v in graph.vs():
        v['source'] = [v.index]
    graph['adjlist'] = map(set, graph.get_adjlist())
    graph['vertices'] = vertices
    graph['layers'] = len(vertices)
    # Not allow direct graphs
    if graph.is_directed():
        graph.to_undirected(combine_edges=None)

    return graph

# Get an adjacency matrix.
# @param {str} file .ncol file to be read.
# @param {tuple} vertices Tuple containing number of vertices for each layer of bipartite graph.
# @returns {tuple} Adjacency matrix.
def getAdjacencyMatrix(file, vertices):
    # Step 1: Load .ncol file into igraph #
    ncolFile = load(file, [vertices[0],vertices[1]])

    # Step 2: Get adjacency matrix #
    return ncolFile.get_adjacency()._get_data()


if __name__ == "__main__":
    # Instantiate argument parser
    description = 'Program to open a .ncol and .json file, representing a bipartite graph, and get its adjacency matrix, using "igraph" library.'
    parser = argparse.ArgumentParser(description=description)
    parser._action_groups.pop()

    # Add argument group (required)
    required = parser.add_argument_group('required arguments')
    required.add_argument('-f', '--file', required=True, dest='file', action='store', type=str, default=None, help='.ncol filename to be read.')
    required.add_argument('-v', '--vertices', required=True, dest='vertices', action='store', nargs="+", type=int, metavar=('int', 'int'), default=None, help='Number of vertices for each layer of uncoarsened bipartite graph.')

    # Add argument group (optional)
    optional = parser.add_argument_group('optional arguments')
    optional.add_argument('-o', '--output', required=False, dest='output', action='store', default='output', help='.txt filename output (just the name with no extension).')

    # Run parser
    options = parser.parse_args()

    # Open '.txt' file to write adjacency matrix #
    adjacencyMatrix = open(options.output + '.txt', 'w')

    # Get adjacency matrix #
    # adjacencyMatrix.write(getAdjacencyMatrix(options.file, options.vertices).toStr())
    lst = getAdjacencyMatrix(options.file, options.vertices)
    with adjacencyMatrix as f:
        for item in lst:
            f.write("%s\n" % item)

    # Close '.json' file #
    adjacencyMatrix.close()
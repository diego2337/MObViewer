import igraph
import argparse
import sys
import os
import numpy

from itertools import izip

if __name__ == '__main__':

	# Parse options command line
	parser = argparse.ArgumentParser()
	usage = 'usage: python %prog [options] args ...'
	parser.add_argument('-f', '--filename', action='store', dest='filename', help='[Bipartite Graph]', type=str)
	parser.add_argument('-d', '--directory', action='store', dest=None, help='[Output directory]', type=str)
	parser.add_argument('-o', '--output', action='store', dest=None, help='[Output filename]', type=str)
	parser.add_argument('-v', '--vertices', dest='vertices', nargs='+', type=int, help='[Number of vertices for each layer (default: None)]')
	options = parser.parse_args()

	# Read and pre-process
	if options.filename is None:
		parser.error('required -f [filename] arg.')
	if options.directory is None:
		options.directory = os.path.dirname(os.path.abspath(options.filename)) + '/'
	else:
		if not os.path.exists(options.directory): os.makedirs(options.directory)
	if not options.directory.endswith('/'): options.directory += '/'
	if options.output is None:
		filename, extension = os.path.splitext(os.path.basename(options.filename))
		options.output = options.directory + filename + '.gml'

	data = numpy.loadtxt(options.filename, skiprows=0, dtype='string')
	dict_edges = dict()
	for row in data:
		dict_edges[(int(row[0]), int(row[1]))] = float(row[2])
	edges, weights = izip(*dict_edges.items())
	graph = igraph.Graph(sum(options.vertices), list(edges)) # edge_attrs={'weight': weights}
	graph.es['weight'] = weights
	if graph.is_directed(): graph.to_undirected(combine_edges=None)
	graph['vertices'] = ' '.join(str(e) for e in options.vertices)
	graph['layers'] = len(options.vertices)
	graph.write(options.output, format='gml')

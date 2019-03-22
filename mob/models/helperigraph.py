#!/usr/bin/env python
# coding: utf-8

import numpy
import helper
import networkx as nx

from mob import MGraph
from itertools import izip
from scipy.sparse import csr_matrix

def igraph_to_nx(graph):
	nx_graph = nx.Graph()
	nx_graph.add_nodes_from(range(graph.vcount()))
	nx_edges = []
	for edge in graph.es():
		nx_edges.append((edge.tuple[0], edge.tuple[1], float(edge['weight'])))
	nx_graph.add_weighted_edges_from(nx_edges)
	return nx_graph

def create_bipartite_graph(vertices, edges, weights=None):

	# edge_attrs={'weight': weights}
	graph = MGraph(sum(vertices), list(edges))
	if weights is None:
		weights = 1
	graph.es['weight'] = weights
	graph.vs['weight'] = 1
	types = []
	for i in range(len(vertices)):
		types += [i] * vertices[i]
	graph.vs['type'] = types
	graph.vs['name'] = range(graph.vcount())
	graph.vs['successor'] = [None] * graph.vcount()
	for v in graph.vs():
		v['source'] = [v.index]
		v['predecessor'] = [v.index]
	graph['adjlist'] = map(set, graph.get_adjlist())
	graph['vertices'] = vertices
	graph['layers'] = len(vertices)
	graph['similarity'] = None
	# Not allow direct graphs
	if graph.is_directed():
		graph.to_undirected(combine_edges=None)

	return graph

def load(filename, vertices):
	"""
	Load ncol npartite graph and generate special attributes
	"""

	data = numpy.loadtxt(filename, skiprows=0, dtype='string')
	dict_edges = dict()
	for row in data:
		if len(row) == 3:
			dict_edges[(int(row[0]), int(row[1]))] = float(row[2])
		else:
			dict_edges[(int(row[0]), int(row[1]))] = 1

	edges, weights = izip(*dict_edges.items())

	return create_bipartite_graph(vertices, edges, weights)

def load_csr(filename):
	"""
	Load scipy.sparse.csr_matrix
	"""

	X, y, K = helper.loadarff(filename)
	vertices = list(X.shape)
	dict_edges = dict()
	cx = X.tocoo()
	for u, v, weight in izip(cx.row, cx.col, cx.data):
		v = v + vertices[0]
		dict_edges[(u, v)] = weight

	edges, weights = izip(*dict_edges.items())

	return create_bipartite_graph(vertices, edges, weights)

def load_matrix(X):

	vertices = list(X.shape)
	dict_edges = dict()
	it = numpy.nditer(X, flags=['multi_index'])
	while not it.finished:
		dict_edges[(it.multi_index[0], (it.multi_index[1] + vertices[0]))] = float(it[0])
		it.iternext()

	edges, weights = izip(*dict_edges.items())

	return create_bipartite_graph(vertices, edges, weights)

def load_dat(filename, skip_rows, skip_last_column):
	"""
	Load numpy txt
	"""

	delimiter = helper.detect_delimiter(filename)
	ncols = helper.detect_ncol(filename)
	if skip_last_column:
		ncols -= 1
	X = numpy.loadtxt(filename, delimiter=delimiter, usecols=range(0, ncols), skiprows=skip_rows)
	vertices = list(X.shape)
	dict_edges = dict()

	it = numpy.nditer(X, flags=['multi_index'])
	while not it.finished:
		dict_edges[(it.multi_index[0], (it.multi_index[1] + vertices[0]))] = float(it[0])
		it.iternext()

	edges, weights = izip(*dict_edges.items())

	return create_bipartite_graph(vertices, edges, weights)

def remove_isolates(graph):

	degree = numpy.array(graph.degree())
	to_delete_ids = numpy.where(degree == 0)[0]
	graph.delete_vertices(to_delete_ids)
	for layer in xrange(graph['layers']):
		graph['vertices'].append(len(graph.vs.select(type=layer)))
	graph['adjlist'] = map(set, graph.get_adjlist())

	return graph

def biajcent_matrix(graph):

	W = numpy.zeros((graph['vertices'][0], graph['vertices'][1]))
	for edge in graph.es():
		u = edge.tuple[0]
		v = edge.tuple[1]
		u_type = graph.vs['type'][u]
		v_type = graph.vs['type'][v]
		if u_type == 1:
			u = u - (graph['vertices'][0])
		if v_type == 1:
			v = v - (graph['vertices'][0])
		W[u, v] = float(edge['weight'])

	return W

def to_matrix(graph):

	shape_row = len(graph.vs.select(type=0))
	shape_column = len(graph.vs.select(type=1))
	weights = graph.es['weight']

	edges = []
	for edge in graph.es():
		u = edge.tuple[0]
		v = edge.tuple[1]
		if v < u:
			u = u - shape_row
			edges.append((v, u))
		else:
			v = v - shape_row
			edges.append((u, v))
	row, column = zip(*edges)

	return csr_matrix((weights, (row, column)), shape=(shape_row, shape_column))

#!/usr/bin/env python
# coding: utf-8

"""
Mob (Multilevel Optimization Framework to Bipartite Networks)
==========================

Copyright (C) 2016 Alan Valejo <alanvalejo@gmail.com> All rights reserved.

Multilevel optimization framework to perform in bipartite context.

Multilevel approaches aim to reduce the cost of an optimization process by
applying it to a reduced or coarsened version of the original network.

This file is part of MOB.

MOB is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

MOB is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with MOB. If not, see <http://www.gnu.org/licenses/>.

Required:
	.. _igraph: http://igraph.sourceforge.net
"""

import operator
import time
import numpy as np
import igraph
import random

from collections import defaultdict
from itertools import combinations, izip
from multiprocessing import Pipe, Manager, Process
from random import choice, randint, sample, shuffle
from igraph import Graph
from similarity import Similarity

from scipy.sparse import csr_matrix
from sklearn.decomposition import NMF

__maintainer__ = 'Alan Valejo'
__author__ = 'Alan Valejo, Vinicius Ferreira'
__email__ = 'alanvalejo@gmail.com', 'viniciusferreira97@gmail.com'
__credits__ = ['Alan Valejo', 'Vinicius Ferreira', 'Alneu de Andrade Lopes']
__homepage__ = 'https://github.com/alanvalejo/mob'
__license__ = 'GNU'
__docformat__ = 'markdown en'
__version__ = '0.1'
__date__ = '2016-12-01'

def load(filename, vertices):
	"""
	Load ncol npartite graph and generate special attributes
	"""

	data = np.loadtxt(filename, skiprows=0, dtype='string')
	dict_edges = dict()
	for row in data:
		if len(row) == 3:
			dict_edges[(int(row[0]), int(row[1]))] = float(row[2])
		else:
			dict_edges[(int(row[0]), int(row[1]))] = 1
	edges, weights = izip(*dict_edges.items())
	graph = MGraph(sum(vertices), list(edges)) # edge_attrs={'weight': weights}
	graph.es['weight'] = weights
	graph.vs['weight'] = 1
	types = []
	for i in range(len(vertices)):
		types += [i] * vertices[i]
	graph.vs['type'] = types
	graph.vs['name'] = range(graph.vcount())
	for v in graph.vs():
		v['source'] = [v.index]
		v['predecessor'] = [v.index]
	graph['adjlist'] = map(set, graph.get_adjlist())
	graph['vertices'] = vertices
	graph['layers'] = len(vertices)
	# Not allow direct graphs
	if graph.is_directed():
		graph.to_undirected(combine_edges=None)

	return graph

class MGraph(Graph):

	def __init__(self, *args, **kwargs):
		super(Graph, self).__init__(*args, **kwargs)

	def coarsening(self, matching):
		"""
		Create coarse graph from matching of pairs
		"""

		# Collapse vertices
		uniqid = 0
		visited = [0] * self.vcount()
		types = []
		weights = []
		source = {}
		predecessor = {}
		for vertex, pair in enumerate(matching):
			if visited[vertex] == 0:
				self.vs[vertex]['successor'] = uniqid
				types.append(self.vs[vertex]['type'])
				weight = self.vs[vertex]['weight']
				source[uniqid] = []
				predecessor[uniqid] = []
				predecessor[uniqid].append(vertex)
				source[uniqid].extend(self.vs[vertex]['source'])
				if vertex != pair:
					self.vs[pair]['successor'] = uniqid
					weight += self.vs[pair]['weight']
					predecessor[uniqid].append(pair)
					source[uniqid].extend(self.vs[pair]['source'])
				weights.append(weight)
				uniqid += 1
				visited[vertex] = 1
				visited[pair] = 1

		# Create coarse graph
		coarse = MGraph()
		coarse.add_vertices(uniqid)
		coarse.vs['type'] = types
		coarse.vs['weight'] = weights
		coarse.vs['name'] = range(coarse.vcount())
		coarse['layers'] = self['layers']
		coarse['vertices'] = []
		for layer in xrange(self['layers']):
			coarse['vertices'].append(len(coarse.vs.select(type=layer)))
		for vertex, source in source.iteritems():
			coarse.vs[vertex]['source'] = source
		for vertex, predecessor in predecessor.iteritems():
			coarse.vs[vertex]['predecessor'] = predecessor

		# Collapse edges
		dict_edges = dict()
		for edge in self.es():
			v_successor = self.vs[edge.tuple[0]]['successor']
			u_successor = self.vs[edge.tuple[1]]['successor']

			# Loop is not necessary
			if v_successor == u_successor:
				continue

			# Add edge in coarse graph
			if v_successor < u_successor:
				dict_edges[(v_successor, u_successor)] = dict_edges.get((v_successor, u_successor), 0) + edge['weight']
			else:
				dict_edges[(u_successor, v_successor)] = dict_edges.get((u_successor, v_successor), 0) + edge['weight']

		if len(dict_edges) > 0:
			edges, weights = izip(*dict_edges.items())
			coarse.add_edges(edges)
			coarse.es['weight'] = weights
			coarse['adjlist'] = map(set, coarse.get_adjlist())

		return coarse

	def remove_isolates(self):
		degree = np.array(self.degree())
		to_delete_ids = np.where(degree == 0)[0]
		self.delete_vertices(to_delete_ids)
		for layer in xrange(self['layers']):
			self['vertices'].append(len(self.vs.select(type=layer)))
		self['adjlist'] = map(set, self.get_adjlist())

	def biajcent_matrix(self):
		W = np.zeros((self['vertices'][0], self['vertices'][1]))
		for edge in self.es():
			u = edge.tuple[0]
			v = edge.tuple[1]
			u_type = self.vs['type'][u]
			v_type = self.vs['type'][v]
			if u_type == 1:
				u = u - (self['vertices'][0])
			if v_type == 1:
				v = v - (self['vertices'][0])
			W[u, v] = edge['weight']

		return W

	def to_matrix(self):
		shape_row = len(self.vs.select(type=0))
		shape_column = len(self.vs.select(type=1))
		weights = self.es['weight']

		edges = []
		for edge in self.es():
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

	def greedy_twohops(self, vertices, matching, reduction_factor=0.5, reverse=True):
		"""
		Matches are restricted between vertices that are not adjacent
		but are only allowed to match with neighbors of its neighbors,
		i.e. two-hopes neighborhood
		"""

		# Search two-hopes neighborhood for each vertex in selected layer
		dict_edges = dict()
		visited = [0] * self.vcount()
		for vertex in vertices:
			neighborhood = self.neighborhood(vertices=vertex, order=2)
			twohops = neighborhood[(len(self['adjlist'][vertex]) + 1):]
			for twohop in twohops:
				if visited[twohop] == 1:
					continue
				dict_edges[(vertex, twohop)] = self['similarity'](vertex, twohop)
			visited[vertex] = 1

		# Select promising matches or pair of vertices
		edges = sorted(dict_edges.items(), key=operator.itemgetter(1), reverse=reverse)
		merge_count = int(reduction_factor * len(vertices))
		for edge, value in edges:
			if (matching[edge[0]] == edge[0]) and (matching[edge[1]] == edge[1]):
				matching[edge[0]] = edge[1]
				matching[edge[1]] = edge[0]
				merge_count -= 1
			if merge_count == 0:
				break

	def greedy_seed_twohops(self, vertices, matching, reduction_factor=0.5, seed_priority='random'):
		"""
		Matches are restricted between vertices that are not adjacent
		but are only allowed to match with neighbors of its neighbors,
		i.e. two-hopes neighborhood. This version use a random seed.
		"""

		# Select seed set expansion
		if seed_priority == 'strength':
			vertices_score = np.array(self.strength(vertices, weights='weight'))
			vertices_id = np.argsort(vertices_score)[::-1]
		if seed_priority == 'degree':
			vertices_score = np.array(self.degree(vertices))
			vertices_id = np.argsort(vertices_score)[::-1]
		if seed_priority == 'random':
			vertices_id = vertices
			vertices_id = random.sample(vertices_id, len(vertices_id))

		# Find the matching
		visited = [0] * self.vcount()
		index = 0
		merge_count = int(reduction_factor * len(vertices))
		while merge_count > 0 and index < len(vertices):
			# Randomly select a vertex v of V
			vertex = vertices_id[index]
			if visited[vertex] == 1:
				index += 1
				continue
			# Select the edge (v, u) of E wich maximum score
			# Tow hopes restriction: It ensures that the match only occurs
			# between vertices of the same type
			neighborhood = self.neighborhood(vertices=vertex, order=2)
			twohops = neighborhood[(len(self['adjlist'][vertex]) + 1):]
			# twohops = set((twohop for onehop in self['adjlist'][vertex] for twohop in self['adjlist'][onehop])) - set([vertex])
			_max = 0.0
			neighbor = vertex
			for twohop in twohops:
				if visited[twohop] == 1:
					continue
				# Calling a function of a module from a string
				score = self['similarity'](vertex, twohop)
				if score > _max:
					_max = score
					neighbor = twohop
			matching[neighbor] = vertex
			matching[vertex] = neighbor
			visited[neighbor] = 1
			merge_count -= 1
			visited[vertex] = 1
			index += 1

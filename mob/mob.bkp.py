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
import sharedmem
import numpy as np
import igraph

from collections import defaultdict
from itertools import combinations, izip
from multiprocessing import Pipe, Manager, Process
from random import choice, randint, sample, shuffle
from igraph import Graph
from similarity import Similarity

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
		dict_edges[(int(row[0]), int(row[1]))] = float(row[2])
	edges, weights = izip(*dict_edges.items())
	graph = MGraph(sum(vertices), list(edges)) # edge_attrs={'weight': weights}
	graph.es['weight'] = weights
	graph.vs['weight'] = 1
	types = []
	for i in range(len(vertices)):
		types += [i] * vertices[i]
	graph.vs['type'] = types
	graph.vs['name'] = range(graph.vcount())
	for v in graph.vs(): v['original'] = [v.index]
	graph['adjlist'] = map(set, graph.get_adjlist())
	graph['layers'] = len(vertices)
	graph['vertices'] = vertices
	# Not allow direct graphs
	if graph.is_directed(): graph.to_undirected(combine_edges=None)

	return graph

class MGraph(Graph):

	def __init__(self, *args, **kwargs):
		super(Graph, self).__init__(*args, **kwargs)

	def disjoint_community_detection_projection(self, fine):
		"""
		The disjoint community structure of the reduced graph (self)
		is projected to the original/next graph (fine)
		"""

		for vertex in fine.vs():
			fine.vs[vertex.index]['membership'] = self.vs[vertex['successor']]['membership']
		fine['ccount'] = self['ccount']

	def coarsening_overlapping(self, matching, sv_type):
		"""
		Contracts overlapping vertices and edges in the graph, i.e. replaces groups of
		vertices and multiple edges with single vertices and single edges,
		respectively.
		"""

		# Contract vertices: Referencing the original graph of the coarse graph
		self.vs['successor'] = matching

		coarse = MGraph()
		coarse.add_vertices(len(sv_type))
		coarse['layers'] = self['layers']
		coarse['vertices'] = []
		coarse['adjlist'] = map(set, coarse.get_adjlist())

		coarse.vs['type'] = sv_type
		coarse.vs['name'] = range(coarse.vcount())
		for layer in xrange(self['layers']):
			coarse['vertices'].append(len(coarse.vs.select(type=layer)))
		coarse.vs['original'] = [[] for i in range(coarse.vcount())]
		for vertex, sv in enumerate(matching):
			coarse.vs[sv]['original'].extend(self.vs[vertex]['original'])

		# Contract edges
		dict_edges = dict()
		for edge in self.es():
			v_successor_set = self.vs[edge.tuple[0]]['successor']
			u_successor_set = self.vs[edge.tuple[1]]['successor']

			for v_successor in v_successor_set:
				for u_successor in u_successor_set:

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

	def coarsening(self, matching, sv_type):
		"""
		Contracts some vertices and edges in the graph, i.e. replaces groups of
		vertices and multiple edges with single vertices and single edges,
		respectively.
		"""

		self.vs['sucessor'] = matching

		coarse = self.copy()
		coarse['layers'] = self['layers']

		coarse.contract_vertices(matching, combine_attrs={'weight': sum})
		coarse.simplify(combine_edges={'weight': sum})

		coarse.vs['type'] = sv_type
		coarse.vs['name'] = range(coarse.vcount())
		coarse['vertices'] = []
		for layer in range(len(self['vertices'])):
			coarse['vertices'].append(len(coarse.vs.select(type=layer)))
		coarse.vs['original'] = [[] for i in range(coarse.vcount())]
		for vertex, sv in enumerate(matching):
			coarse.vs[sv]['original'].extend(self.vs[vertex]['original'])

		coarse['adjlist'] = map(set, coarse.get_adjlist())

		return coarse

	def coarsening_pairs(self, matching):
		"""
		Create coarse graph from matching of pairs
		"""

		# Contract vertices: Referencing the original graph of the coarse graph
		uniqid = 0
		visited = [0] * self.vcount()
		types = []
		weights = []
		original = {}
		for vertex, pair in enumerate(matching):
			if visited[vertex] == 0:
				self.vs[vertex]['successor'] = uniqid
				types.append(self.vs[vertex]['type'])
				weight = self.vs[vertex]['weight']
				original[uniqid] = []
				original[uniqid].extend(self.vs[vertex]['original'])
				if vertex != pair:
					self.vs[pair]['successor'] = uniqid
					weight += self.vs[pair]['weight']
					original[uniqid].extend(self.vs[pair]['original'])
				weights.append(weight)
				uniqid += 1
				visited[vertex] = 1
				visited[pair] = 1

		# Create coarsening self
		coarse = MGraph()
		coarse.add_vertices(uniqid)
		coarse.vs['type'] = types
		coarse.vs['weight'] = weights
		coarse.vs['name'] = range(coarse.vcount())
		coarse['layers'] = self['layers']
		coarse['vertices'] = []
		for layer in xrange(self['layers']):
			coarse['vertices'].append(len(coarse.vs.select(type=layer)))
		for vertex, original in original.iteritems():
			coarse.vs[vertex]['original'] = original

		# Contract edges
		dict_edges = dict()
		for edge in self.es():
			v_successor = self.vs[edge.tuple[0]]['successor']
			u_successor = self.vs[edge.tuple[1]]['successor']

			# Loop is not necessary
			if v_successor == u_successor: continue

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

	def overlapping_biclique(self, min_biclique_size=[1, 1]):
		"""
		The best match is selected for each vertex using unweighted biclique.
		"""

		# Find min layer
		min_layer = np.argsort(self['vertices'])[0]
		L = set(self.vs.select(type=min_layer)['name'])
		# Find max layer
		max_layer = np.argsort(self['vertices'])[1]
		P = set(self.vs.select(type=max_layer)['name'])
		# Find bicliques
		bicliques = self.find_bicliques(L, P, biclique_priority='all', min_biclique_size=min_biclique_size)
		# Collapse matched vertices
		sv_id = 0
		sv_type = []
		matching = [[] for i in range(self.vcount())]
		for left, right in bicliques:
			for vertex in left:
				matching[vertex].append(sv_id)
			sv_type.append(self.vs[vertex]['type'])
			sv_id += 1
			for vertex in right:
				matching[vertex].append(sv_id)
			sv_type.append(self.vs[vertex]['type'])
			sv_id += 1
		# Collapse not matched vertices
		for vertex, cluster in enumerate(matching):
			if len(cluster) == 0:
				matching[vertex].append(sv_id)
				sv_type.append(self.vs[vertex]['type'])
				sv_id += 1

		return matching, sv_type

	def greed_biclique(self, min_biclique_size=[1, 1]):
		"""
		The best match is selected for each vertex using unweighted biclique.
		"""

		# Find min layer
		min_layer = np.argsort(self['vertices'])[0]
		L = set(self.vs.select(type=min_layer)['name'])
		# Find max layer
		max_layer = np.argsort(self['vertices'])[1]
		P = set(self.vs.select(type=max_layer)['name'])
		# Find bicliques
		bicliques = self.find_bicliques(L, P, biclique_priority='all', min_biclique_size=min_biclique_size)
		bicliques = sorted(bicliques, key=operator.itemgetter(2), reverse=True)
		# Collapse matched vertices
		sv_id = 0
		sv_type = []
		matching = np.empty(self.vcount(), dtype=int)
		matching.fill(-1)
		matched = set()
		for left, right, score in bicliques:
			left = left - matched
			right = right - matched
			biclique = left | right
			if (len(left) > 0) and (len(right) > 0):
				matched |= biclique
				left, right = list(left), list(right)
				matching[left] = sv_id
				sv_type.append(self.vs[left[0]]['type'])
				sv_id += 1
				matching[right] = sv_id
				sv_type.append(self.vs[right[0]]['type'])
				sv_id += 1
		# Not merged vertices are inherited by previous graph
		for vertex in np.where(matching == -1)[0]:
			matching[vertex] = sv_id
			sv_type.append(self.vs[vertex]['type'])
			sv_id += 1

		return matching, sv_type

	def greed_rand_biclique(self, vertices=[0], seed_priority='degree', biclique_priority='first', min_biclique_size=[1, 1], biclique_size=[2, 2]):
		"""
		The best match is selected for each vertex using biclique.
		"""

		# Select seed type
		if seed_priority == 'strength':
			vertices_score = np.array(self.strength(vertices, weights='weight'))
			vertices_id = np.argsort(vertices_score)[::-1]
		if seed_priority == 'degree':
			vertices_score = np.array(self.degree(vertices))
			vertices_id = np.argsort(vertices_score)[::-1]
		if seed_priority == 'random':
			vertices_id = shuffle(range(len(vertices)))
		# Find the matching and collapse matched vertices
		visited = np.array([0] * self.vcount())
		matched = set()
		sv_id = 0
		sv_type = []
		matching = np.empty(self.vcount(), dtype=int)
		matching.fill(-1)
		for idx in vertices_id:
			vertex = vertices[idx]
			if visited[vertex] == 1: continue
			L = set(self.neighbors(vertex)) - matched
			P = self.neighborhood(vertices=vertex, order=2)
			P.append(vertex)
			P = set(P[(len(self['adjlist'][vertex]) + 1):]) - matched
			bicliques = self.find_bicliques(L, P, biclique_priority=biclique_priority, min_biclique_size=min_biclique_size, biclique_size=biclique_size)
			if len(bicliques) > 0:
				biclique = bicliques[0] | bicliques[1]
				matched |= biclique
				left, right = list(bicliques[0]), list(bicliques[1])
				matching[left] = sv_id
				sv_type.append(self.vs[left[0]]['type'])
				sv_id += 1
				matching[right] = sv_id
				sv_type.append(self.vs[right[0]]['type'])
				sv_id += 1
				visited[list(biclique)] = 1
		# Not merged vertices are inherited by previous graph
		for vertex in np.where(matching == -1)[0]:
			matching[vertex] = sv_id
			sv_type.append(self.vs[vertex]['type'])
			sv_id += 1

		return matching, sv_type

	def find_bicliques(self, L, P, biclique_priority='first_maximal', min_biclique_size=[1, 1], biclique_size=[2, 2]):
		"""
		Finding bicliques in bipartite graphs
		"""

		score = 0.0
		biclique = []
		stack = [(L, set(), P, set())]
		while stack:
			L, R, P, Q = stack.pop()
			# If len(P) > 0
			while P:
				x = P.pop()
				# Extend biclique
				R_line = R | {x}
				L_line = L & set(self['adjlist'][x])
				# Create new sets
				P_line, Q_line = set(), set()
				# Check maximality
				is_maximal = True
				for v in Q:
					# Checks whether L_line is a subset of all adjacent nodes
					# of v in Q
					Nv = L_line & set(self['adjlist'][v])
					if len(Nv) == len(L_line):
						is_maximal = False
						break
					# If len(Nv) > 0
					elif Nv:
						# Some vertices in L_line are not adjacent to v:
						# keep vertices adjacent to some vertex in L_line
						Q_line.add(v)
				if is_maximal:
					for v in P:
						# Get the neighbors of v in L_line
						Nv = L_line & set(self['adjlist'][v])
						if len(Nv) == len(L_line):
							R_line.add(v)
						# len(Nv) > 0:
						elif Nv:
							# Some vertices in L_line are not adjacent to v:
							# keep vertices adjacent to some vertex in L_line
							P_line.add(v)
					# Report biclique first, maximum, maximal, balanced or size
					sizes = [len(L_line), len(R_line)]
					if (sizes[0] > 0) and (sizes[1] > 0):
						# Get all maximal biclique
						if biclique_priority == 'all':
							if (sizes[0] >= min_biclique_size[0]) and (sizes[1] >= min_biclique_size[1]):
								score = (sizes[0] * sizes[1]) / (max(sizes) / min(sizes))
								biclique.append((L_line, R_line, score))
						# Get first maximal biclique
						elif biclique_priority == 'first_maximal':
							return (L_line, R_line)
						# Get first biclique of a given size
						elif biclique_priority == 'size':
							if sizes == biclique_size:
								return (L_line, R_line)
						# Get biclique by score: maximum vertex, maximum edge or balanced
						else:
							# Test minimum biclique size
							if (sizes[0] >= min_biclique_size[0]) and (sizes[1] >= min_biclique_size[1]):
								score_line = 0.0
								if biclique_priority == 'maximum_vertex':
									score_line = sizes[0] + sizes[1]
								elif biclique_priority == 'maximum_edge':
									score_line = sizes[0] * sizes[1]
								elif biclique_priority == 'balanced':
									score_line = (sizes[0] * sizes[1]) / (max(sizes) / min(sizes))
								elif biclique_priority == 'weighted':
									for l in L_line:
										for r in R_line:
											score_line += self[l, r]
								# Verify highest score
								if score_line > score:
									score = score_line
									biclique = (L_line, R_line)
					# len(P_prime) > 0:
					if P_line:
						stack.append((L_line, R_line, P_line, Q_line))
				# Move x to former candidate set
				Q.add(x)

		return biclique

	def greed_modularity(self, vertices, reduction_factor, matching):
		"""
		TODO
		"""

		merge_count = int(reduction_factor * len(vertices))
		return self.get_greed_modularity(vertices, merge_count, matching)

	def get_greed_modularity(self, vertices, merge_count, matching, reverse=True):
		"""
		TODO
		"""

		# Search two-hopes neighborhood for each vertex in selected layer
		dict_edges = dict()
		visited = [0] * self.vcount()
		strength = float(sum(self.es['weight']))
		for vertex in vertices:
			neighborhood = self.neighborhood(vertices=vertex, order=2)
			twohops = neighborhood[(len(self['adjlist'][vertex]) + 1):]
			for twohop in twohops:
				if visited[twohop] == 1: continue
				strength_vertex = self.vs[vertex]['strength']
				strength_twohop = self.vs[twohop]['strength']
				sim = self['similarity'](vertex, twohop)
				score = ((2 * sim) / strength) - ((2 * strength_vertex * strength_twohop) / (strength * strength))
				if score > 0.0:
					dict_edges[(vertex, twohop)] = score
			visited[vertex] = 1

		# Select promising matches or pair of vertices
		edges = sorted(dict_edges.items(), key=operator.itemgetter(1), reverse=reverse)
		for edge, value in edges:
			if (matching[edge[0]] == edge[0]) and (matching[edge[1]] == edge[1]):
				matching[edge[0]] = edge[1]
				matching[edge[1]] = edge[0]
				merge_count -= 1
			if merge_count == 0: break

	def greed_rand_modularity(self, vertices, reduction_factor, matching):
		"""
		Matches are restricted between vertices that are not adjacent
		but are only allowed to match with neighbors of its neighbors,
		i.e. two-hopes neighborhood. This version use a random seed.
		"""

		merge_count = int(reduction_factor * len(vertices))
		return self.get_greed_rand_modularity(vertices, merge_count, matching)

	def get_greed_rand_modularity(self, vertices, merge_count, matching):
		"""
		The best match is selected from a random seed and use its two-hops
		neighborhood.
		"""

		visited = [0] * self.vcount()
		index = 0
		sample_vertices = sample(vertices, len(vertices))
		strength = float(sum(self.es['weight']))
		while merge_count > 0 and index < len(vertices):
			# Randomly select a vertex v of V
			vertex = sample_vertices[index]
			if visited[vertex] == 1:
				index += 1
				continue
			# Select the edge (v, u) of E wich maximum score
			# Tow hopes restriction: It ensures that the match only occurs
			# between vertices of the same type
			neighborhood = self.neighborhood(vertices=vertex, order=2)
			twohops = neighborhood[(len(self['adjlist'][vertex]) + 1):]
			_max = 0.0
			neighbor = vertex
			for twohop in twohops:
				if visited[twohop] == 1: continue
				# Calling a function of a module from a string
				strength_vertex = self.vs[vertex]['strength']
				strength_twohop = self.vs[twohop]['strength']
				sim = self['similarity'](vertex, twohop)
				# print sim, strength_vertex, strength_twohop, strength
				score = ((2 * sim) / strength) - ((2 * strength_vertex * strength_twohop) / (strength * strength))
				if (score > _max) and (score > 0.0):
					_max = score
					neighbor = twohop
			matching[neighbor] = vertex
			matching[vertex] = neighbor
			visited[neighbor] = 1
			merge_count -= 1
			visited[vertex] = 1
			index += 1

	def greed_twohops(self, vertices, reduction_factor, matching):
		"""
		Matches are restricted between vertices that are not adjacent
		but are only allowed to match with neighbors of its neighbors,
		i.e. two-hopes neighborhood
		"""

		merge_count = int(reduction_factor * len(vertices))
		return self.get_greed_twohops(vertices, merge_count, matching)

	def get_greed_twohops(self, vertices, merge_count, matching, reverse=True):
		"""
		The best match is selected for each vertex use its two-hops
		neighborhood.
		"""

		# Search two-hopes neighborhood for each vertex in selected layer
		dict_edges = dict()
		visited = [0] * self.vcount()
		for vertex in vertices:
			neighborhood = self.neighborhood(vertices=vertex, order=2)
			twohops = neighborhood[(len(self['adjlist'][vertex]) + 1):]
			for twohop in twohops:
				if visited[twohop] == 1: continue
				dict_edges[(vertex, twohop)] = self['similarity'](vertex, twohop)
			visited[vertex] = 1

		# Select promising matches or pair of vertices
		edges = sorted(dict_edges.items(), key=operator.itemgetter(1), reverse=reverse)
		for edge, value in edges:
			if (matching[edge[0]] == edge[0]) and (matching[edge[1]] == edge[1]):
				matching[edge[0]] = edge[1]
				matching[edge[1]] = edge[0]
				merge_count -= 1
			if merge_count == 0: break

	def greed_rand_twohops(self, vertices, reduction_factor, matching):
		"""
		Matches are restricted between vertices that are not adjacent
		but are only allowed to match with neighbors of its neighbors,
		i.e. two-hopes neighborhood. This version use a random seed.
		"""

		merge_count = int(reduction_factor * len(vertices))
		return self.get_greed_rand_twohops(vertices, merge_count, matching)

	def get_greed_rand_twohops(self, vertices, merge_count, matching):
		"""
		The best match is selected from a random seed and use its two-hops
		neighborhood.
		"""

		visited = [0] * self.vcount()
		index = 0
		sample_vertices = sample(vertices, len(vertices))
		while merge_count > 0 and index < len(vertices):
			# Randomly select a vertex v of V
			vertex = sample_vertices[index]
			if visited[vertex] == 1:
				index += 1
				continue
			# Select the edge (v, u) of E wich maximum score
			# Tow hopes restriction: It ensures that the match only occurs
			# between vertices of the same type
			neighborhood = self.neighborhood(vertices=vertex, order=2)
			twohops = neighborhood[(len(self['adjlist'][vertex]) + 1):]
			_max = 0.0
			neighbor = vertex
			for twohop in twohops:
				if visited[twohop] == 1: continue
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

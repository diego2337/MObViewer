#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Similarity measures of two vertices
=====================================================

Copyright (C) 2016 Alan Valejo <alanvalejo@gmail.com> All rights reserved

These functions calculates similarity scores for vertices based on their
connection patterns. When calculating the similarities, it is assumed
that every vertex is linked to itself.

This file is part of Similarity.

Similarity is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Similarity is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Similarity. If not, see <http://www.gnu.org/licenses/>.

Required:
	.. _igraph: http://igraph.sourceforge.net
"""

import math

from scipy.spatial.distance import cosine
from scipy.spatial.distance import cdist
from numpy import dot
from numpy.linalg import norm
from numpy import linalg as LA
from scipy import spatial

__maintainer__ = 'Alan Valejo'
__author__ = 'Alan Valejo'
__email__ = 'alanvalejo@gmail.com'
__credits__ = ['Alan Valejo']
__license__ = 'GNU'
__docformat__ = 'markdown en'
__version__ = '0.1'
__date__ = '2017-12-01'

class Similarity(object):

	graph, adjlist = (None,) * 2

	def __init__(self, graph, adjlist):
		self.graph = graph
		self.adjlist = adjlist

	def modularity(self, i, j):
		score = self.weighted_common_neighbors(i, j)
		strength = self.graph['strength']
		i_strenght = self.graph.vs[i]['strength']
		j_strenght = self.graph.vs[j]['strength']
		return (score / strength) - ((i_strength * j_strength) / (strength * strength))

	def nmf_cosine(self, i, j):
		""" The similarity between two nodes is given by the cosine of the
		angle between the corresponding columns in H, multiplied
		by their norms. """

		h_i = self.graph.nmf_array(i)
		h_j = self.graph.nmf_array(j)
		# cosine = 1 - spatial.distance.cosine(h_i, h_j)
		# cosine = cdist([h_i], [h_j], 'jaccard')
		# return cosine[0][0]
		cosine = dot(h_i, h_j) / (norm(h_i) * norm(h_j))
		return LA.norm(h_i, 1) * LA.norm(h_j, 1) * cosine

	def weight(self, i, j):
		""" Calculates pairwise weight edge on a geiven graph. """

		return self[i, j]

	def preferential_attachment(self, i, j):
		""" Calculates pairwise preferential attachment similarities on a given unweighted graph. """

		return float(self.graph.degree(i)) * float(self.graph.degree(j))

	def common_neighbors(self, i, j):
		""" Calculates pairwise common neighbors similarity on a given unweighted graph. """

		return len(self.adjlist[i].intersection(self.adjlist[j]))

	def mysimilarity(self, i, j):
		""" Calculates pairwise common neighbors similarity on a given unweighted graph. """

		return len(self.adjlist[i].intersection(self.adjlist[j]))

	def get_common_neighbors(self, i, j):
		""" Calculates pairwise common neighbors similarity on a given unweighted graph. """

		return self.adjlist[i].intersection(self.adjlist[j])

	def weighted_common_neighbors(self, i, j):
		"""
		Calculates pairwise common neighbors similarity uses the edge-weight information
		on a given unweighted graph.
		"""

		_sum = 0.0
		cn = self.adjlist[i].intersection(self.adjlist[j])
		for z in cn:
			_sum += (self.graph[i, z] + self.graph[j, z]) / 2
		return _sum

	def jaccard(self, i, j):
		""" Calculates pairwise jaccard similarity on a given unweighted graph. """

		isect = len(self.adjlist[i].intersection(self.adjlist[j]))
		union = (len(self.adjlist[i]) + len(self.adjlist[j]) - isect)
		return 0 if union == 0 else isect / float(union)

	def salton(self, i, j):
		""" Calculates pairwise solton similarity on a given unweighted graph. """

		product = float(self.graph.degree(i)) * float(self.graph.degree(j))
		if product == 0.0:
			return 0.0

		isect = len(self.adjlist[i].intersection(self.adjlist[j]))
		return isect / math.sqrt(product)

	def adamic_adar(self, i, j):
		""" Calculates pairwise adamic adar similarity on a given unweightedgraph. """

		score = 0.0
		for isect in self.adjlist[i].intersection(self.adjlist[j]):
			degree = self.graph.degree(isect)
			if degree != 0:
				score += 1 / math.log(degree)
		return score

	def resource_allocation(self, i, j):
		""" Calculates pairwise resource allocation similarity on a given unweighted graph. """

		score = 0.0
		for isect in self.adjlist[i].intersection(self.adjlist[j]):
			degree = self.graph.degree(isect)
			if degree != 0:
				score += 1 / degree
		return score

	def sorensen(self, i, j):
		""" Calculates pairwise sorensen similarity on a given unweighted graph. """

		_sum = float(self.graph.degree(i)) * float(self.graph.degree(j))
		if _sum == 0.0:
			return 0.0

		isect = 2 * len(self.adjlist[i].intersection(self.adjlist[j]))
		return isect / _sum

	def hub_promoted(self, i, j):
		""" Calculates pairwise hub promoted similarity on a given unweighted graph. """

		minimum = min(float(self.graph.degree(i)), float(self.graph.degree(j)))
		if minimum == 0.0:
			return 0.0

		isect = len(self.adjlist[i].intersection(self.adjlist[j]))
		return isect / minimum

	def hub_depressed(self, i, j):
		""" Calculates pairwise hub depressed similarity on a given unweighted graph. """

		maximum = max(float(self.graph.degree(i)), float(self.graph.degree(j)))
		if maximum == 0.0:
			return 0.0

		isect = len(self.adjlist[i].intersection(self.adjlist[j]))
		return isect / maximum

	def leicht_holme_newman(self, i, j):
		""" Calculates pairwise leicht holmeNewman similarity on a given unweighted graph. """

		product = float(self.graph.degree(i)) * float(self.graph.degree(j))
		if product == 0.0:
			return 0.0

		isect = len(self.adjlist[i].intersection(self.adjlist[j]))
		return isect / product

	def within_common_neighbors(self, i, j):
		"""
		Calculates pairwise inter-cluster common neighbors (WCN) similarity on a
		given unweighted graph. WCN considering solely the subset of within-cluster
		common neighbors instead of the set of all common neighbors
		"""

		isect = self.adjlist[i].intersection(self.adjlist[j])
		within_isect = 0.0
		for vertex in isect:
			if self.vs[vertex]['membership'] == self.vs[i]['membership']:
				within_isect += 1.0
		return within_isect

	def within_jaccard(self, i, j):
		"""
		Calculates pairwise inter-cluster jaccard (WJac) similarity on a
		given unweighted graph. WJac considering solely the subset of within-cluster
		common neighbors instead of the set of all common neighbors
		"""

		isect = self.adjlist[i].intersection(self.adjlist[j])
		within_isect = 0.0
		for vertex in isect:
			if self.vs[vertex]['membership'] == self.vs[i]['membership']:
				within_isect += 1.0
		union = (len(self.adjlist[i]) + len(self.adjlist[j]) - within_isect)
		return 0 if union == 0 else within_isect / float(union)

	def within_salton(self, i, j):
		"""
		Calculates pairwise inter-cluster salton (WSal) similarity on a
		given unweighted graph. WSal considering solely the subset of within-cluster
		common neighbors instead of the set of all common neighbors
		"""

		product = float(self.graph.degree(i)) * float(self.graph.degree(j))

		if product == 0.0:
			return 0.0

		isect = self.adjlist[i].intersection(self.adjlist[j])
		within_isect = 0.0
		for vertex in isect:
			if self.vs[vertex]['membership'] == self.vs[i]['membership']:
				within_isect += 1.0
		return within_isect / math.sqrt(product)

	def within_adamic_adar(self, i, j):
		"""
		Calculates pairwise inter-cluster adamic adar (WAA) similarity on a
		given unweighted graph. WAA considering solely the subset of within-cluster
		common neighbors instead of the set of all common neighbors
		"""

		score = 0.0
		for isect in self.adjlist[i].intersection(self.adjlist[j]):
			if self.vs[isect]['membership'] == self.vs[i]['membership']:
				degree = self.graph.degree(isect)
				if degree != 0:
					score += 1 / math.log(degree)
		return score

	def within_resource_allocation(self, i, j):
		"""
		Calculates pairwise inter-cluster resource allocation (WRL) similarity on a
		given unweighted graph. WRL considering solely the subset of within-cluster
		common neighbors instead of the set of all common neighbors
		"""

		score = 0.0
		for isect in self.adjlist[i].intersection(self.adjlist[j]):
			if self.vs[isect]['membership'] == self.vs[i]['membership']:
				degree = self.graph.degree(isect)
				if degree != 0:
					score += 1 / degree
		return score

	def within_sorensen(self, i, j):
		"""
		Calculates pairwise inter-cluster sorensen (WSor) similarity on a
		given unweighted graph. WSor considering solely the subset of within-cluster
		common neighbors instead of the set of all common neighbors
		"""

		_sum = float(self.graph.degree(i)) * float(self.graph.degree(j))
		if _sum == 0.0:
			return 0.0

		isect = self.adjlist[i].intersection(self.adjlist[j])
		within_isect = 0.0
		for vertex in isect:
			if self.vs[vertex]['membership'] == self.vs[i]['membership']:
				within_isect += 2.0
		return within_isect / _sum

	def within_hub_promoted(self, i, j):
		"""
		Calculates pairwise inter-cluster hub promoted (WHP) similarity on a
		given unweighted graph. WHP considering solely the subset of within-cluster
		common neighbors instead of the set of all common neighbors
		"""

		minimum = min(float(self.graph.degree(i)), float(self.graph.degree(j)))
		if minimum == 0.0:
			return 0.0

		isect = self.adjlist[i].intersection(self.adjlist[j])
		within_isect = 0.0
		for vertex in isect:
			if self.vs[vertex]['membership'] == self.vs[i]['membership']:
				within_isect += 1.0
		return within_isect / minimum

	def within_hub_depressed(self, i, j):
		"""
		Calculates pairwise inter-cluster hub depressed (WHD) similarity on a
		given unweighted graph. WHD considering solely the subset of within-cluster
		common neighbors instead of the set of all common neighbors
		"""

		maximum = max(float(self.graph.degree(i)), float(self.graph.degree(j)))
		if maximum == 0.0:
			return 0.0

		isect = self.adjlist[i].intersection(self.adjlist[j])
		within_isect = 0.0
		for vertex in isect:
			if self.vs[vertex]['membership'] == self.vs[i]['membership']:
				within_isect += 1.0
		return within_isect / maximum

	def within_leicht_holme_newman(self, i, j):
		"""
		Calculates pairwise inter-cluster leicht holme newman (WLHN) similarity on a
		given unweighted graph. WLHN considering solely the subset of within-cluster
		common neighbors instead of the set of all common neighbors
		"""

		product = float(self.graph.degree(i)) * float(self.graph.degree(j))
		if product == 0.0:
			return 0.0

		isect = self.adjlist[i].intersection(self.adjlist[j])
		within_isect = 0.0
		for vertex in isect:
			if self.vs[vertex]['membership'] == self.vs[i]['membership']:
				within_isect += 1.0
		return within_isect / product

	def wic(self, i, j):
		"""
		Calculates similarity between a pair of vertices using information from
		intra-cluster or within-cluster (W) and inter-cluster (IC) common
		neighbors of these vertices.
		"""

		isect = self.adjlist[i].intersection(self.adjlist[j])
		nWcn = 0.0 # Intra cluster or intra community
		nIcn = 0.0 # Inter clusters or inter comunities
		for vertex in isect:
			if self.vs[vertex]['membership'] == self.vs[i]['membership']:
				nWcn += 1.0
			else:
				nIcn += 1.0
		return nWcn if (nIcn == 0.0) else nWcn / nIcn

	def lastfm_age(self, i, j):
		"""
		Calculates similarity between a pair of vertices based on their 'age' attribute. The larger the difference, the closer they are together.
		"""

		if self.graph.vs[i]['age'] > self.graph.vs[j]['age']:
			return (1.0 / self.graph.vs[i]['age'] - self.graph.vs[j]['age'])
		elif self.graph.vs[i]['age'] < self.graph.vs[j]['age']:
			return (1.0 / self.graph.vs[j]['age'] - self.graph.vs[i]['age'])
		else:
			return 1.1

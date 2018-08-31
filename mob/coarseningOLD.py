#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Coarsening
=====================================================

Copyright (C) 2017 Alan Valejo <alanvalejo@gmail.com> All rights reserved.

In coarsening strategy a sequence (or hierarchy) of smaller networks is
constructed from the original network, such that $|V_0| > |V_1| > ... > |V_N|$.
Such a hierarchy represents the network on multiple scales.

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

import sys
import os
import argparse
import igraph
import logging
import json
import numpy

from datetime import datetime
from timing import Timing
from multiprocessing import Process
from similarity import Similarity
from mob import load

__maintainer__ = 'Alan Valejo'
__author__ = 'Alan Valejo'
__email__ = 'alanvalejo@gmail.com'
__credits__ = ['Alan Valejo', 'Geraldo Pereira Rocha Filho', 'Maria Cristina Ferreira de Oliveira', 'Alneu de Andrade Lopes']
__homepage__ = 'https://github.com/alanvalejo/mob'
__license__ = 'GNU'
__docformat__ = 'markdown en'
__version__ = '0.1'
__date__ = '2017-12-01'

# Returns one of the non-zero numbers from a list.
# @param {tuple} tup Tuple of numbers.
# @return {number} One of the numbers from tuple which is non-zero.
def getNonZeroValue(tup):
	for i in range(0, len(tup)):
		if(tup[i] != 0):
			return tup[i]
	return '-1'

def main():
	"""
	Main entry point for the application when run from the command line.
	"""

	# Parse options command line
	description = 'Coarsening bipartite networks basead on neighborhood.'
	parser = argparse.ArgumentParser(description=description, formatter_class=lambda prog: argparse.HelpFormatter(prog, max_help_position=50, width=150))
	parser._action_groups.pop()

	optional = parser.add_argument_group('optional arguments')
	optional.add_argument('-f', '--filename', dest='filename', action='store', type=str, metavar='FILE', default=None, help='name of the %(metavar)s to be loaded')
	optional.add_argument('-v', '--vertices', dest='vertices', action='store', nargs='+', type=int, metavar=('int', 'int'), default=None, help='number of vertices for each layer')
	optional.add_argument('-d', '--directory', dest='directory', action='store', type=str, metavar='DIR', default=None, help='directory of FILE if it is not current directory')
	optional.add_argument('-o', '--output', dest='output', action='store', type=str, metavar='FILE', default=None, help='name of the %(metavar)s to be save')
	optional.add_argument('-k', '--k', dest='k', action='store', type=int, metavar='int', default=10, help='k nmf')
	optional.add_argument('-r', '--rf', dest='reduction_factor', action='store', type=float, metavar=('float', 'float'), nargs='+', default=None, help='reduction factor for each layer')
	optional.add_argument('-m', '--ml', dest='max_levels', action='store', type=int, metavar=('int', 'int'), nargs='+', default=None, help='max levels')
	optional.add_argument('-c', '--matching', dest='matching', action='store', type=str, metavar='str', nargs='+', default=None, help='matching method')
	optional.add_argument('-s', '--similarity', dest='similarity', action="store", type=str, metavar='str', nargs='+', default=None, help='similarity measure')
	optional.add_argument('-cf', '--conf', dest='conf', action='store', type=str, metavar='FILE', default=None, help='name of the %(metavar)s to be loaded')

	optional.add_argument('--save_conf', dest='save_conf', action='store_true', default=False, help='save config file')
	optional.add_argument('--save_ncol', dest='save_ncol', action='store_true', default=False, help='save ncol format')
	optional.add_argument('--save_gml', dest='save_gml', action='store_true', default=False, help='save gml format')
	optional.add_argument('--save_source', dest='save_source', action='store_true', default=False, help='save source reference')
	optional.add_argument('--save_predecessor', dest='save_predecessor', action='store_true', default=False, help='save predecessor reference')
	optional.add_argument('--save_hierarchy', dest='save_hierarchy', action='store_true', default=False, help='save all levels of hierarchy of coarsening')
	optional.add_argument('--save_timing', dest='save_timing', action='store_true', default=False, help='save timing in json')
	optional.add_argument('--show_timing', dest='show_timing', action='store_true', default=False, help='show timing')
	optional.add_argument('--unique_key', dest='unique_key', action='store_true', default=False, help='output date and time as unique_key')

	parser._action_groups.append(optional)
	options = parser.parse_args()

	# Instanciation of log
	log = logging.getLogger('MOb')
	level = logging.WARNING
	logging.basicConfig(level=level, format="%(message)s")

	# Instanciation of timing
	timing = Timing(['Snippet', 'Time [m]', 'Time [s]'])

	with timing.timeit_context_add('Pre-processing'):
		if options.conf:
			json_dict = json.load(open(options.conf))
			argparse_dict = vars(options)
			argparse_dict.update(json_dict)

		if options.filename and options.vertices is None:
			log.warning('Vertices are required when filename is given.')
			sys.exit(1)

		# Process directory and output file
		if options.directory is None:
			options.directory = os.path.dirname(os.path.abspath(options.filename))
		else:
			if not os.path.exists(options.directory):
				os.makedirs(options.directory)
		if not options.directory.endswith('/'):
			options.directory += '/'
		if options.output is None:
			filename, extension = os.path.splitext(os.path.basename(options.filename))
			options.output = filename + '_coarsened_'
		if options.unique_key:
			now = datetime.now()
			options.output = options.output + '_' + now.strftime('%Y%m%d%H%M%S%f')

		# Create default values for optional parameters
		if options.reduction_factor is None:
			options.reduction_factor = [0.5] * len(options.vertices)
		if options.max_levels is None:
			options.max_levels = [3] * len(options.vertices)
		if options.matching is None:
			options.matching = ['greedy_seed_twohops'] * len(options.vertices)
		if options.similarity is None:
			options.similarity = ['weighted_common_neighbors'] * len(options.vertices)

		# Validation of list values
		if len(options.reduction_factor) == 1:
			options.reduction_factor = [options.reduction_factor[0]] * len(options.vertices)
		if len(options.max_levels) == 1:
			options.max_levels = [options.max_levels[0]] * len(options.vertices)
		if len(options.matching) == 1:
			options.matching = [options.matching[0]] * len(options.vertices)
		if len(options.similarity) == 1:
			options.similarity = [options.similarity[0]] * len(options.vertices)

		# Verification of the dimension of the parameters
		if len(options.vertices) != len(options.reduction_factor):
			log.warning('Sizes of input arguments -v and -r do not match.')
			sys.exit(1)
		if len(options.vertices) != len(options.max_levels):
			log.warning('Sizes of input arguments -v and -m do not match.')
			sys.exit(1)
		if len(options.matching) != len(options.vertices):
			log.warning('Sizes of input arguments -v and -c do not match.')
			sys.exit(1)
		if len(options.similarity) != len(options.similarity):
			log.warning('Sizes of input arguments -v and -s do not match.')
			sys.exit(1)

		# Validation of matching method
		valid_matching = ['greedy_seed_twohops', 'greedy_twohops']
		for index, matching in enumerate(options.matching):
			matching = matching.lower()
			if matching not in valid_matching:
				log.warning('Matching method is unvalid.')
				sys.exit(1)
			options.matching[index] = matching

		# Validation of similarity measure
		valid_similarity = ['common_neighbors', 'mysimilarity', 'weighted_common_neighbors', 'salton', 'preferential_attachment', 'jaccard', 'adamic_adar', 'resource_allocation', 'sorensen', 'hub_promoted', 'hub_depressed', 'leicht_holme_newman', 'nmf_cosine', 'modularity']
		for index, similarity in enumerate(options.similarity):
			similarity = similarity.lower()
			if similarity not in valid_similarity:
				log.warning('Similarity misure is unvalid.')
				sys.exit(1)
			options.similarity[index] = similarity

	# Load bipartite graph
	with timing.timeit_context_add('Load'):
		graph = load(options.filename, options.vertices)
		graph['level'] = [0] * graph['layers']

	# Coarsening
	hierarchy_graphs = []
	hierarchy_levels = []
	layers_to_contract = numpy.where(numpy.array(options.max_levels) > 0)[0]
	with timing.timeit_context_add('Coarsening'):
		while not graph['level'] == options.max_levels:

			matching = range(graph.vcount())
			levels = graph['level']

			for layer in layers_to_contract:
				if levels[layer] == options.max_levels[layer]:
					continue
				levels[layer] += 1
				graph['similarity'] = getattr(Similarity(graph, graph['adjlist']), options.similarity[layer])
				start = sum(graph['vertices'][0:layer])
				end = sum(graph['vertices'][0:layer + 1])
				matching_method = getattr(graph, options.matching[layer])
				matching_method(range(start, end), matching, reduction_factor=options.reduction_factor[layer])

			coarse = graph.coarsening(matching)
			coarse['level'] = levels
			graph = coarse
			if options.save_hierarchy or graph['level'] == options.max_levels:
				hierarchy_graphs.append(graph)
				hierarchy_levels.append(levels[:])

	# Save
	output = options.directory + options.output
	with timing.timeit_context_add('Save'):

		for levels, graph in reversed(zip(hierarchy_levels, hierarchy_graphs)):

			if options.save_conf:
				# with open(output + str(levels) + '.conf', 'w+') as f:
				with open(output + 'n' + str(getNonZeroValue(levels)) + '.conf', 'w+') as f:
					d = {}
					d['source_filename'] = options.filename
					d['source_v0'] = options.vertices[0]
					d['source_v1'] = options.vertices[1]
					d['source_vertices'] = options.vertices[0] + options.vertices[1]
					d['edges'] = graph.ecount()
					d['vertices'] = graph.vcount()
					d['reduction_factor'] = options.reduction_factor
					d['max_levels'] = options.max_levels
					d['similarity'] = options.similarity
					d['matching'] = options.matching
					for layer in range(graph['layers']):
						vcount = str(len(graph.vs.select(type=layer)))
						attr = 'v' + str(layer)
						d[attr] = vcount
						d['levels'] = levels
					json.dump(d, f, indent=4)

			if options.save_gml:
				del graph['adjlist']
				graph['vertices'] = ' '.join(str(e) for e in graph['vertices'])
				graph['layers'] = str(graph['layers'])
				graph['level'] = ','.join(map(str, graph['level']))
				graph.vs['name'] = map(int, range(0, graph.vcount()))
				for v in graph.vs():
					v['source'] = ','.join(map(str, v['source']))
					v['predecessor'] = ','.join(map(str, v['predecessor']))
				# graph.write(output + str(levels) + '.gml', format='gml')
				# graph.write(output + 'l' + ''.join(str(options.reduction_factor[0]).split('.')) + 'r' + ''.join(str(options.reduction_factor[1]).split('.')) + 'n' + str(getNonZeroValue(levels)) + '.gml', format='gml')
				graph.write(output + 'l' + ''.join(str(options.reduction_factor[0]).split('.')) + 'r' + ''.join(str(options.reduction_factor[1]).split('.')) + 'nl' + str(levels[0]) + 'nr' + str(levels[1]) + '.gml', format='gml')

			if options.save_ncol:
				# graph.write(output + str(levels) + '.ncol', format='ncol')
				graph.write(output + 'n' + str(getNonZeroValue(levels)) + '.ncol', format='ncol')

			if options.save_source:
				# with open(output + str(levels) + '.source', 'w+') as f:
				with open(output + 'n' + str(getNonZeroValue(levels)) + '.source', 'w+') as f:
					for v in graph.vs():
						f.write(' '.join(map(str, v['source'])) + '\n')

			if options.save_predecessor:
				# with open(output + str(levels) + '.predecessor', 'w+') as f:
				with open(output + 'n' + str(getNonZeroValue(levels)) + '.predecessor', 'w+') as f:
					for v in graph.vs():
						f.write(' '.join(map(str, v['predecessor'])) + '\n')

			if not options.save_hierarchy:
				break

	if options.show_timing:
		timing.print_tabular()
	if options.save_timing:
		# timing.save_json(output + str(levels) + '.timing')
		timing.save_json(output + '.timing')


if __name__ == "__main__":
	sys.exit(main())

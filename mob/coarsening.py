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
import sharedmem
import argparse
import igraph
import logging
import json

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

def main():
	"""
	Main entry point for the application when run from the command line.
	"""

	# Parse options command line
	description = 'Coarsening bipartite networks basead on neighborhood.'
	parser = argparse.ArgumentParser(description=description, formatter_class=lambda prog: argparse.HelpFormatter(prog, max_help_position=50, width=150))
	parser._action_groups.pop()

	required = parser.add_argument_group('required arguments')
	required.add_argument('-f', '--filename', required=True, dest='filename', action='store', type=str, metavar='FILE', default=None, help='name of the %(metavar)s to be loaded')
	required.add_argument('-v', '--vertices', required=True, dest='vertices', action='store', nargs='+', type=int, metavar=('int', 'int'), default=None, help='number of vertices for each layer')

	optional = parser.add_argument_group('optional arguments')
	optional.add_argument('-d', '--directory', dest='directory', action='store', type=str, metavar='DIR', default=None, help='directory of FILE if it is not current directory')
	optional.add_argument('-o', '--output', dest='output', action='store', type=str, metavar='FILE', default=None, help='name of the %(metavar)s to be save')
	optional.add_argument('-r', '--rf', dest='reduction_factor', action='store', nargs='+', type=float, metavar=('float', 'float'), default=None, help='reduction factor for each layer')
	optional.add_argument('-m', '--ml', dest='max_levels', action='store', nargs='+', type=int, metavar=('int', 'int'), default=None, help='max levels (default: %(default)s)')
	optional.add_argument('-c', '--matching', dest='matching', action='store', type=str, metavar='str', nargs='+', default='greedy_twohops', help='matching method (default: %(default)s)')
	optional.add_argument('-s', '--similarity', dest='similarity', action="store", type=str, metavar='str', nargs='+', default='weighted_common_neighbors', help='similarity measure (default: Common Neighbors)')
	optional.add_argument('-l', '--layers_to_contract', dest='layers_to_contract', action='store', nargs='+', type=int, metavar=('int', 'int'), default=None, help='layers that will be processed')
	optional.add_argument('-e', '--extension', dest='extension', action='store', type=str, metavar='str', default='ncol', help='output extension (default: %(default)s)')
	optional.add_argument('--save_hierarchy', dest='save_hierarchy', action='store_true', default=False, help='save all levels of hierarchy of coarsening (default: %(default)s)')
	optional.add_argument('--show_timing', dest='show_timing', action='store_true', default=False, help='show timing (default: %(default)s)')
	optional.add_argument('--save_timing_csv', dest='save_timing_csv', action='store_true', default=False, help='save timing in csv (default: %(default)s)')
	optional.add_argument('--save_timing_json', dest='save_timing_json', action='store_true', default=False, help='save timing in csv (default: %(default)s)')
	optional.add_argument('--unique_key', dest='unique_key', action='store_true', default=False, help='output date and time as unique_key (default: %(default)s)')

	parser._action_groups.append(optional)
	parser._action_groups.append(required)
	options = parser.parse_args()

	# Instanciation of log
	log = logging.getLogger('OPM')
	level = logging.WARNING
	logging.basicConfig(level=level, format="%(message)s")

	# Instanciation of timing
	timing = Timing(['Snippet', 'Time [m]', 'Time [s]'])

	# Create default values for optional parameters
	if options.reduction_factor is None:
		options.reduction_factor = [0.5] * len(options.vertices)
	if options.max_levels is None:
		options.max_levels = [3] * len(options.vertices)
	if options.layers_to_contract is None:
		options.layers_to_contract = range(len(options.vertices))

	# Verification of the dimension of the parameters
	if len(options.vertices) != len(options.reduction_factor):
		log.warning('Sizes of input arguments -v and -r do not match.')
		sys.exit(1)
	if len(options.vertices) != len(options.max_levels):
		log.warning('Sizes of input arguments -v and -m do not match.')
		sys.exit(1)

	# Process directory and output file
	if options.directory is None:
		options.directory = os.path.dirname(os.path.abspath(options.filename))
	else:
		if not os.path.exists(options.directory): os.makedirs(options.directory)
	if not options.directory.endswith('/'): options.directory += '/'
	if options.output is None:
		filename, extension = os.path.splitext(os.path.basename(options.filename))
		options.output = filename + '_coarsened_'
	if options.unique_key:
		now = datetime.now()
		options.output = options.output + '_' + now.strftime('%Y%m%d%H%M%S%f')

	# Validation of matching method
	if type(options.matching) is list: options.matching = '_'.join(options.matching)
	options.matching = options.matching.lower()
	if options.matching not in ['greedy_seed_twohops', 'greedy_twohops', 'greedy_seed_modularity', 'greedy_modularity']:
		log.warning('Matching method is unvalid.')
		sys.exit(1)

	# Validation of output extension
	if options.extension not in ['ncol', 'gml', 'pajek']:
		log.warning('Supported formats: ncol, gml and pajek.')
		sys.exit(1)

	# Validation of similarity measure
	valid_similarity = ['common_neighbors', 'weighted_common_neighbors',
	'salton', 'preferential_attachment', 'jaccard', 'adamic_adar', 'resource_allocation',
	'sorensen', 'hub_promoted', 'hub_depressed', 'leicht_holme_newman']
	if type(options.similarity) is list: options.similarity = '_'.join(options.similarity)
	options.similarity = options.similarity.lower()
	if options.similarity not in valid_similarity:
		log.warning('Similarity misure is unvalid.')
		sys.exit(1)

	# Load bipartite graph
	with timing.timeit_context_add('Load'):
		graph = load(options.filename, options.vertices)
		graph['level'] = [0] * graph['layers']

	# Coarsening
	hierarchy_graphs = [graph]
	hierarchy_levels = [graph['level'][:]]
	with timing.timeit_context_add('Coarsening'):
		while not graph['level'] == options.max_levels:

			graph['similarity'] = getattr(Similarity(graph, graph['adjlist']), options.similarity)
			matching_method = getattr(graph, options.matching)
			matching = range(graph.vcount())
			levels = graph['level']

			if 'modularity' in options.matching:
				graph.vs['strength'] = graph.strength(range(graph.vcount()), weights='weight')

			for layer in options.layers_to_contract:
				if levels[layer] == options.max_levels[layer]: continue
				levels[layer] += 1
				start = sum(graph['vertices'][0:layer])
				end = sum(graph['vertices'][0:layer + 1])
				matching_method(range(start, end), options.reduction_factor[layer], matching)

			coarse = graph.coarsening_pairs(matching)
			coarse['level'] = levels
			graph = coarse
			hierarchy_graphs.append(graph)
			hierarchy_levels.append(levels[:])

	# Save
	with timing.timeit_context_add('Save'):
		output = options.directory + options.output
		# Save json conf
		with open(output + '.conf', 'w+') as f:
			d = {}
			# Config for layers
			d['filename'] = output
			d['extension'] = options.extension
			d['layers'] = graph['layers']
			d['layers to contract'] = options.layers_to_contract
			for layer in options.layers_to_contract:
				d['rf'] = options.reduction_factor
				d['ml'] = options.max_levels
			d['matching method'] = options.matching
			d['similarity measure'] = options.similarity
			json.dump(d, f, indent=4)
		# Save graph
		for levels, graph in reversed(zip(hierarchy_levels, hierarchy_graphs)):
			# Save json conf
			with open(output + str(levels) + '.conf', 'w+') as f:
				d = {}
				d['edges'] = graph.ecount()
				d['vertices'] = graph.vcount()
				# General informations
				for layer in range(graph['layers']):
					vcount = str(len(graph.vs.select(type=layer)))
					attr = 'v' + str(layer)
					d[attr] = vcount
					d['levels'] = levels
				json.dump(d, f, indent=4)
			# Save graph
			if options.extension == 'gml':
				del graph['adjlist']
				graph.vs['name'] = map(str, range(0, graph.vcount()))
				graph['vertices'] = ' '.join(str(e) for e in graph['vertices'])
				graph['layers'] = str(graph['layers'])
				graph['level'] = str(graph['level'])
			graph.write(output + str(levels) + '.' + options.extension, format=options.extension)
			# Save super-vertices
			with open(output + str(levels) + '.cluster', 'w+') as f:
				for v in graph.vs():
					f.write(' '.join(map(str, v['original'])) + '\n')
			if not options.save_hierarchy: break

	if options.show_timing: timing.print_tabular()
	if options.save_timing_csv: timing.save_csv(output + '.timing')
	if options.save_timing_json: timing.save_json(output + '.timing')

if __name__ == "__main__":
	sys.exit(main())

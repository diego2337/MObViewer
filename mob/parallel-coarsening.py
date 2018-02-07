#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Coarsening
=====================================================

Copyright (C) 2017 Alan Valejo <alanvalejo@gmail.com> All rights reserved.
Copyright (C) 2017 Vinicius Ferreira <viniciusferreira97@gmail.com> All rights reserved.

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
	optional.add_argument('-c', '--matching', dest='matching', action='store', type=str, metavar='str', nargs='+', default='greed_twohopes', help='matching method (default: %(default)s)')
	optional.add_argument('-s', '--similarity', dest='similarity', action="store", type=str, metavar='str', nargs='+', default='common_neighbors', help='similarity measure (default: Common Neighbors)')
	optional.add_argument('-l', '--layers', dest='layers', action='store', nargs='+', type=int, metavar=('int', 'int'), default=None, help='layers that will be processed')
	optional.add_argument('-e', '--extension', dest='extension', action='store', type=str, metavar='str', default='ncol', help='output extension (default: %(default)s)')
	optional.add_argument('--show_timing', dest='show_timing', action='store_true', default=False, help='show timing (default: %(default)s)')
	optional.add_argument('--save_timing', dest='save_timing', action='store_true', default=False, help='save timing in csv (default: %(default)s)')

	required.add_argument('--required_arg')
	optional.add_argument('--optional_arg')
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
	if options.layers is None:
		options.layers = range(len(options.vertices))

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
		options.output = options.directory + filename
	else:
		options.output = options.directory + options.output

	# Validation of matching method
	if type(options.matching) is list: options.matching = '_'.join(options.matching)
	options.matching = options.matching.lower()
	if options.matching not in ['greed_rand_twohopes', 'greed_twohopes']:
		log.warning('Matching method is unvalid.')
		sys.exit(1)

	# Validation of output extension
	if options.extension not in ['ncol', 'gml', 'pajek']:
		log.warning('Supported formats: ncol, gml and pajek.')
		sys.exit(1)

	# Validation of similarity measure
	valid_similarity = ['weight', 'common_neighbors', 'weighted_common_neighbors',
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
	with timing.timeit_context_add('Coarsening'):
		while not graph['level'] == options.max_levels:

			graph['similarity'] = getattr(Similarity(graph, graph['adjlist']), options.similarity)
			matching_method = getattr(graph, options.matching)
			matching = sharedmem.full(graph.vcount(), range(graph.vcount()), dtype='int')
			processes = []
			levels = graph['level']

			for layer in options.layers:
				if graph['level'][layer] == options.max_levels[layer]: continue
				levels[layer] += 1
				start = sum(graph['vertices'][0:layer])
				end = sum(graph['vertices'][0:layer + 1])
				processes.append(Process(target=matching_method, args=(range(start, end), options.reduction_factor[layer], matching)))
			for p in processes:
				p.start()
			for p in processes:
				p.join()

			coarse = graph.coarsening_pairs(matching)
			coarse['level'] = levels
			graph = coarse

	# Save
	with timing.timeit_context_add('Save'):
		R = str(len(graph.vs.select(type=0)))
		C = str(len(graph.vs.select(type=1)))
		ml = str(options.max_levels)
		rf = str(options.reduction_factor)
		output = options.output + '_R:' + R + '_C:' + C + '_ml:' + ml + '_rf:' + rf
		del graph['adjlist']
		graph.vs['name'] = map(str, range(0, graph.vcount()))
		graph['vertices'] = ' '.join(str(e) for e in graph['vertices'])
		graph['layers'] = str(graph['layers'])
		graph['level'] = str(graph['level'])
		# Save graph
		graph.write(output + '.' + options.extension, format=options.extension)
		# Save super-vertices
		with open(output + '.cluster', 'w+') as f:
			for v in graph.vs():
				index = str(v.index)
				antecessor = ' '.join(map(str, v['antecessor']))
				f.write(index + ': ' + antecessor + '\n')

	if options.show_timing: timing.print_tabular()
	if options.save_timing: timing.save(output)

if __name__ == "__main__":
	sys.exit(main())

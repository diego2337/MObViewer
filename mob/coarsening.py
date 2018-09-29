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

MOB is a free software and non-commercial use only: you can be use it for
creating unlimited applications, distribute in binary or object form only,
modify source-code and distribute modifications (derivative works). Please,
giving credit to the author by citing the papers. License will expire in 2018,
July, and will be renewed.

Owner or contributors are not liable for any direct, indirect, incidental,
special, exemplary, or consequential damages, (such as loss of data or profits,
and others) arising in any way out of the use of this software,
even if advised of the possibility of such damage.
"""

import sys
import numpy
import os
import inspect
import json

import models.args as args
import models.helper as helper
import models.helperigraph as helperigraph

from models.timing import Timing
from models.similarity import Similarity

import sharedmem
from multiprocessing import Process

__maintainer__ = 'Alan Valejo'
__author__ = 'Alan Valejo'
__email__ = 'alanvalejo@gmail.com'
__credits__ = ['Alan Valejo', 'Geraldo Pereira Rocha Filho', 'Maria Cristina Ferreira de Oliveira', 'Alneu de Andrade Lopes']
__homepage__ = 'https://github.com/alanvalejo/mob'
__license__ = 'GNU'
__docformat__ = 'markdown en'
__version__ = '0.1'
__date__ = '2018-10-05'

def main():
	"""
	Main entry point for the application when run from the command line.
	"""

	# Timing instanciation
	timing = Timing(['Snippet', 'Time [m]', 'Time [s]'])

	with timing.timeit_context_add('Pre-processing'):

		# Setup parse options command line
		current_path = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
		parser = args.setup_parser(current_path + '/args/coarsening.json')
		options = parser.parse_args()
		args.update_json(options)
		args.check_output(options)

		# Log instanciation
		log = helper.initialize_logger(dir='log', output='log')

		if options.input and options.vertices is None:
			log.warning('Vertices are required when input is given.')
			sys.exit(1)

		# Create default values for optional parameters
		if options.reduction_factor is None:
			options.reduction_factor = [0.5] * len(options.vertices)
		if options.max_levels is None:
			options.max_levels = [3] * len(options.vertices)
		if options.matching is None:
			options.matching = ['rgmb'] * len(options.vertices)
		if options.similarity is None:
			options.similarity = ['weighted_common_neighbors'] * len(options.vertices)
		if options.itr is None:
			options.itr = [10] * len(options.vertices)
		if options.upper_bound is None:
			options.upper_bound = [2.0] * len(options.vertices)
		if options.global_min_vertices is None:
			options.global_min_vertices = [None] * len(options.vertices)
		if options.tolerance is None:
			options.tolerance = [None] * len(options.vertices)

		# Validation of list values
		if len(options.reduction_factor) == 1:
			options.reduction_factor = [options.reduction_factor[0]] * len(options.vertices)
		if len(options.max_levels) == 1:
			options.max_levels = [options.max_levels[0]] * len(options.vertices)
		if len(options.matching) == 1:
			options.matching = [options.matching[0]] * len(options.vertices)
		if len(options.similarity) == 1:
			options.similarity = [options.similarity[0]] * len(options.vertices)
		if len(options.itr) == 1:
			options.itr = [options.itr[0]] * len(options.vertices)
		if len(options.upper_bound) == 1:
			options.upper_bound = [options.upper_bound[0]] * len(options.vertices)
		if len(options.global_min_vertices) == 1:
			options.global_min_vertices = [options.global_min_vertices[0]] * len(options.vertices)
		if len(options.tolerance) == 1:
			options.tolerance = [options.tolerance[0]] * len(options.vertices)

		# Verification of the dimension of the parameters
		if len(options.vertices) != len(options.reduction_factor):
			log.warning('Sizes of input arguments -v and -r do not match.')
			sys.exit(1)
		if len(options.vertices) != len(options.max_levels):
			log.warning('Sizes of input arguments -v and -m do not match.')
			sys.exit(1)
		if len(options.vertices) != len(options.matching):
			log.warning('Sizes of input arguments -v and -c do not match.')
			sys.exit(1)
		if len(options.vertices) != len(options.similarity):
			log.warning('Sizes of input arguments -v and -s do not match.')
			sys.exit(1)
		if len(options.vertices) != len(options.itr):
			log.warning('Size of input arguments -v and -imlp do not match.')
			sys.exit(1)
		if len(options.vertices) != len(options.upper_bound):
			log.warning('Size of input arguments -v and -ub do not match.')
			sys.exit(1)
		if len(options.vertices) != len(options.global_min_vertices):
			log.warning('Size of input arguments -v and -gmv do not match.')
			sys.exit(1)
		if len(options.vertices) != len(options.tolerance):
			log.warning('Size of input arguments -v and -gmv do not match.')
			sys.exit(1)

		# Validation of matching method
		valid_matching = ['rgmb', 'gmb', 'nmlp', 'mlp', 'hem', 'lem', 'rm']
		for index, matching in enumerate(options.matching):
			matching = matching.lower()
			if matching not in valid_matching:
				log.warning('Matching method is unvalid.')
				sys.exit(1)
			options.matching[index] = matching

		# Validation of similarity measure
		valid_similarity = ['max_weight', 'weight', 'common_neighbors', 'weighted_common_neighbors',
		'salton', 'preferential_attachment', 'jaccard', 'adamic_adar',
		'resource_allocation', 'sorensen', 'hub_promoted', 'hub_depressed',
		'leicht_holme_newman', 'lastfm_age']
		for index, similarity in enumerate(options.similarity):
			similarity = similarity.lower()
			if similarity not in valid_similarity:
				log.warning('Similarity measure is unvalid.')
				sys.exit(1)
			options.similarity[index] = similarity

		for layer in range(len(options.vertices)):
			if options.matching[layer] in ['rgmb', 'gmb', 'hem', 'lem', 'rm']:
				if options.global_min_vertices[layer] is not None:
					options.global_min_vertices[layer] = None
					text = 'Matching method ' + options.matching[layer]
					text += ' (setted in layer '
					text += str(layer) + ') does not accept -gmv parameter.'
					log.warning(text)
				if options.reduction_factor[layer] > 0.5:
					options.reduction_factor[layer] = 0.5
					text = 'Matching method ' + options.matching[layer]
					text += ' (setted in layer '
					text += str(layer) + ') does not accept -rf > 0.5.'
					log.warning(text)

	# Load bipartite graph
	with timing.timeit_context_add('Load'):
		graph = helperigraph.load(options.input, options.vertices)
		graph['level'] = [0] * graph['layers']
		source_ecount = graph.ecount()
		# f = open(options.attr)
		# js = json.load(f)
		# for element in js['nodes']:
		# 	keys = element.keys()
		# 	for k in keys:
		# 		graph.vs[element['id']][k] = element[k]
		# 		# if k in graph.vs[element['id']]:
		# 		# if hasattr(graph.vs, k):
		# 			# graph.vs.select(name_eq=element['id'])[k].append(element[k])
		# 			# graph.vs[element['id']].append(element[k])
		# 		# else:
		# 			# graph.vs[element['id']][k] = []
		# 			# graph.vs[element['id']][k].append(element[k])
		# 			# graph.vs[element['id']] = []
		# 			# graph.vs[element['id']].append(element[k])
		# f.close()

	# Coarsening
	with timing.timeit_context_add('Coarsening'):
		hierarchy_graphs = []
		hierarchy_levels = []
		running = True
		while running:
			running = False

			membership = sharedmem.full(graph.vcount(), range(graph.vcount()), dtype='int')
			levels = graph['level']
			contract = False

			processes = []
			for layer in range(len(graph['vertices'])):

				matching_layer = True
				if (options.global_min_vertices[layer] is None):
					if levels[layer] >= options.max_levels[layer]:
						matching_layer = False
				elif (graph['vertices'][layer] <= options.global_min_vertices[layer]):
					matching_layer = False

				if matching_layer:
					contract = True
					running = True
					levels[layer] += 1

					graph['similarity'] = getattr(Similarity(graph, graph['adjlist']), options.similarity[layer])
					start = sum(graph['vertices'][0:layer])
					end = sum(graph['vertices'][0:layer + 1])
					vertices = range(start, end)

					param = dict(reduction_factor=options.reduction_factor[layer])

					if options.matching[layer] in ['mlp', 'nmlp']:
						param['upper_bound'] = options.upper_bound[layer]
						param['n'] = options.vertices[layer]
						param['global_min_vertices'] = options.global_min_vertices[layer]
					if options.matching[layer] in ['mlp', 'nmlp', 'gmb', 'rgmb']:
						param['vertices'] = vertices
					if options.matching[layer] in ['mlp']:
						param['tolerance'] = options.tolerance[layer]
						param['itr'] = options.itr[layer]

					if options.matching[layer] in ['hem', 'lem', 'rm']:
						one_mode_graph = graph.weighted_one_mode_projection(vertices)
						matching_method = getattr(one_mode_graph, options.matching[layer])
					else:
						matching_method = getattr(graph, options.matching[layer])

					processes.append(Process(target=matching_method, args=[membership], kwargs=param))

			for p in processes:
				p.start()
			for p in processes:
				p.join()

			if contract:
				coarse = graph.contract(membership)
				coarse['level'] = levels
				graph = coarse

				if options.save_hierarchy or not running:
					hierarchy_graphs.append(graph)
					hierarchy_levels.append(levels[:])

	# Save
	with timing.timeit_context_add('Save'):

		output = options.output
		for index, obj in enumerate(reversed(zip(hierarchy_levels, hierarchy_graphs))):
			levels, graph = obj

			if options.save_conf:
				# with open(output + '_' + str(index) + '.conf', 'w+') as f:
				with open(output + 'l' + ''.join(str(options.reduction_factor[0]).split('.')) + 'r' + ''.join(str(options.reduction_factor[1]).split('.')) + 'nl' + str(levels[0]) + 'nr' + str(levels[1]) + '.conf', 'w+') as f:
					d = {}
					d['source_input'] = options.input
					d['source_vertices'] = [options.vertices[0], options.vertices[1]]
					d['source_vcount'] = options.vertices[0] + options.vertices[1]
					d['source_ecount'] = source_ecount
					d['ecount'] = graph.ecount()
					d['vcount'] = graph.vcount()
					d['vertices'] = graph['vertices']
					d['reduction_factor'] = options.reduction_factor
					d['max_levels'] = options.max_levels
					d['similarity'] = options.similarity
					d['matching'] = options.matching
					d['level'] = levels
					d['upper_bound'] = options.upper_bound
					d['global_min_vertices'] = options.global_min_vertices
					d['itr'] = options.itr
					json.dump(d, f, indent=4)

			if options.save_ncol:
				# graph.write(output + '_' + str(index) + '.ncol', format='ncol')
				graph.write(output + 'l' + ''.join(str(options.reduction_factor[0]).split('.')) + 'r' + ''.join(str(options.reduction_factor[1]).split('.')) + 'nl' + str(levels[0]) + 'nr' + str(levels[1]) + '.ncol', format='ncol')

			if options.save_source:
				# with open(output + '_' + str(index) + '.source', 'w+') as f:
				with open(output + 'l' + ''.join(str(options.reduction_factor[0]).split('.')) + 'r' + ''.join(str(options.reduction_factor[1]).split('.')) + 'nl' + str(levels[0]) + 'nr' + str(levels[1]) + '.predecessor', 'w+') as f:
					for v in graph.vs():
						f.write(' '.join(map(str, v['source'])) + '\n')

			if options.save_predecessor:
				with open(output + '_' + str(index) + '.predecessor', 'w+') as f:
					for v in graph.vs():
						f.write(' '.join(map(str, v['predecessor'])) + '\n')

			if options.save_successor:
				numpy.savetxt(output + '_' + str(index) + '.successor', graph.vs['successor'], fmt='%d')

			if options.save_weight:
				numpy.savetxt(output + '_' + str(index) + '.weight', graph.vs['weight'], fmt='%d')

			if options.save_gml:
				del graph['adjlist']
				del graph['similarity']
				graph['layers'] = str(graph['layers'])
				if(type(graph['vertices']) is str):
					graph['vertices'] = graph['vertices'].split(",")
				if(type(graph['level']) is str):
					graph['level'] = graph['level'].split(",")
				graph['vertices'] = ' '.join(map(str, graph['vertices']))
				graph['level'] = ' '.join(map(str, graph['level']))
				graph.vs['name'] = map(str, range(0, graph.vcount()))
				graph.vs['type'] = map(str, graph.vs['type'])
				graph.vs['weight'] = map(str, graph.vs['weight'])
				graph.vs['successor'] = map(str, graph.vs['successor'])
				for v in graph.vs():
					if(type(v['source']) is str):
						v['source'] = v['source'].split(",")
					if(type(v['predecessor']) is str):
						v['predecessor'] = v['predecessor'].split(",")
					v['source'] = ','.join(map(str, v['source']))
					v['predecessor'] = ','.join(map(str, v['predecessor']))
				# graph.write(output + '_' + str(index) + '.gml', format='gml')
				graph.write(output + 'l' + ''.join(str(options.reduction_factor[0]).split('.')) + 'r' + ''.join(str(options.reduction_factor[1]).split('.')) + 'nl' + str(levels[0]) + 'nr' + str(levels[1]) + '.gml', format='gml')

			if not options.save_hierarchy:
				break

	if options.show_timing:
		timing.print_tabular()
	if options.save_timing_csv:
		timing.save_csv(output + '-timing.csv')
	if options.save_timing_json:
		timing.save_json(output + '-timing.json')

if __name__ == "__main__":
	sys.exit(main())

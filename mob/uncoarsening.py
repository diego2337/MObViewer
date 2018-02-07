#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Uncoarsening
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

def main():
	"""
	Main entry point for the application when run from the command line.
	"""

	# Parse options command line
	description = 'Uncoarsening bipartite networks basead on neighborhood.'
	parser = argparse.ArgumentParser(description=description, formatter_class=lambda prog: argparse.HelpFormatter(prog, max_help_position=50, width=150))
	parser._action_groups.pop()

	required = parser.add_argument_group('required arguments')
	required.add_argument('-f', '--filename', required=True, dest='filename', action='store', type=str, metavar='FILE', default=None, help='name of the %(metavar)s to be loaded')
	required.add_argument('-m', '--membership', required=True, dest='membership', action='store', type=str, metavar='FILE', default=None, help='name of the %(metavar)s to be loaded')
	required.add_argument('-v', '--vertices', required=True, dest='vertices', action='store', nargs='+', type=int, metavar=('int', 'int'), default=None, help='number of vertices for each layer')

	optional = parser.add_argument_group('optional arguments')
	optional.add_argument('-d', '--directory', dest='directory', action='store', type=str, metavar='DIR', default=None, help='directory of FILE if it is not current directory')
	optional.add_argument('-o', '--output', dest='output', action='store', type=str, metavar='FILE', default=None, help='name of the %(metavar)s to be save')
	optional.add_argument('--show_timing', dest='show_timing', action='store_true', default=False, help='show timing (default: %(default)s)')
	optional.add_argument('--save_timing_csv', dest='save_timing_csv', action='store_true', default=False, help='save timing in csv (default: %(default)s)')
	optional.add_argument('--save_timing_json', dest='save_timing_json', action='store_true', default=False, help='save timing in csv (default: %(default)s)')
	optional.add_argument('--unique_key', dest='unique_key', action='store_true', default=False, help='output date and time as unique_key (default: %(default)s)')

	parser._action_groups.append(required)
	parser._action_groups.append(optional)
	options = parser.parse_args()

	# Instanciation of log
	log = logging.getLogger('OPM')
	level = logging.WARNING
	logging.basicConfig(level=level, format="%(message)s")

	# Instanciation of timing
	timing = Timing(['Snippet', 'Time [m]', 'Time [s]'])

	# Process directory and output file
	if options.directory is None:
		options.directory = os.path.dirname(os.path.abspath(options.filename))
	else:
		if not os.path.exists(options.directory): os.makedirs(options.directory)
	if not options.directory.endswith('/'): options.directory += '/'
	if options.output is None:
		filename, extension = os.path.splitext(os.path.basename(options.filename))
		options.output = filename + '_coarsened'
	if options.unique_key:
		now = datetime.now()
		options.output = options.output + '_' + now.strftime('%Y%m%d%H%M%S%f')

	# Load bipartite graph
	with timing.timeit_context_add('Load'):
		graph = load(options.filename, options.vertices)

	# Uncoarsening
	with timing.timeit_context_add('Uncoarsening'):

		graph.vs['membership'] = numpy.loadtxt(options.membership, delimiter='\n', dtype=int)
		sv_set = []
		cluster_file, extension = os.path.splitext(options.filename)
		with open(cluster_file + '.cluster') as f:
			for line in f:
				line = map(int, line.rstrip('\n').split(' '))
				sv_set.append(line)
		mapping = {}
		for sv_id, cluster_id in enumerate(graph.vs['membership']):
			for vertex in sv_set[sv_id]:
				mapping[vertex] = cluster_id

	output = options.directory + options.output
	with timing.timeit_context_add('Save'):

		with open(output + '.membership', 'w+') as f:
			for vertex, cluster_id in sorted(mapping.items()):
				f.write(str(cluster_id) + '\n')

	if options.show_timing: timing.print_tabular()
	if options.save_timing_csv: timing.save_csv(output + '.timing')
	if options.save_timing_json: timing.save_json(output + '.timing')

if __name__ == "__main__":
	sys.exit(main())

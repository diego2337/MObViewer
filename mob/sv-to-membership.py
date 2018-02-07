#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Bipartite statistic
==========================

Copyright (C) 2016 Alan Valejo <alanvalejo@gmail.com> All rights reserved

...

.. _igraph: http://igraph.sourceforge.net
"""

import math
import copy
import numpy as np
import sys
import os
import argparse
import igraph
import logging
import igraph
import numpy

from timing import Timing
from scipy.weave import inline
from itertools import combinations, izip

__author__ = 'Alan Valejo'
__license__ = 'MIT'
__docformat__ = 'restructuredtext en'
__version__ = '0.1'

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

	optional = parser.add_argument_group('optional arguments')
	optional.add_argument('-d', '--directory', dest='directory', action='store', type=str, metavar='DIR', default=None, help='directory of FILE if it is not current directory')
	optional.add_argument('-o', '--output', dest='output', action='store', type=str, metavar='FILE', default=None, help='name of the %(metavar)s to be save')
	optional.add_argument('--output_time', dest='output_time', action='store_true', default=False, help='output date and time (default: %(default)s)')

	required.add_argument('--required_arg')
	optional.add_argument('--optional_arg')
	options = parser.parse_args()

	# Instanciation of log
	log = logging.getLogger('OPM')
	level = logging.WARNING
	logging.basicConfig(level=level, format="%(message)s")

	# Process directory and output file
	if options.directory is None:
		options.directory = os.path.dirname(os.path.abspath(options.filename))
	else:
		if not os.path.exists(options.directory): os.makedirs(options.directory)
	if not options.directory.endswith('/'): options.directory += '/'
	if options.output is None:
		filename, extension = os.path.splitext(os.path.basename(options.filename))
		options.output = filename
		if options.output_time:
			timestr = time.strftime("%Y%m%d%H%M%S")
			options.output = options.output + '_' + timestr

	sv_set = []
	with open(options.directory + filename + '.cluster') as f:
		for line in f:
			line = map(int, line.rstrip('\n').split(' '))
			sv_set.append(line)
	membership = {}
	for sv_id, vertices in enumerate(sv_set):
		for vertex in vertices:
			membership[vertex] = sv_id

	print membership
	print options.output

	with open(options.directory + options.output + '.membership', 'w+') as f:
		for vertex, cluster_id in sorted(membership.items()):
			f.write(str(cluster_id) + '\n')

if __name__ == "__main__":
	sys.exit(main())

####################################################################################
# Program to run all conversions from graphs while executing multilevel paradigm.  #
# Author: Diego Silva Cintra                                                       #
# Date: 07 March 2019	                                                           #
####################################################################################
import argparse
import json
import os
import glob

# @desc Convert bipartite graph to appropriate format, and execute multilevel paradigm algorithm.
# @param {str} file File name representing bipartite graph.
# @param {str} path Path where bipartite graph is.
# @param {str} coarsening Path where 'coarsening.py' and other scripts are.
# @param {str} input Path where 'input.json' file is.
def getAndProcessCoarsening(file, path, coarsening, input):
	# Step 1 - Run scripts #
	print("Converting .json to .ncol file.")
	os.system('python ' + coarsening + 'jsonToNcol3.py --input ' + path + file + '.json --output ' + path + file + '.ncol')
	# Step 2 - Navigate to folder containing 'coarsening.py' and other scripts #
	pwd = os.getcwd()
	print("Running multilevel paradigm coarsening.")
	os.system('cd ' + input + '; python ' + coarsening + 'coarsening.py -cnf ' + input + 'input.json; cd ' + pwd)
	# Step 3 - Convert all '.gml' files to '.json' #
	lst = glob.glob(path + file + "*.json")
	print("Converting .gml files to .json.")
	for graph in lst:
		if(graph.find('Coarsened') != -1):
			os.system('python ' + coarsening + 'gmlToJson3.py ' + graph.split(".")[0] + '.gml ' + graph.split(".")[0] + '.json')
	print("Adjusting properties accordingly.")
	# Step 4 - Open '.conf' file and get total levels and reduction factor #
	confFile = open(path + file + 'Coarsened.conf', 'r')
	confJson = json.load(confFile)
	confFile.close()
	os.system('python ' + coarsening + 'setProperties.py -f ' + path + ' -n ' + file + '.json -l ' + str(confJson['total_levels'][0]) + ' ' + str(confJson['total_levels'][1]) + ' -r ' + str(confJson['reduction_factor'][0]) + ' ' + str(confJson['reduction_factor'][1]))

if __name__=="__main__":
	# Instantiate argument parser
    description = 'Program to run all conversions from graphs while executing multilevel paradigm.'
    parser = argparse.ArgumentParser(description=description)
    parser._action_groups.pop()

    # Add argument group (required)
    required = parser.add_argument_group('required arguments')
    required.add_argument('-f', '--file', required=True, dest='file', action='store', type=str, default=None, help='File name representing bipartite graph (with no extension) .')
    required.add_argument('-p', '--path', required=True, dest='path', action='store', type=str, default=None, help='Path where bipartite graph is.')
    required.add_argument('-c', '--coarsening', required=True, dest='coarsening', action='store', type=str, default=None, help='Path where \'coarsening.py\' and other scripts are.')
    required.add_argument('-i', '--input', required=True, dest='input', action='store', type=str, default=None, help='Path where \'input.json\' file is.')

    # Run parser
    options = parser.parse_args()

    getAndProcessCoarsening(options.file, options.path, options.coarsening, options.input)
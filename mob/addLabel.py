######################################################################################
### Program to open .json and .comm files and assign a label based on communities. ###
### Author: Diego Cintra                         				                   ###
### Date: 22 Oct 2018															   ###
######################################################################################
import argparse
import json

if __name__ == '__main__':
	# Instantiate argument parser
    description = 'Program to open .json and .comm files and assign a label based on communities.'
    parser = argparse.ArgumentParser(description=description)
    parser._action_groups.pop()

    # Add argument group (required)
    required = parser.add_argument_group('required arguments')
    required.add_argument('-i', '--input', required=True, dest='input', action='store', type=str, default=None, help='.json file name.')

    # Add argument group (optional)
    optional = parser.add_argument_group('optional arguments')
    optional.add_argument('-c', '--comm', required=False, dest='comm', action='store', default=None, help='.comm file name.')
    optional.add_argument('-o', '--output', required=False, dest='output', action='store', default='network', help='.json filename output.')

    # Run the parser
    options = parser.parse_args()

    # Step 1 - Open files #
    jsonFile = open(options.input, 'r')
    jsFile = json.load(jsonFile)
    jsonFile.close()
    if(options.comm is not None):
        comm = open(options.comm, 'r')
    jsonLabeled = open(options.output + '.json', 'w')
    # Step 2 - Assign proper communities to jsFile #
    for idx, line in enumerate(comm):
        line = line[:-1]
        line = line.split(" ")
        for el in line:
            jsFile['nodes'][int(el)]['comm'] = str(idx)

    # Step 3 - Dump jsFile #
    json.dump(jsFile, jsonLabeled, indent=4)

    # Step 4 - Close files #
    comm.close()
    jsonLabeled.close()

###################################################################################
# Simple program to list all graphs in a given directory, and get coarsened       #
# bipartite graph according to a given level.                                     #
# Author: Diego Silva Cintra                                                      #
# Date: 13 august 2018                                                            #
###################################################################################
import argparse
import glob
import os

if __name__ == "__main__":
    # Instantiate argument parser
    description = 'Program to list all .json graphs in a given directory, and get coarsened bipartite graph according to a given level.'
    parser = argparse.ArgumentParser(description=description)
    parser._action_groups.pop()

    # Add argument group (required)
    required = parser.add_argument_group('required arguments')
    required.add_argument('-i', '--input', required=True, dest='input', action='store', type=str, default=None, help='.json input file name.');
    required.add_argument('-d', '--directory', required=True, dest='directory', action='store', type=str, default=None, help='Directory to list files from.');
    required.add_argument('-l', '--level', required=True, dest='level', action='store', type=str, default=None, help='Number of levels to decrease from most coarsened graph.');

    # Run the parser
    options = parser.parse_args()

    # Step 1 - List all bipartite graphs - from https://stackoverflow.com/questions/22154818/python-check-all-file-with-a-specific-name-in-a-directory
    os.chdir(options.directory + "/")
    lst = glob.glob(options.input + "*.json")

    # Step 2 - Check for most coarsened file
    reductionFactor = ''
    graphName = ''
    nl = nr = 0
    for graph in lst:
        if(graph.find("nl") != -1):
            if(reductionFactor is ''):
                reductionFactor = lst[0].split("Coarsened")[1].split("nl")[0]
                graphName = lst[0].split("Coarsened")[0]
            levels = graph.split(".")[0].split("nl")[1].split("nr")
            if(int(levels[0]) > nl):
                nl = int(levels[0])
            if(int(levels[1]) > nr):
                nr = int(levels[1])

    # Step 3 - Decrease n levels from most coarsened file to get specific coarsened graph
    for i in range(int(options.level), 0, -1):
        if(nl > 0 and nr > 0):
            if(nl == nr):
                nl = nl - 1
                nr = nr -1
            elif(nl > nr):
                nl = nl - 1
            else:
                nr = nr - 1
        else:
            break

    # Step 4 - Print out specific coarsened graph name
    if(nl == 0 or nr == 0):
        # print "No graph as coarsened as level input. Printing original graph."
        print graphName + ".json"
    else:
        print graphName +  "Coarsened" + reductionFactor + "nl" + str(nl) + "nr" + str(nr) + ".json"
        # print graph

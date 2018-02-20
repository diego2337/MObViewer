####################################################
### Simple script to convert .gml file to .json. ###
### Author: Diego S. Cintra                      ###
### Date: 20/02/2018                             ###
####################################################

import sys, os, re, random
# import os
# import re
# import random

# Doesnt' work, python is pass-by-sharing
def changeState(stateVariable, newState, justChanged):
    stateVariable = newState
    justChanged = True

# Removes any unnecessary characters from line, defined by 'junkCharacters', returning a new line.
def removeTrash(line, junkCharacters):
    firstOccurenceOfWord = False
    space = False
    newLine = []
    i = 0
    while i < len(line):
        if(junkCharacters.count(line[i]) == 0):
            if(not firstOccurenceOfWord):
                firstOccurenceOfWord = True
            if(space):
                newLine.append(' ')
                space = False
            newLine.append(line[i])
        else:
            if(firstOccurenceOfWord):
                space = True

if __name__ == '__main__':
    # Variable declarations #
    # stateVariable: defines reading state of file:
    #   - START: initial state.
    #   - INTROSTATE: writing graph information such as if it's directed, number of vertice for each layer, number of levels and current level.
    #   - NODESTATE: defines initial node state, where braces are opened.
    #   - NODEWRITESTATE: defines an already opened node object being written.
    #   - EDGESTATE: defines initial edge state, where braces are opened.
    #   - EDGEWRITESTATE: defines an already opened edge object being written.
    #   - FINAL: end of program, close braces and finish execution.
    stateVariable = "START"
    justChanged = True
    junkCharacters = [' ', '\n', '\r', '\"']
    # tabs: variable to trace how many tabs must be applied.
    tabs = ""
    # Step 1: Open .gml file for reading and .json file for writing. #
    if(len(sys.argv) < 3):
        print "Usage: python gmlToJson3.py yourGmlFile.gml yourJsonFilename.json"
        exit()
    arquivo = open(sys.argv[1], 'r')
    jason = open(sys.argv[2], 'w+')

    # Step 2: Step through file, line by line #
    for line in arquivo:
        # Cutting of '\n'
        line = line[0:-1]
        if(stateVariable is "START"): # Program is in START
            if(line == "graph"): # Found keyword to change state
                tabs = "\t"
                jason.write("{\n" + tabs)
                jason.write("\"graphInfo\": [\n" + tabs + "{\n")
                tabs = "\t\t"
                jason.write(tabs)
            if(line == "["):
                # Change states
                stateVariable = "INTROSTATE"
                justChanged = True
        elif(stateVariable is "INTROSTATE"): # Program is in INTROSTATE
            if(line == "node"): # End of INTROSTATE
                stateVariable = "NODESTATE"
                justChanged = True
            elif(line == "edge"): # End of INTROSTATE
                stateVariable = "EDGESTATE"
                justChanged = True
            else: # Line has information
                line = removeTrash(line, junkCharacters)
                if(justChanged):
                    justChanged = False
                    jason.write("\"" + line.split(" ")[0] + "\": \"" + ''.join(line.split(" ")[1:-1]) + "\"")
                else:
                    jason.write(",\n" + tabs + "\"" + line.split(" ")[0] + "\": \"" + ''.join(line.split(" ")[1:-1]) + "\"\n")
        elif(stateVariable is "NODESTATE"): # Program is in NODESTATE
            break;
        elif(stateVariable is "NODEWRITESTATE"): # Program is in NODEWRITESTATE
            break;
        elif(stateVariable is "EDGESTATE"): # Program is in EDGESTATE
            break;
        elif(stateVariable is "EDGEWRITESTATE"): # Program is in EDGEWRITESTATE
            break;
        elif(stateVariable is "FINAL"): # Program is in FINAL
            break;

    jason.close()
    arquivo.close()

    # jason.write("{\n")
    # nodeBool = False
    # edgeBool = False
    # weightBool = False
    # twice = True
    # # two = True
    # for line in arquivo:
    #     if "graph" in line and "igraph" not in line:
    #         jason.write("\"graphInfo\": [\n{\n")
    #     elif "directed" in line:
    #         jason.write("\"directed\": \"")
    #         linha = line.split(" ")
    #         linha = linha[-1]
    #         linha = linha[:-1]
    #         jason.write(linha)
    #         jason.write("\",\n")
    #     elif "vlayer" in line:
    #         jason.write("\"vlayer\": \"")
    #         linha = line.split("\"")
    #         linha = linha[-2]
    #         jason.write(linha)
    #         jason.write("\",\n")
    #     elif "vertices" in line:
    #         jason.write("\"vlayer\": \"")
    #         linha = line.split("\"")
    #         linha = linha[-2]
    #         jason.write(linha)
    #         jason.write("\",\n")
    #     elif "nlayers" in line:
    #         jason.write("\"nlayers\": ")
    #         linha = line.split(" ")
    #         linha = linha[-1]
    #         linha = linha[:-1]
    #         jason.write(linha)
    #         jason.write(",\n")
    #     elif "level" in line:
    #         jason.write("\"level\": \"")
    #         linha = line.split("\"")
    #         linha = linha[-2]
    #         # if(len(linha.split("[")) != 0):
    #         #     linha = linha[1]
    #         #     linha = linha.split("]")
    #         #     linha = linha[0]
    #         jason.write(linha)
    #         jason.write("\",\n")
    #     elif "node" in line:
    #         if (not nodeBool):
    #             twice = False
    #             # two = False
    #             nodeBool = True
    #             jason.seek(-2, os.SEEK_END)
    #             # if (edgeBool):
    #             #     edgeBool = False
    #             #     jason.write("\n],\n")
    #             # else:
    #             #     jason.write("\n}\n],\n")
    #             jason.write("\n}\n],\n")
    #             jason.write("\"nodes\": [\n{\n")
    #         else:
    #             if (not weightBool):
    #                 jason.seek(-4, os.SEEK_END)
    #                 jason.write(",\n\"weight\": \"1\"\n},\n")
    #             else:
    #                 weightBool = False
    #             jason.write("{\n")
    #     elif "id" in line:
    #         jason.write("\"id\": \"")
    #         linha = line.split(" ")
    #         linha = linha[-1]
    #         linha = linha[:-1]
    #         jason.write(linha)
    #         jason.write("\",\n")
    #     elif "weight" in line:
    #         weightBool = True
    #         jason.write("\"weight\": \"")
    #         linha = line.split(" ")
    #         linha = linha[-1]
    #         linha = linha[:-1]
    #         jason.write(linha)
    #         jason.write("\",\n")
    #     elif "edge" in line:
    #         if (not edgeBool):
    #             edgeBool = True
    #             jason.seek(-2, os.SEEK_END)
    #             jason.write("\n],\n")
    #             jason.write("\"links\": [\n{\n")
    #         else:
    #             jason.write("{\n")
    #     elif "source" in line:
    #         jason.write("\"source\": \"")
    #         linha = line.split(" ")
    #         linha = linha[-1]
    #         linha = linha[:-1]
    #         jason.write(linha)
    #         jason.write("\",\n")
    #     elif "target" in line:
    #         jason.write("\"target\": \"")
    #         linha = line.split(" ")
    #         linha = linha[-1]
    #         linha = linha[:-1]
    #         jason.write(linha)
    #         jason.write("\",\n")
    #     elif "]" in line:
    #         if (not twice):
    #             # twice = True
    #             # two = True
    #             jason.seek(-2, os.SEEK_END)
    #             jason.write("\n},\n")
    #     # if(not two and twice):
    #     #     twice = False
    #
    # jason.seek(-4, os.SEEK_END)
    # jason.write("\n]\n}")

    # jason.close()
    # arquivo.close()

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
        i = i + 1
    return ''.join(newLine)

# Close current program state, by adding tabs with braces
def closeCurrentState(jason, tabs):
    jason.write("\n " + tabs + "}")

if __name__ == '__main__':
    # Variable declarations #
    # stateVariable: defines reading state of file:
    #   - START: initial state.
    #   - INTROSTATE: writing graph information such as if it's directed, number of vertice for each layer, number of levels and current level.
    #   - NODESTATE: defines initial node state, where braces are opened.
    #   - NODEWRITESTATE: defines an already opened node object being written.
    #   - NODEENDSTATE: defines a possible closing node object.
    #   - EDGESTATE: defines initial edge state, where braces are opened.
    #   - EDGEWRITESTATE: defines an already opened edge object being written.
    #   - EDGEENDSTATE: defines a possible closing edge object.
    #   - FINAL: end of program, close braces and finish execution.
    stateVariable = "START"
    justChanged = True
    junkCharacters = [chr(9), ' ', '\n', '\r', '\"']
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
        # line = line[0:-1]
        # i = 0
        # arr = []
        # while i < len(line):
        #     arr.append(ord(line[i]))
        #     i = i + 1
        # print arr
        line = removeTrash(line, junkCharacters)
        if(stateVariable is "START"): # Program is in START
            if(line == "graph"): # Found keyword to change state
                tabs = "\t"
                jason.write("{\n" + tabs)
                jason.write("\"graphInfo\": [\n" + tabs + "{\n")
                tabs = tabs + "\t"
                jason.write(tabs)
            if(line == "["):
                # Change states
                stateVariable = "INTROSTATE"
                justChanged = True
        elif(stateVariable is "INTROSTATE"): # Program is in INTROSTATE
            if(line == "node"): # End of INTROSTATE
                tabs = tabs[0:-1]
                closeCurrentState(jason, tabs)
                # Close brackets and create a node object
                jason.write("\n" + tabs + "],\n" + tabs + "\"nodes\": [")
                stateVariable = "NODESTATE"
                justChanged = True
            elif(line == "edge"): # End of INTROSTATE
                tabs = tabs[0:-1]
                closeCurrentState(jason, tabs)
                # Close brackets and create a link object
                jason.write("\n" + tabs + "],\n" + tabs + "\"links\": [")
                stateVariable = "EDGESTATE"
                justChanged = True
            else: # Line has information
                # line = removeTrash(line, junkCharacters)
                # print line
                if(justChanged):
                    justChanged = False
                    # jason.write("\"" + line.split(" ")[0] + "\": \"" + ''.join(line.split(" ")[1:]) + "\"")
                    jason.write("\"" + line.split(" ")[0] + "\": \"")
                    i = 1
                    while i < len(line.split(" ")):
                        jason.write(line.split(" ")[i])
                        if((i+1) != len(line.split(" "))):
                            jason.write(" ")
                        i = i + 1
                    jason.write("\"")
                else:
                    # jason.write(",\n" + tabs + "\"" + line.split(" ")[0] + "\": \"" + ''.join(line.split(" ")[1:]) + "\"\n")
                    jason.write(",\n" + tabs + "\"" + line.split(" ")[0] + "\": \"")
                    i = 1
                    while i < len(line.split(" ")):
                        jason.write(line.split(" ")[i])
                        if((i+1) != len(line.split(" "))):
                            jason.write(" ")
                        i = i + 1
                    jason.write("\"")
        elif(stateVariable is "NODESTATE"): # Program is in NODESTATE
            if(line == "]"): # End of NODESTATE
                # End of .gml file
                print "Node object must have at least id value. No information given. Program exiting with -1"
                exit(-1)
            elif(line != "node"): # End of NODESTATE
                if(justChanged):
                    justChanged = False
                    jason.write("\n" + tabs + "{")
                else:
                    jason.write(",\n" + tabs + "{")
                tabs = tabs + "\t"
                stateVariable = "NODEWRITESTATE"
                justChanged = True
        elif(stateVariable is "NODEWRITESTATE"): # Program is in NODEWRITESTATE
            if(line == "]"): # End of NODEWRITESTATE
                # Change to NODEENDSTATE
                stateVariable = "NODEENDSTATE"
            else: # Line has information
                if(justChanged):
                    justChanged = False
                    jason.write("\n" + tabs + "\"" + line.split(" ")[0] + "\": \"")
                else:
                    jason.write(",\n" + tabs + "\"" + line.split(" ")[0] + "\": \"")
                i = 1
                while i < len(line.split(" ")):
                    jason.write(line.split(" ")[i])
                    if((i+1) != len(line.split(" "))):
                        jason.write(" ")
                    i = i + 1
                jason.write("\"")
        elif(stateVariable is "NODEENDSTATE"): # Program is in NODEENDSTATE
            if(line == "]"): # End of NODEENDSTATE
                tabs = tabs[0:-1]
                closeCurrentState(jason, tabs)
                stateVariable = "FINAL"
            elif(line == "node"): # End of NODEENDSTATE
                tabs = tabs[0:-1]
                closeCurrentState(jason, tabs)
                stateVariable = "NODESTATE"
            elif(line == "edge"): # End of NODEENDSTATE
                tabs = tabs[0:-1]
                closeCurrentState(jason, tabs)
                jason.write("\n" + tabs + "],\n" + tabs + "\"links\": [")
                stateVariable = "EDGESTATE"
                justChanged = True
        elif(stateVariable is "EDGESTATE"): # Program is in EDGESTATE
            if(line == "]"): # End of EDGESTATE
                # End of .gml file
                print "Edge object must have at least id value. No information given. Program exiting with -1"
                exit(-1)
            elif(line != "edge"): # End of EDGESTATE
                if(justChanged):
                    justChanged = False
                    jason.write("\n" + tabs + "{")
                else:
                    jason.write(",\n" + tabs + "{")
                tabs = tabs + "\t"
                stateVariable = "EDGEWRITESTATE"
                justChanged = True
        elif(stateVariable is "EDGEWRITESTATE"): # Program is in EDGEWRITESTATE
            if(line == "]"): # End of EDGEWRITESTATE
                # Skip line
                stateVariable = "EDGEENDSTATE"
            else: # Line has information
                if(justChanged):
                    justChanged = False
                    jason.write("\n" + tabs + "\"" + line.split(" ")[0] + "\": \"")
                else:
                    jason.write(",\n" + tabs + "\"" + line.split(" ")[0] + "\": \"")
                i = 1
                while i < len(line.split(" ")):
                    jason.write(line.split(" ")[i])
                    if((i+1) != len(line.split(" "))):
                        jason.write(" ")
                    i = i + 1
                jason.write("\"")
        elif(stateVariable is "EDGEENDSTATE"): # Program is in EDGEENDSTATE
            if(line == "]"): # End of EDGEENDSTATE
                tabs = tabs[0:-1]
                closeCurrentState(jason, tabs)
                stateVariable = "FINAL"
            elif(line == "edge"): # End of EDGEENDSTATE
                tabs = tabs[0:-1]
                closeCurrentState(jason, tabs)
                stateVariable = "EDGESTATE"
            elif(line == "node"): # End of EDGEENDSTATE
                tabs = tabs[0:-1]
                closeCurrentState(jason, tabs)
                jason.write("\n" + tabs + "],\n" + tabs + "\"nodes\": [")
                stateVariable = "NODESTATE"
                justChanged = True

        if(stateVariable is "FINAL"): # Program is in FINAL
            jason.write("\n" + tabs + "]")
            tabs = tabs[0:-1]
            jason.write("\n" + tabs + "}")

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

###################################################
### Simple script to convert .gml file to .json ###
###################################################
import sys
import os
import re
import random
# This script was obtained from http://kgullikson88.github.io/blog/pypi-analysis.html

### Check to see if a dictionary contains a given element ###
def contains(dictionary, value):
    for key in dictionary:
        for i in dictionary[key]:
            for j in i:
                if(int(value) == j):
                    return str(key)
    return -1

### Creates an array of elements, according to line position ###
def mapCommunities(coverRow, coverCol):
    j = 0
    comms = {}
    comms2 = {}
    comms3 = {}
    comm = []
    # Iterate through '.coverrow' file
    for line in coverRow:
        c = line.split(" ")
        c2 = c[-1].split("\r")
        c[-1] = c2[0]
        for k in c:
            comm.append(int(k))
        comms[j] = comm
        j = j + 1
        comm = []

    # Iterate through '.covercol' file
    j = 0
    for line in coverCol:
        c = line.split(" ")
        c2 = c[-1].split("\r")
        c[-1] = c2[0]
        for k in c:
            comm.append(int(k))
        comms2[j] = comm
        j = j + 1
        comm = []

    # Merge communities dictionaries
    j = 0
    while(j in comms):
        comm = []
        comm.append(comms[j])
        comm.append(comms2[j])
        comms3[j] = comm
        j = j + 1
    # while(j in comms2):
    #     comms3[j] = comms2[j]
    #     j = j + 1

    return comms3


if __name__ == '__main__':
    arquivo = open(sys.argv[1], 'r')
    jason = open(sys.argv[2], 'w+')
    coverRow = open(sys.argv[3], 'r')
    coverCol = open(sys.argv[4], 'r')
    communities = mapCommunities(coverRow, coverCol)
    print communities
    coverRow.close()
    coverCol.close()
    jason.write("{\n")
    imports = []
    names = []
    classes = dict()
    nodeBool = False
    edgeBool = False
    twice = False
    two = False
    for line in arquivo:
        two = False
        if "igraph" in line:
            # Do nothing
            print "Skipping Line"
        elif "graph" in line:
            jason.write("\"graphInfo\": [\n{\n")
        elif "directed" in line:
            jason.write("\"directed\": \"")
            linha = line.split(" ")
            linha = linha[-1]
            linha = linha[:-1]
            jason.write(linha)
            jason.write("\",\n")
            # jason.write(line)
        elif "vertices" in line:
            jason.write("\"vlayer\": \"")
            linha = line.split("\"")
            linha = linha[-2]
            jason.write(linha)
            jason.write("\",\n")
            # jason.write(line)
        elif "layers" in line:
            jason.write("\"nlayers\": \"")
            linha = line.split(" ")
            linha = linha[-1]
            linha = linha[:-1]
            jason.write(linha)
            jason.write("\",\n")
            # linha = line.split("\"")
            # linha = linha[-2]
            # jason.write(linha)
            # jason.write("\",\n")
            # jason.write(line)
        elif "level" in line:
            jason.write("\"level\": \"")
            linha = line.split("\"")
            linha = linha[-2]
            jason.write(linha)
            jason.write("\",\n")
            # jason.write(line)
        elif "node" in line:
            if (not nodeBool):
                nodeBool = True
                jason.seek(-2, os.SEEK_END)
                jason.write("\n}\n],\n")
                jason.write("\"nodes\": [\n{\n")
            else:
                jason.write("{\n")
        elif "id" in line:
            jason.write("\"id\": \"")
            linha = line.split(" ")
            linha = linha[-1]
            linha = linha[:-1]
            jason.write(linha)
            if(contains(communities, linha) != -1):
                jason.write("\", \n")
                jason.write("\"group\": \"")
                jason.write(contains(communities, linha))
            jason.write("\",\n")
            jason.write("\"weight\": \"1\",\n")
        elif "weight" in line:
            jason.write("\"weight\": \"")
            linha = line.split(" ")
            linha = linha[-1]
            linha = linha[:-1]
            jason.write(linha)
            jason.write("\",\n")
        elif "edge" in line:
            if (not edgeBool):
                edgeBool = True
                jason.seek(-2, os.SEEK_END)
                jason.write("\n],\n")
                jason.write("\"links\": [\n{\n")
            else:
                jason.write("{\n")
        elif "source" in line:
            jason.write("\"source\": \"")
            linha = line.split(" ")
            linha = linha[-1]
            linha = linha[:-1]
            jason.write(linha)
            jason.write("\",\n")
        elif "target" in line:
            jason.write("\"target\": \"")
            linha = line.split(" ")
            linha = linha[-1]
            linha = linha[:-1]
            jason.write(linha)
            jason.write("\",\n")
        elif "]" in line:
            if (not twice):
                twice = True
                two = True
                jason.seek(-2, os.SEEK_END)
                jason.write("\n},\n")
        if(not two and twice):
            twice = False

    jason.seek(-2, os.SEEK_END)
    jason.write("\n]\n}")

    jason.close()
    arquivo.close()
    # write names
    # jason.write("\t\"nodes\": [\n")
    # for key,  value in classes.iteritems():
    #     jason.write("\t\t{\"id\": \""+key+"\"},\n")
    # jason.seek(-3, os.SEEK_END)
    # jason.truncate()
    # jason.write("\n\t],\n")
    # jason.write("\t\"links\": [\n")
    # for key, value in classes.iteritems():
    #     if(value in classes):
    #         jason.write("\t\t{\"source\":\""+key+"\", \"target\":\""+value+"\", \"value\":"+str(random.randint(1,30))+"},\n")
    # jason.seek(-3, os.SEEK_END)
    # jason.truncate()
    # jason.write("\n\t]")
    # jason.write("\n}\n")

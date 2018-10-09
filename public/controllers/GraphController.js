/**
 * Controller for graph related AJAX calls - based on https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/routes#Create_the_route-handler_callback_functions.
 * @author Diego Cintra
 * Date: 1 October 2018
 */

/** Variables */
var stringify = require('json-stable-stringify');

/** Require controller modules */
var indexController = require('./IndexController');
var systemController = require('./SystemController');

/** General functions */

/**
 * @desc Add necessary values for .json.
 * @param {string} data .json string containing graph data.
 * @returns {string} data .json string containing graph data.
 */
function addValues(data)
{
  return addMinAndMaxEdge(addMinAndMaxNode(addNumberOfEdgesToJSON(data)));
}

/**
 * @desc Add number of edges to .json string being created.
 * @public
 * @param {string} data - .json string.
 * @returns {string} .json string containing number of edges.
 */
function addNumberOfEdgesToJSON(data)
{
  var jason = JSON.parse(data);
  jason.graphInfo[0].edges = jason.links.length.toString();
  data = JSON.stringify(jason);
  return data;
}

/**
 * @desc Find and add maximum and minimum node weights at node set.
 * @param {string} data .json string containing graph data.
 * @returns {string} data .json string containing graph data.
 */
function addMinAndMaxNode(data)
{
  var max = 1, min = 1000000000;
  var jason = JSON.parse(data);
  for(var i = 0; i < jason.nodes.length; i++)
  {
    /** Check if weight exists */
    if(parseInt(jason.nodes[i].weight) != undefined)
    {
      if(parseInt(jason.nodes[i].weight) > max)
      {
        max = parseInt(jason.nodes[i].weight);
      }
      if(parseInt(jason.nodes[i].weight) < min)
      {
        min = parseInt(jason.nodes[i].weight);
      }
    }
  }
  /** Store in .json nodes weights */
  jason.graphInfo[0].maxNodeWeight = max;
  jason.graphInfo[0].minNodeWeight = min;
  return JSON.stringify(jason);
}

/**
* Read .json file stored on server-side, sending it to client side.
* @public
* @param {string} path Path string for fs variable to read.
* @param {Object} fs FileSystem API module.
* @param {Object} req header sent via HTTP from HTML page, from Express API module callback 'post'.
* @param {Object} res header to be sent via HTTP for HTML page, from Express API module callback 'post'.
* @returns {string} if any error occurs during file read, return it via console; otherwise return nothing.
*/
exports.readJsonFile = function(path, fs, req, res)
{
  var nLev = nl = nr = 0;
  req.body.firstSetLevel == undefined ? nl = 0 : nl = parseInt(req.body.firstSetLevel);
  req.body.secondSetLevel == undefined ? nr = 0 : nr = parseInt(req.body.secondSetLevel);
  fs.readFile(path, 'utf8', function(err, data){
    if(err)
    {
      return console.log(err);
    }
    else
    {
      /* Store graph size */
      if(indexController.graphSize.length == 0) JSON.parse(data).graphInfo[0].vlayer != undefined ? indexController.graphSize = JSON.parse(data).graphInfo[0].vlayer : indexController.graphSize = JSON.parse(data).graphInfo[0].vertices;
      /* Send data to client */
      res.type('text');
      res.end(JSON.stringify({graph: addValues(data), nLevels: [nl, nr], firstSetLevel: nl, secondSetLevel: nr, graphName: path, firstSet: req.body.coarsening, secondSet: req.body.coarseningSecondSet}));
    }
  });
}

/** Logic callback functions */


/**
 * Get predecessors of an array of indexes.
 * @public
 * @param {String} currentGraph Current graph file name.
 * @param {String} previousGraph Previous graph file name where predecessors lie.
 * @param {String} coarsenedFileName Current bipartite graph .json file to open.
 * @param {Array} indexes Array of indexes to check for predecessors.
 * @returns {Array} 'Real' predecessors of a given vertex.
 */
function getRealPredecessors(currentGraph, previousGraph, coarsenedFileName, indexes)
{
  /** Break condition for recursive function */
  if(currentGraph != previousGraph)
  {
    var dat = indexController.fs.readFileSync('uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + coarsenedFileName, 'utf8');
    let jsonInput = JSON.parse(dat);
    /** For each index, recursively find its predecessors */
    for(let i = 0; i < indexes.length; i++)
    {
      /** Get array of predecessors */
      let predecessors = jsonInput['nodes'][indexes[i]].predecessor;
      if(typeof(predecessors) == "string")
      {
        predecessors = predecessors.split(",");
        for(let j = 0; j < predecessors.length; j++)
        {
          predecessors[j] = parseInt(predecessors[j]);
        }
      }
      /** Increase current graph position */
      if(isNaN(currentGraph[currentGraph.length-1]))
      {
        currentGraph = currentGraph + "1";
      }
      else
      {
        var n = parseInt(currentGraph[currentGraph.length-1]) + 1;
        currentGraph = currentGraph.slice(0, -1);
        currentGraph = currentGraph + n.toString();
      }
      /** Decrease coarsenedFileName levels */
      let nl = parseInt(coarsenedFileName.split(".")[0].split("nl")[1][0]);
      let nr = parseInt(coarsenedFileName.split(".")[0].split("nr")[1][0]);
      if(nl != 1 && nr != 1)
      {
        /** If nl > nr, decrease only nl; if nl == nr, both must be decreased; otherwise, nr > nl, so decrease only nr */
        if(nl > nr)
        {indexController.graphSize
          nl = nl - 1;
        }
        else if(nl == nr)
        {
          nl = nl - 1;
          nr = nr - 1;
        }
        else
        {
          nr = nr - 1;
        }
        /** Rename coarsenedFileName */
        coarsenedFileName = coarsenedFileName.split(".")[0].split("nl")[0] + "nl" + nl.toString() + "nr" + nr.toString() + "." + coarsenedFileName.split(".")[1];
      }
      else
      {
        /** Rename coarsenedFileName */
        coarsenedFileName = coarsenedFileName.split("Coarsened")[0] + "." + coarsenedFileName.split(".")[1];
      }
      return getRealPredecessors(currentGraph, previousGraph, coarsenedFileName, predecessors);
    }
  }
  else
  {
    return indexes;
  }
}

/**
 * Get successors of an array of indexes.
 * @public
 * @param {String} currentGraph Current graph file name.
 * @param {String} nextGraph Next graph file name where successors lie.
 * @param {String} coarsenedFileName Current bipartite graph .json file to open.
 * @param {String} originalFileName Original bipartite graph .json file name to open.
 * @param {Array} indexes Array of indexes to check for predecessors.
 * @returns {Array} 'Real' successors of a given vertex.
 */
function getRealSuccessors(currentGraph, nextGraph, coarsenedFileName, originalFileName, indexes)
{
  /** Remove '\n' */
  originalFileName = originalFileName.slice(0, -1);
  /** Define which layer coarses the most */
  let maxValue = parseInt(originalFileName.split(".")[0].split("nr")[1][0]) < parseInt(originalFileName.split(".")[0].split("nl")[1][0]) ? 1 : 0;
  let minCoarsening = parseInt(originalFileName.split(".")[0].split("nl")[1][0]) < parseInt(originalFileName.split(".")[0].split("nr")[1][0]) ? parseInt(originalFileName.split(".")[0].split("nl")[1][0]) : parseInt(originalFileName.split(".")[0].split("nr")[1][0]);
  /** Break condition for recursive function */
  if(currentGraph != nextGraph)
  {
    var dat = indexController.fs.readFileSync('uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + coarsenedFileName, 'utf8');
    let jsonInput = JSON.parse(dat);
    /** For each index, recursively find its successors */
    for(let i = 0; i < indexes.length; i++)
    {
      /** Get array of successors */
      let successors = jsonInput['nodes'][indexes[i]].successor;
      if(typeof(successors) == "string")
      {
        successors = successors.split(",");
        for(let j = 0; j < successors.length; j++)
        {
          successors[j] = parseInt(successors[j]);
        }
      }
      /** Decrease current graph position */
      if(currentGraph[currentGraph.length-1] == '1')
      {
        currentGraph = currentGraph.slice(0, -1);
      }
      else
      {
        var n = parseInt(currentGraph[currentGraph.length-1]) - 1;
        currentGraph = currentGraph.slice(0, -1);
        currentGraph = currentGraph + n.toString();
      }
      /** Increase coarsenedFileName levels */
      let nl = coarsenedFileName.split(".")[0].split("nl");
      let nr = coarsenedFileName.split(".")[0].split("nr");
      if(nl.length != 1 && nr.length != 1)
      {
        nl = parseInt(nl[1][0]);
        nr = parseInt(nr[1][0]);
        /** If either one of nl or nr have reached minCoarsening level, only increase level from one of them; otherwise increase both levels */
        if(nl == minCoarsening || nr == minCoarsening)
        {
          maxValue == 1 ? nl = nl + 1 : nr = nr + 1;
        }
        else
        {
          nl = nl + 1;
          nr = nr + 1;
        }
        /** Rename coarsenedFileName */
        coarsenedFileName = coarsenedFileName.split(".")[0].split("nl")[0] + "nl" + nl.toString() + "nr" + nr.toString() + "." + coarsenedFileName.split(".")[1];
      }
      else
      {
        /** Rename coarsenedFileName */
        coarsenedFileName = coarsenedFileName.split(".")[0] + "Coarsened" + "";
      }
      return getRealSuccessors(currentGraph, nextGraph, coarsenedFileName, originalFileName, successors);
    }
  }
  else
  {
    return indexes;
  }
}

/**
 * Get edge weight from .json file, given source and target nodes.
 * @param {JSON} jsonFile Parsed .json file.
 * @param {int} source Source node id.
 * @param {int} target Target node id.
 * @returns {float} Edge weight.
 */
function getEdgeWeight(jsonFile, source, target)
{
  /** Find in 'links' array */
  var found = jsonFile['links'].find(x => (parseInt(x.source) == parseInt(source) && parseInt(x.target) == parseInt(target)) || (parseInt(x.source) == parseInt(target) && parseInt(x.target) == parseInt(source)));
  return found != undefined ? found.weight : 0.0;
}

/**
 * Concatenate float value.
 * @param {Float} value Value to be concatenated.
 */
function catFloat(value)
{
  return value.toString().split(".")[1] == undefined ? value.toString().split(".")[0] : value.toString().split(".")[0] + value.toString().split(".")[1];
}

/**
 * Process 'vertexIdStats.json' file, parsing it for usage in d3BarChart.
 * @param {String} stats Stats file converted in string format.
 */
function processStats(stats)
{
  var idStats = JSON.parse(stats);
  var d3Arr = [];
  /** FIXME - Only using first categorical attribute; must be used for n categorical attributes */
  for(prop in idStats)
  {
    /** FIXME - Completely biased towards one use case; must be generic */
    for(cats in idStats[prop])
    {
        d3Arr.push({ property: prop, categories: cats, percentage: idStats[prop][cats] });
    }
  }
  return JSON.stringify({ arr:d3Arr });
}

/**
 * Perform a binary search on array 'a' to find a given range for value. From https://rosettacode.org/wiki/Binary_search#JavaScript and adapted with answer from https://stackoverflow.com/questions/22123489/olog-n-algorithm-to-find-best-insert-position-in-sorted-array
 * @param {Array} a Sorted array to search for range.
 * @param {(float|int)} value Value for searching.
 * @returns {int} Index for ending range of value.
 */
function binary_search_iterative(a, value)
{
  var mid, lo = 0,
      hi = a.length - 1;

  while (lo < hi) {
    mid = Math.floor((lo + hi) / 2);

    a[mid] > value ? hi = mid : lo = mid + 1
  }
  return lo;
}

/**
 * Get range, given min range, max range and interval.
 * @param {(float|int)} minRange Minimal range.
 * @param {(float|int)} maxRange Maximal range.
 * @param {(float|int)} interval Interval between ranges.
 * @returns {Array} Range elements.
 */
function getRange(minRange, maxRange, interval)
{
  var rangeInterval = [];
  for(let i = minRange; i < maxRange; i = i + interval)
  {
    rangeInterval.push(i);
  }
  var strRange = [];
  for(let i = 0; i < rangeInterval.length-1; i = i + 1)
  {
    strRange.push(rangeInterval[i].toString() + "-" + rangeInterval[i+1].toString());
  }
  return strRange;
}

/**
 * Get, for a given value, its range, according to a given interval.
 * @param {(float|int)} value Value to be assigned to a range.
 * @param {(float|int)} minRange Minimal range.
 * @param {(float|int)} maxRange Maximal range.
 * @param {(float|int)} interval Interval between ranges.
 * @returns {String} Assigned interval for value, converted to string.
 */
function getOrdinalRange(value, minRange, maxRange, interval)
{
  /** Create an array with minRange and maxRange, by 'interval' intervals */
  var rangeInterval = [];
  for(let i = minRange; i < maxRange; i = i + interval)
  {
    rangeInterval.push(i);
  }
  /** Get index for range */
  return binary_search_iterative(rangeInterval, value)-1 >= 0 ? (rangeInterval[binary_search_iterative(rangeInterval, value)-1]).toString() + '-' + (rangeInterval[binary_search_iterative(rangeInterval, value)]).toString() : (rangeInterval[0]).toString() + '-' + (rangeInterval[1]).toString();
}

/**
 * Create 'vertedIdStats.csv' file, with information from 'categories.csv'.
 * @param {String} categories Categories file converted in string format.
 * @param {Object} vertex Vertex properties.
 */
function generateVertexStats(categories, vertex)
{
  var cats = categories.split("\n");
  var catsDict = {};
  var categoricalDict = {};
  var ordinalDict = {};
  /** Create a dictionary for categories */
  for (line in cats)
  {
    var l = cats[line].split(",");
    if(!(l[0] in catsDict))
    {
      catsDict[l[0]] = { category:l[1], rangeNumber:l[2] };
    }
  }
  /** Is root vertex */
  if(vertex.vertexes == undefined)
  {
    vertex.vertexes = [];
    vertex.vertexes.push(vertex);
  }
  for(var i = 0; i < vertex.vertexes.length; i++)
  {
    /** FIXME - Implement simplified parsing, not using dictionaries inside dictionaries */
    for(prop in vertex.vertexes[i])
    {
      if(prop in catsDict)
      {
        /** Parsing categorical data */
        if(catsDict[prop].category == "categorical")
        {
          if(!(prop in categoricalDict))
          {
            /** Create a dict of categories */
            categoricalDict[prop] = {};
            categoricalDict[prop][vertex.vertexes[i][prop]] = 1;
          }
          else
          {
            if(!(vertex.vertexes[i][prop] in categoricalDict[prop]))
            {
              categoricalDict[prop][vertex.vertexes[i][prop]] = 1;
            }
            else
            {
              categoricalDict[prop][vertex.vertexes[i][prop]] = categoricalDict[prop][vertex.vertexes[i][prop]] + 1;
            }
          }
        }
        else if(catsDict[prop].category == "ordinal")
        {
          if(catsDict[prop].rangeNumber != "" && catsDict[prop].rangeNumber != "\n" && catsDict[prop].rangeNumber != undefined)
          {
            /** FIXME - Range is fixed for 5; adapt it to better understand different types of ordinal data */
            if(!(prop in ordinalDict))
            {
              /** Create an ordinal dict, and assign total ranges */
              ordinalDict[prop] = {};
              var range = getRange(parseFloat(catsDict[prop].rangeNumber.split("-")[0]), parseFloat(catsDict[prop].rangeNumber.split("-")[1]), 5.0);
              for(element in range)
              {
                ordinalDict[prop][range[element]] = 0;
              }
            }
            if(!(getOrdinalRange(parseFloat(vertex.vertexes[i][prop]), parseFloat(catsDict[prop].rangeNumber.split("-")[0]), parseFloat(catsDict[prop].rangeNumber.split("-")[1]), 5.0) in ordinalDict[prop]))
            {
              ordinalDict[prop][getOrdinalRange(parseFloat(vertex.vertexes[i][prop]), parseFloat(catsDict[prop].rangeNumber.split("-")[0]), parseFloat(catsDict[prop].rangeNumber.split("-")[1]), 5.0)] = 1;
            }
            else
            {
              ordinalDict[prop][getOrdinalRange(parseFloat(vertex.vertexes[i][prop]), parseFloat(catsDict[prop].rangeNumber.split("-")[0]), parseFloat(catsDict[prop].rangeNumber.split("-")[1]), 5.0)] = ordinalDict[prop][getOrdinalRange(parseFloat(vertex.vertexes[i][prop]), parseFloat(catsDict[prop].rangeNumber.split("-")[0]), parseFloat(catsDict[prop].rangeNumber.split("-")[1]), 5.0)] + 1;
            }
          }
        }
      }
    }
  }
  /** Calculate %s for categorical data */
  for(prop in categoricalDict)
  {
    var length = 0;
    for(cat in categoricalDict[prop])
    {
      length = length + parseInt(categoricalDict[prop][cat]);
    }
    for(cat in categoricalDict[prop])
    {
      /** Get percentage */
      categoricalDict[prop][cat] = (parseFloat(categoricalDict[prop][cat]) / parseFloat(length)) * 100.0;
      if(categoricalDict[prop][cat] == 0.000)
      {
        delete categoricalDict[prop][cat];
      }
    }
  }
  /** Calculate %s for ordinal data */
  for(prop in ordinalDict)
  {
    var length = 0;
    for(cat in ordinalDict[prop])
    {
      length = length + parseFloat(ordinalDict[prop][cat]);
    }
    for(cat in ordinalDict[prop])
    {
      /** Get percentage */
      parseFloat(length) > 0 ? ordinalDict[prop][cat] = (parseFloat(ordinalDict[prop][cat]) / parseFloat(length)) * 100.0 : ordinalDict[prop][cat] = 0;
      if(ordinalDict[prop][cat] == 0)
      {
        delete ordinalDict[prop][cat];
      }
    }
  }
  /** Write vertex info */
  indexController.fs.writeFile('uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + vertex.id + 'Stats.json', stringify(Object.assign({}, categoricalDict, ordinalDict)), function(err){
    if(err)
    {
      console.log("Error writing " + vertex.id + 'Stats.json.');
    }
  });
}

/**
 * @desc Find and add maximum and minimum edge weights at edge set.
 * @param {string} data .json string containing graph data.
 * @returns {string} data .json string containing graph data.
 */
function addMinAndMaxEdge(data)
{
 var max = 1, min = 1000000000;
 var jason = JSON.parse(data);
 for(var i = 0; i < jason.links.length; i++)
 {
   /** Check if weight exists */
   if(parseInt(jason.links[i].weight) != undefined)
   {
     if(parseInt(jason.links[i].weight) > max)
     {
       max = parseInt(jason.links[i].weight);
     }
     if(parseInt(jason.links[i].weight) < min)
     {
       min = parseInt(jason.links[i].weight);
     }
   }
 }
 /** Store in .json edges weights */
 jason.graphInfo[0].maxEdgeWeight = parseInt(max);
 jason.graphInfo[0].minEdgeWeight = parseInt(min);
 return JSON.stringify(jason);
}

/**
 * @desc Get a node specific color based on a user-defined "label".
 * @param {Object} node Node object containing all properties.
 * @returns {Array|undefined} Array of vertice's color.
 */
function getColor(node)
{
  try
  {
    var label = indexController.fs.readFileSync('label.txt', 'utf8');
    var labelValues = indexController.fs.readFileSync('colors.json', 'utf8');
    if('vertexes' in node)
    {
      labelValues = JSON.parse(labelValues);
      var arrOfColors = [];
      for(vertex in node['vertexes'])
      {
        arrOfColors.push(labelValues[node['vertexes'][vertex][label]]);
      }
      return arrOfColors;
    }
    else if(label in node)
    {
      labelValues = JSON.parse(labelValues);
      return labelValues[node[label]];
    }
    else
    {
      return undefined;
    }
  }
  catch(err)
  {
    return undefined;
  }
  // var label = indexController.fs.readFile('./label.txt', 'utf8', function(err){
  // indexController.fs.readFile('label.txt', 'utf8', function(err, label){
  //   if(err)
  //   {
  //     return undefined;
  //   }
  //   else
  //   {
  //     // var labelValues = indexController.fs.readFile('./colors.json', 'utf8', function(err, dat){
  //     indexController.fs.readFile('colors.json', 'utf8', function(err, dat){
  //       if("vertexes" in node)
  //       {
  //         dat = JSON.parse(dat);
  //         var arrOfColors = [];
  //         for(vertex in node["vertexes"])
  //         {
  //           arrOfColors.push(dat[node['vertexes'][vertex][label]]);
  //         }
  //         return arrOfColors;
  //       }
  //       else if(label in node)
  //       {
  //         dat = JSON.parse(dat);
  //         return dat[node[label]];
  //       }
  //       else
  //       {
  //         return undefined;
  //       }
  //     });
  //   }
  // });
}

/**
 * @desc Get node user-defined label.
 * @param {Object} node Node object containing all properties.
 * @returns {(String|Number)} Value for user-defined label.
 */
function getLabelValue(node)
{
  var label = indexController.fs.readFile('label.txt', 'utf8', function(err){
    if(err)
    {
      return undefined;
    }
    else
    {
      return node[label];
    }
  });
}

/** Graph AJAX callback functions */

/**
 * Server-side callback function from 'express' framework for switch route. Changes bipartite graph layout, from horizontal to vertical and vice-versa.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
exports.switch = function(req, res){
  exports.readJsonFile('uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + pyName + "n" + currentLevel + '.json', indexController.fs, req, res);
};

/**
 * Server-side callback function from 'express' framework for get levels route. Gets different graph levels, in case number of levels is different than 1.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
exports.getLevels =  function(req, res){
  /** From https://stackoverflow.com/questions/43669913/node-js-how-to-inspect-request-data */
  req.on('data', function(chunk) {
        var bodydata = chunk.toString('utf8');
        exports.readJsonFile(bodydata, indexController.fs, req, res);
    });
};

/**
 * Server-side callback function from 'express' framework for get clusters for each level. These clusters will be converted to an array.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
exports.getClusters = function(req, res){
  req.on('data', function(chunk) {
    let clusterFileName = chunk.toString('utf8');
    indexController.fs.readFile(clusterFileName, 'utf8', function(err, dat){
      if(err)
      {
        return console.log(err);
      }
      else
      {
        /** Send array of clusters */
        res.end(dat);
      }
    });
  });
};

/**
 * Server-side callback function from 'express' framework for get graph route. Get uploaded graph according to file name.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
exports.getGraph = function(req, res){
  /** Read file from its folder */
  exports.readJsonFile('uploads' + indexController.folderChar + req.body.graphName + indexController.folderChar + req.body.graphName + '.json', indexController.fs, req, res);
};

/**
 * Server-side callback function from 'express' framework for get graph route. Get coarsenest graph according to file name.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
exports.getMostCoarsenedGraph = function(req, res){
  /** Execute python script to get most coarsened graph */
  indexController.nodeCmd.get('python mob/getMostCoarsened.py -i ' + req.body.graphName + ' -d ' + 'uploads' + indexController.folderChar + req.body.graphName + indexController.folderChar, function(dat, name, stderror){
    if(name)
    {
      /** Remove '\n' */
      name = name.slice(0, -1);
      /** Read file from its folder */
      exports.readJsonFile('uploads' + indexController.folderChar + req.body.graphName + indexController.folderChar + name, indexController.fs, req, res);
    }
  });
};

/**
 * Server-side callback function from 'express' framework for get sorted successors route. Get "sorted" nodes .s file, and return index of node in array.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
exports.getSortedSuccessors = function(req, res){
 /** Get coarsened graph level */
 indexController.nodeCmd.get('python mob/getCoarsened.py -i' + indexController.fileName.split(".")[0] + ' -d ' + 'uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + ' -l ' + req.body.levels, function(data, err, stderr){
   /** Get fileName from python print */
   if(err)
   {
     /** Remove '\n' */
     err = err.slice(0, -1);
     indexController.nodeCmd.get('python mob/getMostCoarsened.py -i' + indexController.fileName.split(".")[0] + ' -d ' + 'uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar, function(dat, name, stderror){
       if(name)
       {
         /** Find 'real' successors of a given vertex */
         var suc = getRealSuccessors(req.body.currentMesh, req.body.nextMesh, err, name, [req.body.idx]);
         for(let i = 0; i < suc.length; i++)
         {
           suc[i] = suc[i].toString();
         }
         /** Check name */
         var level = 0;
         if(req.body.nextMesh != "MainMesh")
         {
             level = req.body.nextMesh[req.body.nextMesh.length-1];
             /** Read file and find index */
             indexController.fs.readFile('uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + "n" + level.toString() + ".s", 'utf8', function(err, dat){
               if(err)
               {
                 return console.log(err);
               }
               else
               {
                 /** Find and return index of nodes from 'dat' string */
                 var arr = dat.split(",");
                 var vect = [];
                 for(var i = 0; i < suc.length; i++)
                 {
                   var realValue = parseInt(arr.indexOf(suc[i]));
                   vect.push(realValue.toString());
                 }
                 var jsonObj = { array: vect };
                 res.type('text');
                 res.end(JSON.stringify(jsonObj));
               }
             });
         }
         else
         {
           var jsonObj = { array: suc };
           res.type('text');
           res.end(JSON.stringify(jsonObj));
         }
       }
     });
   }
 });
};

/**
 * Server-side callback function from 'express' framework for get sorted route. Get "sorted" nodes .s file, and return index of node in array.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
exports.getSorted = function(req, res){
  /** Get coarsened graph level */
  indexController.nodeCmd.get('python mob/getCoarsened.py -i ' + indexController.fileName.split(".")[0] + ' -d ' + 'uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + ' -l ' + req.body.levels, function(data, err, stderr){
    /** Get fileName from python print */
    if(err)
    {
      /** Remove '\n' */
      err = err.slice(0, -1);
      /** Find 'real' predecessors of a given vertex */
      var pred = getRealPredecessors(req.body.currentMesh, req.body.previousMesh, err, [req.body.idx]);
      for(let i = 0; i < pred.length; i++)
      {
        pred[i] = pred[i].toString();
      }
      /** Check name */
      var level = 0;
      if(req.body.previousMesh != "MainMesh") level = req.body.previousMesh[req.body.previousMesh.length-1];
      /** Read file and find index */
      indexController.fs.readFile('uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + "n" + level.toString() + ".s", 'utf8', function(err, dat){
        if(err)
        {
          return console.log(err);
        }
        else
        {
          /** Find and return index of nodes from 'dat' string */
          var arr = dat.split(",");
          var vect = [];
          for(var i = 0; i < pred.length; i++)
          {
            vect.push(arr.indexOf(pred[i]).toString());
          }
          var jsonObj = { array: vect };
          res.type('text');
          res.end(JSON.stringify(jsonObj));
        }
      });
    }
  });
};

/**
 * Server-side callback function from 'express' framework for generate stats route. Create statistics based on 'categories.csv' file.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
exports.generateStats = function(req, res){
  /** Check and open 'categories.csv' file, if exists */
  indexController.fs.readFile('categories.csv', "utf8", function(err, dat){
    if(err)
    {
      /** No categories file found; finish without processing anything */
      res.type('text');
      res.end();
    }
    else
    {
      /** Create "vertexIdStats.csv" containing processed information */
      generateVertexStats(dat, req.body.props);
      res.type('text');
      res.end();
    }
  });
};

/**
 * Server-side callback function from 'express' framework for get stats route. Get and parse statistics based on vertexId.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
exports.getStats = function(req, res){
  /** Open 'vertexIdStats.json' file */
  indexController.fs.readFile('uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + req.body.vertexId + 'Stats.json', 'utf8', function(err, dat){
    if(err)
    {
      console.log(err);
      /** No file found; finish without processing anything */
      res.type('text');
      res.end();
    }
    else
    {
      /** Create dict parsed for d3BarChart and send data */
      res.type('text');
      res.end(processStats(dat));
    }
  });
};

/**
 * Server-side callback function from 'express' framework for get edge weights route. Find edge with 'source' and 'target' ids and return its weight.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
exports.getEdgesWeights = function(req, res){
  /** Open input.json file to store  */
  indexController.fs.readFile('input.json', 'utf8', function(err, dat){
    if(err)
    {
      console.log(err);
    }
    else
    {
      let inputJson = JSON.parse(dat);
      let reductionFactor1 = inputJson['reduction_factor'][0];
      let reductionFactor2 = inputJson['reduction_factor'][1];
      let nLevels1 = inputJson['max_levels'][0];
      let nLevels2 = inputJson['max_levels'][1];
      /** Open file */
      indexController.fs.readFile('uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + indexController.fileName.split(".")[0] + 'Coarsened' + 'l' + catFloat(reductionFactor1) + 'r' + catFloat(reductionFactor2) + 'nl' + nLevels1.toString() + 'nr' + nLevels2.toString() + '.json', 'utf8', function(err, dat){
        if(err)
        {
          console.log(err);
        }
        else
        {
          let edgeWeights = [];
          dat = addMinAndMaxEdge(dat);
          let fileJson = JSON.parse(dat);
          let sourceNode = req.body.neighbors[0];
          for(let i = 1; i < req.body.neighbors.length; i++)
          {
            let targetNode = req.body.neighbors[i];
            /** Get edge weight */
            edgeWeights.push(getEdgeWeight(fileJson, sourceNode, targetNode));
          }
          /** Return from server-side */
          res.type('text');
          res.end(JSON.stringify({ edges: edgeWeights, minEdgeWeight: fileJson.graphInfo[0].minEdgeWeight, maxEdgeWeight: fileJson.graphInfo[0].maxEdgeWeight }));
        }
      });
    }
  });
};

/**
 * Server-side callback function from 'express' framework to define label. Define 'label.txt' file according to user-defined parameter.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
exports.defineLabel = function(req, res){
  /** Write 'label.txt' file */
  indexController.fs.writeFile("label.txt", req.body.l, function(err){
    if(err)
    {
      console.log(err);
    }
    else
    {
      /** Finished; return to client-side */
      res.type('text');
      res.end();
    }
  });
};

/**
 * Server-side callback function from 'express' framework to create graph colors. Get user-defined 'label' attribute and create a 'colors.csv' file, containing all colors for all possible values of 'label'.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
exports.createGraphColors = function(req, res){
  var label = indexController.fs.readFileSync('label.txt', 'utf8');
  var graphFile = indexController.fs.readFileSync('uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + indexController.fileName.split(".")[0] + ".json", 'utf8');
  graphFile = JSON.parse(graphFile);
  /** Iterate through all nodes and store existing values on a dictionary */
  var labelValues = {};
  for(var i = 0; i < graphFile.nodes.length; i++)
  {
    if(label in graphFile.nodes[i])
    {
      labelValues[graphFile.nodes[i][label]] = Array(Math.random(), Math.random(), Math.random());
    }
  }
  indexController.fs.writeFileSync('colors.json', JSON.stringify(labelValues), 'utf8');
  /** Return from server-side */
  res.type('text');
  res.end();
};

/**
 * Server-side callback function from 'express' framework for get vertice colors. Get vertices colors based on both a pre-defined color scheme and the number of vertices composing a super-vertice.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
exports.getColors = function(req, res){
  var colors = [];
  for(var i = 0; i < parseInt(req.body.nodes.length); i++)
  {
    // if(getColor(req.body.nodes[i], getLabelValue(req.body.nodes[i])) !== undefined) colors.push(getColor(req.body.nodes[i], getLabelValue(req.body.nodes[i])));
    colors.push(getColor(req.body.nodes[i], getLabelValue(req.body.nodes[i])));
  }
  /** Return from server-side */
  res.type('text');
  // colors.length == 0 ? res.end(JSON.stringify({ undefined })) : res.end(JSON.stringify({ colors }));
  res.end(JSON.stringify({ colors }));
}

/**
 * Server-side callback function from 'express' framework for get vertice colors. Get vertice colors based on both a pre-defined color scheme and the number of vertices composing a super-vertice.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
 exports.getColor = function(req, res){
   var color = getColor(req.body.node, getLabelValue(req.body.node));
   /** Return from server-side */
   res.type('text');
   res.end(JSON.stringify({ color }));
 }

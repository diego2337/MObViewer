var serverPort = 3030;
var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var bodyParser = require('body-parser');
var nodeCmd = require('node-cmd');
var fileName = "";
var graphSize = [];
var pyName = "";
var currentLevel = 0;
var folderChar = addFolderPath();
var exists = false;
var stringify = require('json-stable-stringify');


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'build')));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
/** Supporting large number of parameters */
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 100000000000000}));

app.set('views', __dirname+'/public/views');
// app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

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
 * @desc Add necessary values for .json.
 * @param {string} data .json string containing graph data.
 * @returns {string} data .json string containing graph data.
 */
function addValues(data)
{
  return addMinAndMaxEdge(addMinAndMaxNode(addNumberOfEdgesToJSON(data)));
}

/**
 * Check to see which operating system version is being used, assigning either '/' or '\' for folder paths.
 * @public
 * @returns {string} either '\' or '/' symbol for folder paths.
 */
function addFolderPath()
{
  return process.platform == "win32" ? "\\" : "/";
}

/**
 * FIXME - shallow copy of object - needs to be deep copy
 * Check and fix an object to see if attributes are integers.
 * @param {Object} obj JSON object to be checked.
 * @returns {Object} JSON object with fixed number values.
 */
function fixJSONInts(obj)
{
  var newObj = obj;
  for(key in obj)
  {
    /** Recursively call function is property is Array */
    if(obj[key] instanceof Array)
    {
      fixJSONInts(obj[key]);
    }
    else if(obj[key] === 'true' || obj[key] === 'false')
    {
      newObj[key] = obj[key] === 'true' ? true : false;
    }
    else if(!isNaN(obj[key]))
    {
      newObj[key] = parseFloat(obj[key]);
    }
  }
  return newObj;
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
function readJsonFile(path, fs, req, res)
{
  var nLev = nl = nr = 0;
  // req.body.nLevels == undefined ? nLev = 0 : nLev = parseInt(req.body.nLevels);
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
      if(graphSize.length == 0) JSON.parse(data).graphInfo[0].vlayer != undefined ? graphSize = JSON.parse(data).graphInfo[0].vlayer : graphSize = JSON.parse(data).graphInfo[0].vertices;
      /* Send data to client */
      res.type('text');
      // res.end(JSON.stringify({graph: addValues(data), nLevels: nLev, graphName: path, firstSet: req.body.coarsening, secondSet: req.body.coarseningSecondSet}));
      res.end(JSON.stringify({graph: addValues(data), nLevels: [nl, nr], firstSetLevel: nl, secondSetLevel: nr, graphName: path, firstSet: req.body.coarsening, secondSet: req.body.coarseningSecondSet}));
    }
  });
}

/**
 * Create a coarsened graph from initial graph, according to reduction factor given by user.
 * @public
 * @param {Object} nodeCmd NodeCmd API module.
 * @param {string} folderChar Either '\' or '/' symbol for folder paths.
 * @param {string} pyName Multilevel paradigm program name.
 * @param {string} pyCoarsening Reduction factor coarsening given by user.
 * @param {Object} fs FileSystem API module.
 * @param {Object} req header sent via HTTP from HTML page, from Express API module callback 'post'.
 * @param {Object} res header to be sent via HTTP for HTML page, from Express API module callback 'post'.
 * @returns {string} if any error occurs during file read, return it via console; otherwise return nothing.
 */
function createCoarsenedGraph(nodeCmd, folderChar, pyName, pyCoarsening, fs, req, res)
{
  /* Convert .json file to .ncol */
  nodeCmd.get('python mob' + folderChar + 'jsonToNcol3.py --input uploads' + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + '.json --output uploads' + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + '.ncol', function(data, err, stderr) {
    if(!err)
    {
      // console.log("data from python script " + data);
      /* Build python parameters string */
      var pyPath = "mob" + folderChar;
      var pyProg = "coarsening.py";
      var pyParams = "-f uploads" + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + ".ncol -d uploads" + folderChar + fileName.split(".")[0] + folderChar + " -o " + pyName + " -v " + parseInt(graphSize.split(" ")[0]) + " " + parseInt(graphSize.split(" ")[1]) + " " + pyCoarsening + " --save_gml";
      // var pyParams = "-f uploads" + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + ".ncol -d uploads" + folderChar + fileName.split(".")[0] + folderChar + " -o " + pyName + " -v " + parseInt(graphSize.split(" ")[0]) + " " + parseInt(graphSize.split(" ")[1]) + " " + pyCoarsening + " -e gml" ;
      if(req.body.coarsening == 0 || req.body.coarseningSecondSet == 0)
      {
        // req.body.firstSet == 1 ? pyParams = pyParams + " -l 0 -m " + req.body.nLevels + " 0 " : pyParams = pyParams + " -l 1 -m 0 " + req.body.nLevels;
        req.body.firstSet == 1 ? pyParams = pyParams + " -m " + req.body.nLevels + " 0 " : pyParams = pyParams + " -m 0 " + req.body.nLevels;
      }
      else
      {
        // pyParams = pyParams + " -m 1 1 ";
        // pyParams = pyParams + " -m " + req.body.coarsening*10 + " " + req.body.coarseningSecondSet*10 + " ";
        pyParams = pyParams + " -m " + req.body.nLevels + " " + req.body.nLevels + " ";
      }
      /** Execute python scripts */
      /** Execute coarsening with a given reduction factor */
      nodeCmd.get('python ' + pyPath + pyProg + " " + pyParams, function(data, err, stderr) {
        if (!err)
        {
          /** Finished coarsening; return to client-side */
          res.type('text');
          res.end();
          // console.log("data from python script " + data);
          // if(req.body.nLevels !== undefined) pyName = pyName + "n" + req.body.nLevels;
          // console.log("nodeCmd:");
          // console.log(nodeCmd);
          // /** FIXME - for loop works, however is incorrect; Only runs once and returns to client side, while all other data is created in background  */
          // for(let i = 0; req.body.nLevels !== undefined && i < req.body.nLevels; i++)
          // {
          //   let hierarchicalPyName = pyName + "n" + (i+1).toString();
          //   /* Execute .gml to .json conversion */
          //   nodeCmd.get('python ' + pyPath + 'gmlToJson3.py uploads' + folderChar + fileName.split(".")[0] + folderChar + hierarchicalPyName + '.gml uploads' + folderChar + fileName.split(".")[0] + folderChar + hierarchicalPyName + ".json", function(data, err, stderr) {
          //     if(!err)
          //     {
          //       console.log('python ' + pyPath + 'gmlToJson3.py uploads' + folderChar + fileName.split(".")[0] + folderChar + hierarchicalPyName + '.gml uploads' + folderChar + fileName.split(".")[0] + folderChar + hierarchicalPyName + ".json");
          //       // if( (hierarchicalPyName) == (pyName + "n" + (req.body.nLevels).toString()) )
          //       // {
          //       //   /** Set properties properly using information from "source" attribue in .json file generated from multilevel paradigm */
          //       //   nodeCmd.get('python ' + pyPath + 'setProperties.py -f uploads' + folderChar + fileName.split(".")[0] + folderChar + ' -n ' + fileName.split(".")[0] + '.json -l ' + req.body.nLevels + ' -r ' + req.body.coarsening + ' ' + req.body.coarseningSecondSet, function(data, err, stderr) {
          //       //     if(!err)
          //       //     {
          //       //       console.log('python ' + pyPath + 'setProperties.py -f uploads' + folderChar + fileName.split(".")[0] + folderChar + ' -n ' + fileName.split(".")[0] + '.json -l ' + req.body.nLevels + ' -r ' + req.body.coarsening + ' ' + req.body.coarseningSecondSet);
          //       //       // console.log("data from python script " + data);
          //       //       readJsonFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + hierarchicalPyName + '.json', fs, req, res);
          //       //     }
          //       //     else
          //       //     {
          //       //       console.log("python script cmd error: " + err);
          //       //     }
          //       //   });
          //       // }
          //     }
          //     else
          //     {
          //       console.log("python script cmd error: " + err);
          //     }
          //   });
          //   currentLevel = i+1;
          // }
        }
        else
        {
          console.log("python script cmd error: " + err);
        }
      });
    }
    else
    {
      console.log("python script cmd error: " + err);
    }
  });
}

/**
 * Create folder with same name as file, containing uploaded and coarsened bipartite graphs.
 * @public
 * @param {string} name Uploaded file name.
 * @param {string} uploadDir Upload directory.
 * @param {string} folderChar Either '\' or '/' symbol for folder paths.
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
function mkdirAndCp(name, uploadDir, folderChar, req, res)
{
  /** Creates directory for uploaded graph */
  nodeCmd.get('mkdir -p uploads' + folderChar + name.split(".")[0] + folderChar, function(data, err, stderr) {
    if (!err)
    {
      // console.log("data from python script " + data);
      /* Assign global variable with file name for later coarsening */
      fileName = name;
      /* Transforms .gml file into .json extension file if file is .gml */
      if(name.split(".")[1] === "gml")
      {
        /** Convert to .json and move it to upload folder with same name */
        nodeCmd.get('python mob' + folderChar + 'gmlToJson3.py uploads' + folderChar + name + ' uploads' + folderChar + name.split(".")[0] + folderChar + name.split(".")[0] + '.json', function(data, err, stderr) {
                          if (!err)
                          {
                            /** Python script executed successfully; read .json file */
                            readJsonFile(uploadDir + folderChar + name.split(".")[0] + folderChar + name.split(".")[0] + '.json', fs, req, res);
                          }
                          else
                          {
                              console.log("python script cmd error: " + err);
                          }
                        });
      }
      else if(name.split(".")[1] === "json")
      {
        /** Copy .json file to upload folder with same name */
        nodeCmd.get('cp uploads' + folderChar + name + ' uploads' + folderChar + name.split(".")[0] + folderChar + name, function(data, err, stderr){
          /** Python script executed successfully; read .json file */
            if(!err)
            {
              readJsonFile(uploadDir + folderChar + name.split(".")[0] + folderChar + name.split(".")[0] + '.json', fs, req, res);
            }
            else
            {
              console.log("python script cmd error: " + err);
            }
        });
      }
    }
    else
    {
      console.log("python script cmd error: " + err);
    }
  });
}

/**
 * Create .ncol file and perform coarsening.
 * @public
 * @param {string} pyPath Path to python program's directory.
 * @param {string} pyProg Python program name.
 * @param {Object} fs FileSystem API module.
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
function ncolAndCoarse(pyPath, pyProg, fs, req, res)
{
  /** Convert to .ncol format */
  console.log('python ' + pyPath + 'jsonToNcol3.py --input uploads' + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + '.json --output uploads' + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + '.ncol');
  nodeCmd.get('python ' + pyPath + 'jsonToNcol3.py --input uploads' + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + '.json --output uploads' + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + '.ncol', function(data, err, stderr) {
    if(!err)
    {
      req.body.jsonInput.attr = 'uploads/' + req.body.jsonInput.filename.split(".")[0].split("/")[req.body.jsonInput.filename.split(".")[0].split("/").length-1] + '/' + req.body.jsonInput.filename.split(".")[0] + ".json";
      req.body.jsonInput.filename = req.body.jsonInput.filename.split(".")[0] + ".ncol";
      req.body.jsonInput.directory = 'uploads/' + req.body.jsonInput.filename.split(".")[0].split("/")[req.body.jsonInput.filename.split(".")[0].split("/").length-1];
      req.body.jsonInput.output = req.body.jsonInput.filename.split(".")[0].split("/")[req.body.jsonInput.filename.split(".")[0].split("/").length-1] + 'Coarsened';
      req.body.jsonInput.save_conf = true;
      if(req.body.jsonInput.filename.split("/").length <= 1) req.body.jsonInput.filename = 'uploads/' + req.body.jsonInput.filename.split(".")[0].split("/")[req.body.jsonInput.filename.split(".")[0].split("/").length-1] + '/' + req.body.jsonInput.filename;
      req.body.jsonInput.input = req.body.jsonInput.filename;
      /** Save JSON input information in a file - from https://stackoverflow.com/questions/34156282/how-do-i-save-json-to-local-text-file */
      fs.writeFile("input.json", JSON.stringify(req.body.jsonInput), function(err){
        if(err)
        {
          console.log(err);
        }
        else
        {
          /** Execute coarsening with a given reduction factor */
          // console.log('python ' + pyPath + pyProg + " -cf input.json");
          // nodeCmd.get('python ' + pyPath + pyProg + " -cf input.json", function(data, err, stderr) {
          console.log('python ' + pyPath + pyProg + " -cnf input.json");
          nodeCmd.get('python ' + pyPath + pyProg + " -cnf input.json", function(data, err, stderr) {
            if (!err)
            {
              /** Coarsening was successfully executed; get number of levels from .conf file */
              let lr = req.body.jsonInput.reduction_factor[0] == 0.0 ? "00" : req.body.jsonInput.reduction_factor[0].toString().split(".")[0] + req.body.jsonInput.reduction_factor[0].toString().split(".")[1];
              let rr = req.body.jsonInput.reduction_factor[1] == 0.0 ? "00" : req.body.jsonInput.reduction_factor[1].toString().split(".")[0] + req.body.jsonInput.reduction_factor[1].toString().split(".")[1];
              var dat = fs.readFileSync(req.body.jsonInput.filename.split(".")[0] + "Coarsened" + "l" + lr + "r" + rr + "nl" + req.body.jsonInput.max_levels[0] + "nr" + req.body.jsonInput.max_levels[1] + ".conf", 'utf8');
              dat = JSON.parse(dat);
              res.type('text');
              res.end(JSON.stringify({ nl: dat.max_levels[0], nr: dat.max_levels[1] }));
            }
            else
            {
              console.log("python script cmd error: " + err);
            }
          });
        }
      });
    }
    else
    {
      console.log("python script cmd error: " + err);
    }
  });
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
    // if (a[mid] > value) {
    //   hi = mid - 1;
    // } else if (a[mid] < value) {
    //   lo = mid + 1;
    // } else {
    //   return mid;
    // }
  }
  // return null;
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
  // strRange.sort(function(a, b){
  //   return parseFloat(a.split("-")[0]) - parseFloat(b.split("-")[0]);
  // });
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
              // ordinalDict[prop][getOrdinalRange(parseFloat(vertex.vertexes[i][prop]), parseFloat(catsDict[prop].rangeNumber.split("-")[0]), parseFloat(catsDict[prop].rangeNumber.split("-")[1]), 5.0)] = 0;

            }
            if(!(getOrdinalRange(parseFloat(vertex.vertexes[i][prop]), parseFloat(catsDict[prop].rangeNumber.split("-")[0]), parseFloat(catsDict[prop].rangeNumber.split("-")[1]), 5.0) in ordinalDict[prop]))
            {
              ordinalDict[prop][getOrdinalRange(parseFloat(vertex.vertexes[i][prop]), parseFloat(catsDict[prop].rangeNumber.split("-")[0]), parseFloat(catsDict[prop].rangeNumber.split("-")[1]), 5.0)] = 1;
            }
            else
            {
              ordinalDict[prop][getOrdinalRange(parseFloat(vertex.vertexes[i][prop]), parseFloat(catsDict[prop].rangeNumber.split("-")[0]), parseFloat(catsDict[prop].rangeNumber.split("-")[1]), 5.0)] = ordinalDict[prop][getOrdinalRange(parseFloat(vertex.vertexes[i][prop]), parseFloat(catsDict[prop].rangeNumber.split("-")[0]), parseFloat(catsDict[prop].rangeNumber.split("-")[1]), 5.0)] + 1;
            }
            // else
            // {
            //   if(!(getOrdinalRange(parseFloat(vertex.vertexes[i][prop]), parseFloat(catsDict[prop].rangeNumber.split("-")[0]), parseFloat(catsDict[prop].rangeNumber.split("-")[1]), 5.0) in ordinalDict[prop]))
            //   {
            //     ordinalDict[prop][getOrdinalRange(parseFloat(vertex.vertexes[i][prop]), parseFloat(catsDict[prop].rangeNumber.split("-")[0]), parseFloat(catsDict[prop].rangeNumber.split("-")[1]), 5.0)] = 1;
            //   }
            //   else
            //   {
            //     ordinalDict[prop][getOrdinalRange(parseFloat(vertex.vertexes[i][prop]), parseFloat(catsDict[prop].rangeNumber.split("-")[0]), parseFloat(catsDict[prop].rangeNumber.split("-")[1]), 5.0)] = ordinalDict[prop][getOrdinalRange(parseFloat(vertex.vertexes[i][prop]), parseFloat(catsDict[prop].rangeNumber.split("-")[0]), parseFloat(catsDict[prop].rangeNumber.split("-")[1]), 5.0)] + 1;
            //   }
            // }
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
      // length = length + 1;
    }
    for(cat in categoricalDict[prop])
    {
      // var length = Object.keys(categoricalDict[prop]).length;
      /** Get percentage */
      categoricalDict[prop][cat] = (parseFloat(categoricalDict[prop][cat]) / parseFloat(length)) * 100.0;
    }
  }
  /** Calculate %s for ordinal data */
  for(prop in ordinalDict)
  {
    var length = 0;
    for(cat in ordinalDict[prop])
    {
      length = length + parseFloat(ordinalDict[prop][cat]);
      // length = length + 1;
    }
    for(cat in ordinalDict[prop])
    {
      /** Get percentage */
      parseFloat(length) > 0 ? ordinalDict[prop][cat] = (parseFloat(ordinalDict[prop][cat]) / parseFloat(length)) * 100.0 : ordinalDict[prop][cat] = 0;
    }
  }
  /** Write vertex info */
  // fs.writeFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + vertex.id + 'Stats.json', JSON.stringify(JSON.parse(JSON.stringify(categoricalDict)).concat(JSON.parse(JSON.stringify(ordinalDict)))),
  fs.writeFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + vertex.id + 'Stats.json', stringify(Object.assign({}, categoricalDict, ordinalDict)), function(err){
    if(err)
    {
      console.log("Error writing " + vertex.id + 'Stats.json.');
    }
    // else
    // {
    //   /** Finished. Return to client-side */
    // }
  });
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
 * Concatenate float value.
 * @param {Float} value Value to be concatenated.
 */
function catFloat(value)
{
  return value.toString().split(".")[1] == undefined ? value.toString().split(".")[0] : value.toString().split(".")[0] + value.toString().split(".")[1];
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
    var dat = fs.readFileSync('uploads' + folderChar + fileName.split(".")[0] + folderChar + coarsenedFileName, 'utf8');
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
        // successors = parseInt(successors);
        // successors = [successors];
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
  // console.log("coarsenedFileName: " + coarsenedFileName);
  // nodeCmd.get('python mob/getMostCoarsened.py -i' + fileName.split(".")[0] + ' -d ' + 'uploads' + folderChar + fileName.split(".")[0] + folderChar, function(data, err, stderr){
  //   /** Get fileName from python print */
  //   if(err)
  //   {
  //
  //   }
  // });
}

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
    var dat = fs.readFileSync('uploads' + folderChar + fileName.split(".")[0] + folderChar + coarsenedFileName, 'utf8');
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
        // predecessors = parseInt(predecessors);
        // predecessors = [predecessors];
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
      // isNaN(currentGraph[currentGraph.length-1]) ? currentGraph = currentGraph + "1" : currentGraph[currentGraph.length-1] = parseInt(currentGraph[currentGraph.length-1]) + 1;
      /** Decrease coarsenedFileName levels */
      let nl = parseInt(coarsenedFileName.split(".")[0].split("nl")[1][0]);
      let nr = parseInt(coarsenedFileName.split(".")[0].split("nr")[1][0]);
      if(nl != 1 && nr != 1)
      {
        /** If nl > nr, decrease only nl; if nl == nr, both must be decreased; otherwise, nr > nl, so decrease only nr */
        if(nl > nr)
        {
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
    // fs.readFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + coarsenedFileName, 'utf8', function(err, dat){
    //     if(err)
    //     {
    //       console.log(err);
    //     }
    //     else
    //     {
    //     }
    // });
  }
  else
  {
    return indexes;
  }
}

/**
 * Server-side callback function from 'express' framework for incoming graph. Create a local folder with same name as file, to store future coarsened graphs.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
app.post('/upload', function(req, res) {
  graphSize = [];
  currentLevel = 0;
  // var folderChar = addFolderPath();
  /* Create an incoming form object */
  var form = new formidable.IncomingForm();
  /* Specify that we want to allow the user to upload multiple files in a single request */
  form.multiples = true;
  /* Store all uploads in the /uploads directory */
  form.uploadDir = path.join(__dirname, '/uploads');
  /** Every time a file has been uploaded successfully, rename it to it's orignal name */
  form.on('file', function(field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name), function(){return;});
    // mkdirAndCp(file.name, form.uploadDir, folderChar, req, res);
    /** Creates directory for uploaded graph */
    nodeCmd.get('mkdir -p uploads' + folderChar + file.name.split(".")[0] + folderChar, function(data, err, stderr) {
      if (!err)
      {
        // console.log("data from python script " + data);
        /* Assign global variable with file name for later coarsening */
        fileName = file.name;
        /* Transforms .gml file into .json extension file if file is .gml */
        if(file.name.split(".")[1] === "gml")
        {
          /** Convert to .json and move it to upload folder with same name */
          nodeCmd.get('python mob' + folderChar + 'gmlToJson3.py uploads' + folderChar + file.name + ' uploads' + folderChar + file.name.split(".")[0] + folderChar + file.name.split(".")[0] + '.json', function(data, err, stderr) {
                            if (!err)
                            {
                              /** Python script executed successfully; read .json file */
                              readJsonFile(form.uploadDir + folderChar + file.name.split(".")[0] + folderChar + file.name.split(".")[0] + '.json', fs, req, res);
                            }
                            else
                            {
                                console.log("python script cmd error: " + err);
                            }
                          });
        }
          else if(file.name.split(".")[1] === "json")
          {
            /** Copy .json file to upload folder with same name */
            nodeCmd.get('cp uploads' + folderChar + file.name + ' uploads' + folderChar + file.name.split(".")[0] + folderChar + file.name, function(data, err, stderr){
              /** Python script executed successfully; read .json file */
                if(!err)
                {
                  readJsonFile(form.uploadDir + folderChar + file.name.split(".")[0] + folderChar + file.name.split(".")[0] + '.json', fs, req, res);
                }
                else
                {
                  console.log("python script cmd error: " + err);
                }
            });
          }
      }
        else
        {
          console.log("python script cmd error: " + err);
        }
    });
  });

  /* Log any errors that occur */
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  /* Parse incoming request containing form data */
  form.parse(req, function(err, fields, files) {
  });
});

/**
 * Server-side callback function from 'express' framework for slide route. Get reduction factor from multilevel paradigm, execute multilevel, get new graph and send it to client.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
// app.post('/slide', function(req, res) {
app.post('/coarse', function(req, res) {
  // var folderChar = addFolderPath();
  req.body.jsonInput = fixJSONInts(req.body.jsonInput);
  /** Check if input came from .json input */
  if(req.body.jsonInput !== undefined)
  {
    var pyPath = "mob" + folderChar;
    var pyProg = "coarsening.py";
    /** Execute python scripts */
    var file = { name: req.body.jsonInput.filename.split("/")[req.body.jsonInput.filename.split("/").length-1] } ;
    /** Creates directory for uploaded graph */
    nodeCmd.get('mkdir -p uploads' + folderChar + file.name.split(".")[0] + folderChar, function(data, err, stderr) {
      if (!err)
      {
        /* Assign global variable with file name for later coarsening */
        fileName = file.name;
        /* Transforms .gml file into .json extension file if file is .gml */
        if(file.name.split(".")[1] === "gml")
        {
          /** Convert to .json and move it to upload folder with same name */
          nodeCmd.get('python mob' + folderChar + 'gmlToJson3.py uploads' + folderChar + file.name + ' uploads' + folderChar + file.name.split(".")[0] + folderChar + file.name.split(".")[0] + '.json', function(data, err, stderr) {
                            if (!err)
                            {
                                ncolAndCoarse(pyPath, pyProg, fs, req, res);
                            }
                            else
                            {
                                console.log("python script cmd error: " + err);
                            }
                          });
        }
          else if(file.name.split(".")[1] === "json")
          {
            /** Copy .json file to upload folder with same name */
            nodeCmd.get('cp uploads' + folderChar + file.name + ' uploads' + folderChar + file.name.split(".")[0] + folderChar + file.name, function(data, err, stderr){
                if(!err)
                {
                  ncolAndCoarse(pyPath, pyProg, fs, req, res);
                }
                else
                {
                  console.log("python script cmd error: " + err);
                }
            });
          }
      }
        else
        {
          console.log("python script cmd error: " + err);
        }
    });
  }
  else /** Came from user settings in drawer menu FIXME - Not working anymore */
  {
    // var folderChar = addFolderPath();
    /** Test if no coarsening has been applied to both sets; if such case is true, return original graph */
    if(req.body.coarsening == "0" && req.body.coarseningSecondSet == "0")
    {
      readJsonFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + '.json', fs, req, res);
    }
    else
    {
      /* Changing file name according to graph name */
      pyName = fileName.split(".")[0] + "Coarsened" + "l" + req.body.coarsening.split(".").join("") + "r" + req.body.coarseningSecondSet.split(".").join("");
      // if(req.body.nLevels !== undefined) pyName = pyName + "n" + req.body.nLevels;
      var pyCoarsening = "-r " + req.body.coarsening + " " + req.body.coarseningSecondSet;
      if(req.body.nLevels !== undefined && req.body.nLevels != 0) pyCoarsening = pyCoarsening + " --save_hierarchy ";
      /** Check if coarsened file already exists; if not, generate a new coarsened file */
      fs.readFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + pyName + '.json', 'utf8', function(err, data) {
        if(err) /* File doesn't exist */
        {
          createCoarsenedGraph(nodeCmd, folderChar, pyName, pyCoarsening, fs, req, res);
        }
        else /* File exists*/
        {
          /* Send data to client */
          res.end(addValues(data));
        }
      });
    }
  }
  // console.log(req);
  // console.log("graphSize: ");
  // console.log(graphSize);
});

/**
 * Server-side callback function from 'express' framework for switch route. Changes bipartite graph layout, from horizontal to vertical and vice-versa.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
app.post('/switch', function(req, res){
  // var folderChar = addFolderPath();
  // readJsonFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + '.json', fs, res);
  readJsonFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + pyName + "n" + currentLevel + '.json', fs, req, res);
});

/**
 * Server-side callback function from 'express' framework for get levels route. Gets different graph levels, in case number of levels is different than 1.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
app.post('/getLevels', function(req, res){
  /** From https://stackoverflow.com/questions/43669913/node-js-how-to-inspect-request-data */
  req.on('data', function(chunk) {
        var bodydata = chunk.toString('utf8');
        readJsonFile(bodydata, fs, req, res);
    });
});

/**
 * Server-side callback function from 'express' framework for get clusters for each level. These clusters will be converted to an array.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
app.post('/getClusters', function(req, res){
  // var folderChar = addFolderPath();
  req.on('data', function(chunk) {
    let clusterFileName = chunk.toString('utf8');
    fs.readFile(clusterFileName, 'utf8', function(err, dat){
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
});

/**
 * Server-side callback function from 'express' framework for convert route. Convert coarsened graphs from .gml format to .json.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
app.post('/convert', function(req, res){
  // var folderChar = addFolderPath();
  var pyPath = "mob" + folderChar;
  /* Changing file name according to graph name */
  pyName = fileName.split(".")[0] + "Coarsened" + "l" + req.body.coarsening.split(".").join("") + "r" + req.body.coarseningSecondSet.split(".").join("");
  // let hierarchicalPyName = pyName + "n" + req.body.currentLevel;
  let hierarchicalPyName = pyName + "nl" + req.body.firstSetLevel + "nr" + req.body.secondSetLevel;
  /** Execute .gml to .json conversion */
  nodeCmd.get('python ' + pyPath + 'gmlToJson3.py uploads' + folderChar + fileName.split(".")[0] + folderChar + hierarchicalPyName + '.gml uploads' + folderChar + fileName.split(".")[0] + folderChar + hierarchicalPyName + ".json", function(data, err, stderr) {
    if(!err)
    {
      console.log('python ' + pyPath + 'gmlToJson3.py uploads' + folderChar + fileName.split(".")[0] + folderChar + hierarchicalPyName + '.gml uploads' + folderChar + fileName.split(".")[0] + folderChar + hierarchicalPyName + ".json");
      /** Finished conversion, return to client-side */
      res.type('text');
      res.end();
    }
    else
    {
      console.log("python script cmd error: " + err);
    }
  });
});

/**
 * Server-side callback function from 'express' framework for set properties route. Assign all .json properties for .json files after conversion from .gml.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
app.post('/setProperties', function(req, res){
  // var folderChar = addFolderPath();
  var pyPath = "mob" + folderChar;
  // let hierarchicalPyName = pyName + "n" + req.body.nLevels;
  let hierarchicalPyName = pyName + "nl" + req.body.firstSetLevel + "nr" + req.body.secondSetLevel;
  /** Set properties properly using information from "source" attribue in .json file generated from multilevel paradigm */
  // nodeCmd.get('python ' + pyPath + 'setProperties.py -f uploads' + folderChar + fileName.split(".")[0] + folderChar + ' -n ' + fileName.split(".")[0] + '.json -l ' + req.body.nLevels + ' -r ' + req.body.coarsening + ' ' + req.body.coarseningSecondSet, function(data, err, stderr) {
  nodeCmd.get('python ' + pyPath + 'setProperties.py -f uploads' + folderChar + fileName.split(".")[0] + folderChar + ' -n ' + fileName.split(".")[0] + '.json -l ' + req.body.firstSetLevel + ' ' + req.body.secondSetLevel + ' -r ' + req.body.coarsening + ' ' + req.body.coarseningSecondSet, function(data, err, stderr) {
    if(!err)
    {
      console.log('python ' + pyPath + 'setProperties.py -f uploads' + folderChar + fileName.split(".")[0] + folderChar + ' -n ' + fileName.split(".")[0] + '.json -l ' + req.body.firstSetLevel + ' ' + req.body.secondSetLevel + ' -r ' + req.body.coarsening + ' ' + req.body.coarseningSecondSet);
      // console.log("data from python script " + data);
      readJsonFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + hierarchicalPyName + '.json', fs, req, res);
    }
    else
    {
      console.log("python script cmd error: " + err);
    }
  });
});

/**
 * Server-side callback function from 'express' framework for get graph route. Get uploaded graph according to file name.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
app.post('/getGraph', function(req, res){
  // var folderChar = addFolderPath();
  /** Read file from its folder */
  readJsonFile(req.body.graphName + '.json', fs, req, res);
});

/**
 * Server-side callback function from 'express' framework for get graph route. Write "sorted" nodes in .s file, for later usage.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
 app.post('/writeSorted', function(req, res){
  var fName = "n" + req.body.idx + ".s";
  fs.writeFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + fName, req.body.nodes, function(err){
    if(err)
    {
      console.log(err);
    }
    else
    {
      res.type('text');
      res.end();
    }
  });
  // fs.stat('uploads' + folderChar + fileName.split(".")[0] + folderChar + fName, function(err, stat){
  //   /** File already exists; no need to append anything else */
  //   if(err == null)
  //   {
  //     res.end();
  //   }
  //   else if(err.code == 'ENOENT')
  //   {
  //     fs.writeFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + fName, req.body.nodes, function(err){
  //       if(err)
  //       {
  //         console.log(err);
  //       }
  //       else
  //       {
  //         res.end();
  //       }
  //     });
  //   }
  // });
 });

 /**
  * Server-side callback function from 'express' framework for get sorted successors route. Get "sorted" nodes .s file, and return index of node in array.
  * @public @callback
  * @param {Object} req header incoming from HTTP;
  * @param {Object} res header to be sent via HTTP for HTML page.
  */
app.post('/getSortedSuccessors', function(req, res){
  /** Get coarsened graph level */
  nodeCmd.get('python mob/getCoarsened.py -i' + fileName.split(".")[0] + ' -d ' + 'uploads' + folderChar + fileName.split(".")[0] + folderChar + ' -l ' + req.body.levels, function(data, err, stderr){
    /** Get fileName from python print */
    if(err)
    {
      /** Remove '\n' */
      err = err.slice(0, -1);
      nodeCmd.get('python mob/getMostCoarsened.py -i' + fileName.split(".")[0] + ' -d ' + 'uploads' + folderChar + fileName.split(".")[0] + folderChar, function(dat, name, stderror){
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
              fs.readFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + "n" + level.toString() + ".s", 'utf8', function(err, dat){
                if(err)
                {
                  return console.log(err);
                }
                else
                {
                  // console.log('uploads' + folderChar + fileName.split(".")[0] + folderChar + "n" + level.toString() + ".s");
                  /** Find and return index of nodes from 'dat' string */
                  var arr = dat.split(",");
                  var vect = [];
                  for(var i = 0; i < suc.length; i++)
                  {
                    var realValue = parseInt(arr.indexOf(suc[i]));
                    vect.push(realValue.toString());
                    // vect.push(arr.indexOf(suc[i]).toString());
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
});

/**
 * Server-side callback function from 'express' framework for get sorted route. Get "sorted" nodes .s file, and return index of node in array.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
app.post('/getSorted', function(req, res){
  /** Get coarsened graph level */
  nodeCmd.get('python mob/getCoarsened.py -i ' + fileName.split(".")[0] + ' -d ' + 'uploads' + folderChar + fileName.split(".")[0] + folderChar + ' -l ' + req.body.levels, function(data, err, stderr){
    /** Get fileName from python print */
    if(err)
    {
      /** Remove '\n' */
      err = err.slice(0, -1);
      /** Find 'real' predecessors of a given vertex */
      var pred = getRealPredecessors(req.body.currentMesh, req.body.previousMesh, err, [req.body.idx]);
      // typeof(pred) == "object" ? pred = pred.split(",") : pred = [pred];
      for(let i = 0; i < pred.length; i++)
      {
        pred[i] = pred[i].toString();
      }
      /** Check name */
      var level = 0;
      // if(req.body.name != "MainMesh") level = req.body.name[req.body.name.length-1];
      if(req.body.previousMesh != "MainMesh") level = req.body.previousMesh[req.body.previousMesh.length-1];
      /** Read file and find index */
      fs.readFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + "n" + level.toString() + ".s", 'utf8', function(err, dat){
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
            // vect.push(arr.indexOf(pred[i]) != -1 ? arr.indexOf(pred[i]).toString() : 0);
            vect.push(arr.indexOf(pred[i]).toString());
          }
          var jsonObj = { array: vect };
          res.type('text');
          res.end(JSON.stringify(jsonObj));
          // res.end(arr.indexOf(pred).toString());
        }
      });
    }
  });
});

/**
 * Server-side callback function from 'express' framework for create categories route. Create 'categories.csv' file, containing current data attributes and their types.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
app.post('/categories', function(req, res){
  /** Write 'categories.csv' file */
  fs.writeFile("categories.csv", req.body.jsonInput, function(err){
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
});

/**
 * Server-side callback function from 'express' framework for generate stats route. Create statistics based on 'categories.csv' file.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
app.post('/generateStats', function(req, res){
  /** Check and open 'categories.csv' file, if exists */
  fs.readFile('categories.csv', "utf8", function(err, dat){
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
});

/**
 * Server-side callback function from 'express' framework for get stats route. Get and parse statistics based on vertexId.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
app.post('/getStats', function(req, res){
  /** Open 'vertexIdStats.json' file */
  fs.readFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + req.body.vertexId + 'Stats.json', 'utf8', function(err, dat){
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
});

/**
 * Server-side callback function from 'express' framework for get edge weights route. Find edge with 'source' and 'target' ids and return its weight.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
app.post('/getEdgesWeights', function(req, res){
  /** Open input.json file to store  */
  fs.readFile('input.json', 'utf8', function(err, dat){
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
      // fs.readFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + 'Coarsened' + 'l' + catFloat(reductionFactor1) + 'r' + catFloat(reductionFactor2) + 'n' + Math.max(nLevels1, nLevels2).toString() + '.json', 'utf8', function(err, dat){
      fs.readFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + 'Coarsened' + 'l' + catFloat(reductionFactor1) + 'r' + catFloat(reductionFactor2) + 'nl' + nLevels1.toString() + 'nr' + nLevels2.toString() + '.json', 'utf8', function(err, dat){
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
});

/**
 * Server-side callback function from 'express' framework for main route.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

/** Main function to trigger server */
var server = app.listen(serverPort, function(){
  console.log('Server listening on port ' + serverPort);
});

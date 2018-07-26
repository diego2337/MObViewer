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
  var nLev = 0;
  req.body.nLevels == undefined ? nLevl = 0 : nLev = parseInt(req.body.nLevels);
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
      res.end(JSON.stringify({graph: addValues(data), nLevels: nLev, graphName: path, firstSet: req.body.coarsening, secondSet: req.body.coarseningSecondSet}));
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
      req.body.jsonInput.filename = req.body.jsonInput.filename.split(".")[0] + ".ncol";
      /** Save JSON input information in a file - from https://stackoverflow.com/questions/34156282/how-do-i-save-json-to-local-text-file */
      fs.writeFile("input.json", JSON.stringify(req.body.jsonInput), function(err){
        if(err)
        {
          console.log(err);
        }
        else
        {
          /** Execute coarsening with a given reduction factor */
          console.log('python ' + pyPath + pyProg + " -cf input.json");
          nodeCmd.get('python ' + pyPath + pyProg + " -cf input.json", function(data, err, stderr) {
            if (!err)
            {
              res.type('text');
              res.end();
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
  else /** Came from user settings in drawer menu */
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
        // console.log(bodydata);
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
    console.log("clusterFileName");
    console.log(clusterFileName);
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
  let hierarchicalPyName = pyName + "n" + req.body.currentLevel;
  /** Execute .gml to .json conversion */
  nodeCmd.get('python ' + pyPath + 'gmlToJson3.py uploads' + folderChar + fileName.split(".")[0] + folderChar + hierarchicalPyName + '.gml uploads' + folderChar + fileName.split(".")[0] + folderChar + hierarchicalPyName + ".json", function(data, err, stderr) {
    if(!err)
    {
      console.log('python ' + pyPath + 'gmlToJson3.py uploads' + folderChar + fileName.split(".")[0] + folderChar + hierarchicalPyName + '.gml uploads' + folderChar + fileName.split(".")[0] + folderChar + hierarchicalPyName + ".json");
      /** Finished conversion, return to client-side */
      res.type('text');
      res.end();
      // if( (hierarchicalPyName) == (pyName + "n" + (req.body.nLevels).toString()) )
      // {
      //   /** Set properties properly using information from "source" attribue in .json file generated from multilevel paradigm */
      //   nodeCmd.get('python ' + pyPath + 'setProperties.py -f uploads' + folderChar + fileName.split(".")[0] + folderChar + ' -n ' + fileName.split(".")[0] + '.json -l ' + req.body.nLevels + ' -r ' + req.body.coarsening + ' ' + req.body.coarseningSecondSet, function(data, err, stderr) {
      //     if(!err)
      //     {
      //       console.log('python ' + pyPath + 'setProperties.py -f uploads' + folderChar + fileName.split(".")[0] + folderChar + ' -n ' + fileName.split(".")[0] + '.json -l ' + req.body.nLevels + ' -r ' + req.body.coarsening + ' ' + req.body.coarseningSecondSet);
      //       // console.log("data from python script " + data);
      //       readJsonFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + hierarchicalPyName + '.json', fs, req, res);
      //     }
      //     else
      //     {
      //       console.log("python script cmd error: " + err);
      //     }
      //   });
      // }
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
  let hierarchicalPyName = pyName + "n" + req.body.nLevels;
  /** Set properties properly using information from "source" attribue in .json file generated from multilevel paradigm */
  nodeCmd.get('python ' + pyPath + 'setProperties.py -f uploads' + folderChar + fileName.split(".")[0] + folderChar + ' -n ' + fileName.split(".")[0] + '.json -l ' + req.body.nLevels + ' -r ' + req.body.coarsening + ' ' + req.body.coarseningSecondSet, function(data, err, stderr) {
    if(!err)
    {
      console.log('python ' + pyPath + 'setProperties.py -f uploads' + folderChar + fileName.split(".")[0] + folderChar + ' -n ' + fileName.split(".")[0] + '.json -l ' + req.body.nLevels + ' -r ' + req.body.coarsening + ' ' + req.body.coarseningSecondSet);
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
  * Server-side callback function from 'express' framework for get graph route. Get "sorted" nodes .s file, and return index of node in array.
  * @public @callback
  * @param {Object} req header incoming from HTTP;
  * @param {Object} res header to be sent via HTTP for HTML page.
  */
app.post('/getSorted', function(req, res){
  /** Check name */
  var level = 0;
  if(req.body.name != "MainMesh") level = req.body.name[req.body.name.length-1];
  /** Read file and find index */
  fs.readFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + "n" + level + ".s", 'utf8', function(err, dat){
    if(err)
    {
      return console.log(err);
    }
    else
    {
      /** Find and return index of nodes from 'dat' string */
      var arr = dat.split(",");
      var vect = [];
      for(var i = 0; i < req.body.pred.length; i++)
      {
        // vect.push(arr.indexOf(req.body.pred[i]) != -1 ? arr.indexOf(req.body.pred[i]).toString() : 0);
        vect.push(arr.indexOf(req.body.pred[i]).toString());
      }
      var jsonObj = { array: vect };
      res.end(JSON.stringify(jsonObj));
      // res.end(arr.indexOf(req.body.pred).toString());
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

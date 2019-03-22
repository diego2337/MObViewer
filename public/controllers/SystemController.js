indexController/**
 * Controller for system related AJAX calls - based on https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/routes#Create_the_route-handler_callback_functions.
 * @author Diego Cintra
 * Date: 1 October 2018
 */

/** Variables */
var formidable = require('formidable');

/** Require controller modules */
var indexController = require('./IndexController');
var graphController = require('./GraphController');

/** Logic callback functions */

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
  console.log('python ' + pyPath + 'jsonToNcol3.py --input uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + indexController.fileName.split(".")[0] + '.json --output uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + indexController.fileName.split(".")[0] + '.ncol');
  indexController.nodeCmd.get('python ' + pyPath + 'jsonToNcol3.py --input uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + indexController.fileName.split(".")[0] + '.json --output uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + indexController.fileName.split(".")[0] + '.ncol', function(data, err, stderr) {
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
          console.log('python ' + pyPath + pyProg + " -cnf input.json");
          indexController.nodeCmd.get('python ' + pyPath + pyProg + " -cnf input.json", function(data, err, stderr) {
            if (!err)
            {
              /** Coarsening was successfully executed; get number of levels from .conf file */
              // let lr = req.body.jsonInput.reduction_factor[0] == 0.0 ? "00" : req.body.jsonInput.reduction_factor[0].toString().split(".")[0] + req.body.jsonInput.reduction_factor[0].toString().split(".")[1];
              // let rr = req.body.jsonInput.reduction_factor[1] == 0.0 ? "00" : req.body.jsonInput.reduction_factor[1].toString().split(".")[0] + req.body.jsonInput.reduction_factor[1].toString().split(".")[1];
              // var dat = fs.readFileSync(req.body.jsonInput.filename.split(".")[0] + "Coarsened" + "l" + lr + "r" + rr + "nl" + req.body.jsonInput.max_levels[0] + "nr" + req.body.jsonInput.max_levels[1] + ".conf", 'utf8');
              let lr = req.body.jsonInput.reduction_factor == undefined ? "05" : req.body.jsonInput.reduction_factor[0] == 0.0 ? "00" : req.body.jsonInput.reduction_factor[0].toString().split(".")[0] + req.body.jsonInput.reduction_factor[0].toString().split(".")[1];
              let rr = req.body.jsonInput.reduction_factor == undefined ? "05" : req.body.jsonInput.reduction_factor[1] == 0.0 ? "00" : req.body.jsonInput.reduction_factor[1].toString().split(".")[0] + req.body.jsonInput.reduction_factor[1].toString().split(".")[1];
              // let nl = req.body.jsonInput.max_levels == undefined ? "1" : req.body.jsonInput.max_levels[0].toString();
              // let nr = req.body.jsonInput.max_levels == undefined ? "1" : req.body.jsonInput.max_levels[1].toString();
              // var dat = fs.readFileSync(req.body.jsonInput.filename.split(".")[0] + "Coarsened" + "l" + lr + "r" + rr + "nl" + nl + "nr" + nr + ".conf", 'utf8');
              var dat = fs.readFileSync(req.body.jsonInput.filename.split(".")[0] + "Coarsened" + ".conf", 'utf8');
              dat = JSON.parse(dat);
              lr = lr[0] + "." + lr[1];
              rr = rr[0] + "." + rr[1];
              /** Open "input.json" and write missing values */
              var inputFile = fs.readFileSync("input.json", 'utf8');
              inputFile = JSON.parse(inputFile);
              inputFile['reduction_factor'] = dat.reduction_factor;
              inputFile['max_levels'] = dat.total_levels;
              fs.writeFileSync('input.json', JSON.stringify(inputFile));
              res.type('text');
              res.end(JSON.stringify({ nl: dat.total_levels[0], nr: dat.total_levels[1], lr: lr, rr: rr }));
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
  nodeCmd.get('python mob' + folderChar + 'jsonToNcol3.py --input uploads' + folderChar + indexController.fileName.split(".")[0] + folderChar + indexController.fileName.split(".")[0] + '.json --output uploads' + folderChar + indexController.fileName.split(".")[0] + folderChar + indexController.fileName.split(".")[0] + '.ncol', function(data, err, stderr) {
    if(!err)
    {
      /* Build python parameters string */
      var pyPath = "mob" + folderChar;
      var pyProg = "coarsening.py";
      var pyParams = "-f uploads" + folderChar + indexController.fileName.split(".")[0] + folderChar + indexController.fileName.split(".")[0] + ".ncol -d uploads" + folderChar + indexController.fileName.split(".")[0] + folderChar + " -o " + pyName + " -v " + parseInt(indexController.graphSize.split(" ")[0]) + " " + parseInt(indexController.graphSize.split(" ")[1]) + " " + pyCoarsening + " --save_gml";
      if(req.body.coarsening == 0 || req.body.coarseningSecondSet == 0)
      {
        req.body.firstSet == 1 ? pyParams = pyParams + " -m " + req.body.nLevels + " 0 " : pyParams = pyParams + " -m 0 " + req.body.nLevels;
      }
      else
      {
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

/** System AJAX callback functions */

/**
 * Server-side callback function from 'express' framework for incoming graph. Create a local folder with same name as file, to store future coarsened graphs.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
exports.upload = function(req, res) {
  indexController.graphSize = [];
  currentLevel = 0;
  /* Create an incoming form object */
  var form = new formidable.IncomingForm();
  /* Specify that we want to allow the user to upload multiple files in a single request */
  form.multiples = true;
  /* Store all uploads in the /uploads directory */
  form.uploadDir = indexController.path.join(__dirname, '/uploads');
  /** Every time a file has been uploaded successfully, rename it to it's orignal name */
  form.on('file', function(field, file) {
    indexController.fs.rename(file.path, indexController.path.join(form.uploadDir, file.name), function(){return;});
    /** Creates directory for uploaded graph */
    indexController.nodeCmd.get('mkdir -p uploads' + indexController.folderChar + file.name.split(".")[0] + indexController.folderChar, function(data, err, stderr) {
      if (!err)
      {
        /* Assign global variable with file name for later coarsening */
        fileName = file.name;
        /* Transforms .gml file into .json extension file if file is .gml */
        if(file.name.split(".")[1] === "gml")
        {
          /** Convert to .json and move it to upload folder with same name */
          indexController.nodeCmd.get('python mob' + indexController.folderChar + 'gmlToJson3.py uploads' + indexController.folderChar + file.name + ' uploads' + indexController.folderChar + file.name.split(".")[0] + indexController.folderChar + file.name.split(".")[0] + '.json', function(data, err, stderr) {
                            if (!err)
                            {
                              /** Python script executed successfully; read .json file */
                              graphController.readJsonFile(form.uploadDir + indexController.folderChar + file.name.split(".")[0] + indexController.folderChar + file.name.split(".")[0] + '.json', fs, req, res);
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
            indexController.nodeCmd.get('cp uploads' + indexController.folderChar + file.name + ' uploads' + indexController.folderChar + file.name.split(".")[0] + indexController.folderChar + file.name, function(data, err, stderr){
              /** Python script executed successfully; read .json file */
                if(!err)
                {
                  graphController.readJsonFile(form.uploadDir + indexController.folderChar + file.name.split(".")[0] + indexController.folderChar + file.name.split(".")[0] + '.json', fs, req, res);
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
};

/**
 * Server-side callback function from 'express' framework for slide route. Get reduction factor from multilevel paradigm, execute multilevel, get new graph and send it to client.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
exports.coarse = function(req, res) {
  req.body.jsonInput = fixJSONInts(req.body.jsonInput);
  /** Check if input came from .json input */
  if(req.body.jsonInput !== undefined)
  {
    var pyPath = "mob" + indexController.folderChar;
    var pyProg = "coarsening.py";
    /** Execute python scripts */
    var file = { name: req.body.jsonInput.filename.split("/")[req.body.jsonInput.filename.split("/").length-1] } ;
    /** Creates directory for uploaded graph */
    indexController.nodeCmd.get('rm -r -f uploads' + indexController.folderChar + file.name.split(".")[0] + indexController.folderChar + '; mkdir -p uploads' + indexController.folderChar + file.name.split(".")[0] + indexController.folderChar, function(data, err, stderr) {
      if (!err)
      {
        /* Assign global variable with file name for later coarsening */
        indexController.fileName = file.name;
        /* Transforms .gml file into .json extension file if file is .gml */
        if(file.name.split(".")[1] === "gml")
        {
          /** Convert to .json and move it to upload folder with same name */
          indexController.nodeCmd.get('python mob' + indexController.folderChar + 'gmlToJson3.py uploads' + indexController.folderChar + file.name + ' uploads' + indexController.folderChar + file.name.split(".")[0] + indexController.folderChar + file.name.split(".")[0] + '.json', function(data, err, stderr) {
                            if (!err)
                            {
                                ncolAndCoarse(pyPath, pyProg, indexController.fs, req, res);
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
            indexController.nodeCmd.get('cp uploads' + indexController.folderChar + file.name + ' uploads' + indexController.folderChar + file.name.split(".")[0] + indexController.folderChar + file.name, function(data, err, stderr){
                if(!err)
                {
                  ncolAndCoarse(pyPath, pyProg, indexController.fs, req, res);
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
    /** Test if no coarsening has been applied to both sets; if such case is true, return original graph */
    if(req.body.coarsening == "0" && req.body.coarseningSecondSet == "0")
    {
      graphController.readJsonFile('uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + indexController.fileName.split(".")[0] + '.json', indexController.fs, req, res);
    }
    else
    {
      /* Changing file name according to graph name */
      pyName = indexController.fileName.split(".")[0] + "Coarsened" + "l" + req.body.coarsening.split(".").join("") + "r" + req.body.coarseningSecondSet.split(".").join("");
      var pyCoarsening = "-r " + req.body.coarsening + " " + req.body.coarseningSecondSet;
      if(req.body.nLevels !== undefined && req.body.nLevels != 0) pyCoarsening = pyCoarsening + " --save_hierarchy ";
      /** Check if coarsened file already exists; if not, generate a new coarsened file */
      indexController.fs.readFile('uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + pyName + '.json', 'utf8', function(err, data) {
        if(err) /* File doesn't exist */
        {
          createCoarsenedGraph(indexController.nodeCmd, indexController.folderChar, pyName, pyCoarsening, indexController.fs, req, res);
        }
        else /* File exists*/
        {
          /* Send data to client */
          res.end(graphController.addValues(data));
        }
      });
    }
  }
};

/**
 * Server-side callback function from 'express' framework for convert route. Convert coarsened graphs from .gml format to .json.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
exports.convert = function(req, res){
  var pyPath = "mob" + indexController.folderChar;
  /* Changing file name according to graph name */
  pyName = indexController.fileName.split(".")[0] + "Coarsened" + "l" + req.body.coarsening.split(".").join("") + "r" + req.body.coarseningSecondSet.split(".").join("");
  let hierarchicalPyName = pyName + "nl" + req.body.firstSetLevel + "nr" + req.body.secondSetLevel;
  /** Execute .gml to .json conversion */
  indexController.nodeCmd.get('python ' + pyPath + 'gmlToJson3.py uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + hierarchicalPyName + '.gml uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + hierarchicalPyName + ".json", function(data, err, stderr) {
    if(!err)
    {
      console.log('python ' + pyPath + 'gmlToJson3.py uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + hierarchicalPyName + '.gml uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + hierarchicalPyName + ".json");
      /** Finished conversion, return to client-side */
      res.type('text');
      res.end();
    }
    else
    {
      console.log("python script cmd error: " + err);
    }
  });
};

/**
 * Server-side callback function from 'express' framework for set properties route. Assign all .json properties for .json files after conversion from .gml.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
exports.setProperties = function(req, res){
  var pyPath = "mob" + indexController.folderChar;
  let hierarchicalPyName = pyName + "nl" + req.body.firstSetLevel + "nr" + req.body.secondSetLevel;
  /** Set properties properly using information from "source" attribue in .json file generated from multilevel paradigm */
  indexController.nodeCmd.get('python ' + pyPath + 'setProperties.py -f uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + ' -n ' + indexController.fileName.split(".")[0] + '.json -l ' + req.body.firstSetLevel + ' ' + req.body.secondSetLevel + ' -r ' + req.body.coarsening + ' ' + req.body.coarseningSecondSet, function(data, err, stderr) {
    if(!err)
    {
      console.log('python ' + pyPath + 'setProperties.py -f uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + ' -n ' + indexController.fileName.split(".")[0] + '.json -l ' + req.body.firstSetLevel + ' ' + req.body.secondSetLevel + ' -r ' + req.body.coarsening + ' ' + req.body.coarseningSecondSet);
      graphController.readJsonFile('uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + hierarchicalPyName + '.json', indexController.fs, req, res);
    }
    else
    {
      console.log("python script cmd error: " + err);
    }
  });
};

/**
 * Server-side callback function from 'express' framework for get graph route. Write "sorted" nodes in .s file, for later usage.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
exports.writeSorted = function(req, res){
  var fName = "n" + req.body.idx + ".s";
  indexController.fs.writeFile('uploads' + indexController.folderChar + indexController.fileName.split(".")[0] + indexController.folderChar + fName, req.body.nodes, function(err){
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
};

/**
 * Server-side callback function from 'express' framework for create categories route. Create 'categories.csv' file, containing current data attributes and their types.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
exports.categories = function(req, res){
  /** Write 'categories.csv' file */
  indexController.fs.writeFile("categories.csv", req.body.jsonInput, function(err){
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

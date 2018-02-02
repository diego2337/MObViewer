var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var bodyParser = require('body-parser');
var nodeCmd = require('node-cmd');
var fileName = "";
var graphSize = [];


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'build')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', __dirname+'/public/views');
// app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

/**
 * Add number of edges to .json string being created.
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
 * Check to see which operating system version is being used, assigning either '/' or '\' for folder paths.
 * @public
 * @returns {string} either '\' or '/' symbol for folder paths.
 */
function addFolderPath()
{
  return process.platform == "win32" ? "\\" : "/";
}

/**
 * Read .json file stored on server-side, sending it to client side.
 * @public
 * @param {string} path Path string for fs variable to read.
 * @param {Object} fs FileSystem API module.
 * @param {Object} res header to be sent via HTTP for HTML page, from Express API module callback 'post'.
 * @returns {string} if any error occurs during file read, return it via console; otherwise return nothing.
 */
function readJsonFile(path, fs, res)
{
  fs.readFile(path, 'utf8', function(err, data){
    if(err)
    {
      return console.log(err);
    }
    else
    {
      /* Store graph size */
      if(graphSize.length == 0) console.log("Entre uma vez somente pfvr"), graphSize = JSON.parse(data).graphInfo[0].vlayer;
      /* Send data to client */
      res.end(addNumberOfEdgesToJSON(data));
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
 * @param {Object} res header to be sent via HTTP for HTML page, from Express API module callback 'post'.
 * @returns {string} if any error occurs during file read, return it via console; otherwise return nothing.
 */
function createCoarsenedGraph(nodeCmd, folderChar, pyName, pyCoarsening, fs, res)
{
  /* Convert .json file to .ncol */
  nodeCmd.get('python mob' + folderChar + 'jsonToNcol.py --input uploads' + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + '.json --output uploads' + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + '.ncol', function(data, err, stderr) {
    if(!err)
    {
      // console.log("data from python script " + data);
      /* Build python parameters string */
      var pyPath = "mob" + folderChar;
      var pyProg = "coarsening.py";
      var pyParams = "-f uploads" + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + ".ncol -d uploads" + folderChar + fileName.split(".")[0] + folderChar + " -o " + pyName + " -v " + parseInt(graphSize.split(" ")[0]) + " " + parseInt(graphSize.split(" ")[1]) + " " + pyCoarsening + " -m 1 1 " + " -e gml" ;
      // console.log("pyParams: " + pyParams);
      /** Execute python scripts */
      /** Execute coarsening with a given reduction factor */
      nodeCmd.get('python ' + pyPath + pyProg + " " + pyParams, function(data, err, stderr) {
        if (!err)
        {
          // console.log("data from python script " + data);
          /* Execute .gml to .json conversion */
          nodeCmd.get('python ' + pyPath + 'gmlToJson2.py uploads' + folderChar + fileName.split(".")[0] + folderChar + pyName + '.gml uploads' + folderChar + fileName.split(".")[0] + folderChar + pyName + ".json", function(data, err, stderr) {
            if(!err)
            {
              // console.log("data from python script " + data);
              readJsonFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + pyName + '.json', fs, res);
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
  var folderChar = addFolderPath();
  /* Create an incoming form object */
  var form = new formidable.IncomingForm();
  /* Specify that we want to allow the user to upload multiple files in a single request */
  form.multiples = true;
  /* Store all uploads in the /uploads directory */
  form.uploadDir = path.join(__dirname, '/uploads');
  /** Every time a file has been uploaded successfully, rename it to it's orignal name */
  form.on('file', function(field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name), function(){return;});
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
            nodeCmd.get('python mob' + folderChar + 'gmlToJson2.py uploads' + folderChar + file.name + ' uploads' + folderChar + file.name.split(".")[0] + folderChar + file.name.split(".")[0] + '.json', function(data, err, stderr) {
                              if (!err)
                              {
                                /** Python script executed successfully; read .json file */
                                readJsonFile(form.uploadDir + folderChar + file.name.split(".")[0] + folderChar + file.name.split(".")[0] + '.json', fs, res);
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
                  readJsonFile(form.uploadDir + folderChar + file.name.split(".")[0] + folderChar + file.name.split(".")[0] + '.json', fs, res);
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
app.post('/slide', function(req, res) {
  var folderChar = addFolderPath();
  /** Test if no coarsening has been applied to both sets; if such case is true, return original graph */
  if(req.body.coarsening == "0" && req.body.coarseningSecondSet == "0")
  {
    readJsonFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + '.json', fs, res);
  }
  else
  {
    /* Changing file name according to graph name */
    var pyName = fileName.split(".")[0] + "Coarsened" + "l" + req.body.coarsening.split(".").join("") + "r" + req.body.coarseningSecondSet.split(".").join("");
    var pyCoarsening = "-r " + req.body.coarsening + " " + req.body.coarseningSecondSet;
    /** Check if coarsened file already exists; if not, generate a new coarsened file */
    fs.readFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + pyName + '.json', 'utf8', function(err, data) {
      if(err) /* File doesn't exist */
      {
        createCoarsenedGraph(nodeCmd, folderChar, pyName, pyCoarsening, fs, res);
      }
      else /* File exists*/
      {
        /* Send data to client */
        res.end(addNumberOfEdgesToJSON(data));
      }
    });
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
  var folderChar = addFolderPath();
  readJsonFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + '.json', fs, res);
});

/**
 * Server-side callback function from 'express' framework for main route.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
app.get('/', function(req, res){
  // res.sendFile(path.join(__dirname, 'public/views/index.html'));
  res.sendFile(path.join(__dirname, 'public/views/index.html'));
});

/** Main function to trigger server */
var server = app.listen(3030, function(){
  console.log('Server listening on port 3030');
});

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

/* Add number of edges to .json string */
function addNumberOfEdgesToJSON(data)
{
  var jason = JSON.parse(data);
  jason.graphInfo[0].edges = jason.links.length.toString();
  data = JSON.stringify(jason);
  return data;
}

/* Check to see which operating system version is being used, for assigning either '/' or '\' for folder paths */
function addFolderPath()
{
  return process.platform == "win32" ? "\\" : "/";
}

/* '.json' upload route */
app.post('/upload', function(req, res){
  var folderChar = addFolderPath();
  /* create an incoming form object */
  var form = new formidable.IncomingForm();

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;
  // form.multiples = false;

  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/uploads');

  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function(field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name), function(){return;});
    /* Creates directory for uploaded graph */
    // nodeCmd.run('mkdir -p uploads/' + file.name.split(".")[0]);
    nodeCmd.get('mkdir -p uploads' + folderChar + file.name.split(".")[0] + folderChar, function(data, err, stderr) {
                      if (!err) {
                        // console.log("data from python script " + data);
                        /* Assign variable with file name for later coarsening */
                        fileName = file.name;

                        /* Transforms .gml file into .json extension file if file is .gml */
                        // nodeCmd.run('python mob/gmlToJson2.py uploads' + folderChar + file.name + ' uploads' + folderChar + file.name.split(".")[0] + '/' + file.name.split(".")[0] + '.json');
                        if(file.name.split(".")[1] === "gml")
                        {
                          nodeCmd.get('python mob' + folderChar + 'gmlToJson2.py uploads' + folderChar + file.name + ' uploads' + folderChar + file.name.split(".")[0] + folderChar + file.name.split(".")[0] + '.json', function(data, err, stderr) {
                                            if (!err) {
                                              // console.log("data from python script " + data);
                                              fs.readFile(form.uploadDir + folderChar + file.name.split(".")[0] + folderChar + file.name.split(".")[0] + ".json", 'utf8', function(err, data){
                                                if(err)
                                                {
                                                  return console.log(err);
                                                }
                                                else
                                                {
                                                  // graphSize = JSON.parse(data).graphInfo[0].vlayer.split(" ");
                                                  /* Store graph size */
                                                  graphSize = JSON.parse(data).graphInfo[0].vlayer;
                                                  /* Send data to client */
                                                  res.end(addNumberOfEdgesToJSON(data));
                                                }
                                              });
                                            } else {
                                              console.log("python script cmd error: " + err);
                                            }
                                        });
                        }
                        else if(file.name.split(".")[1] === "json")
                        {
                          nodeCmd.get('cp uploads' + folderChar + file.name + ' uploads' + folderChar + file.name.split(".")[0] + folderChar + file.name, function(data, err, stderr){
                              if(!err) {
                                // console.log("data from python script " + data);
                                fs.readFile(form.uploadDir + folderChar + file.name.split(".")[0] + folderChar + file.name.split(".")[0] + ".json", 'utf8', function(err, data){
                                  if(err)
                                  {
                                    return console.log(err);
                                  }
                                  else
                                  {
                                    /* Store graph size */
                                    graphSize = JSON.parse(data).graphInfo[0].vlayer;
                                    /* Send data to client */
                                    res.end(addNumberOfEdgesToJSON(data));
                                  }
                                });
                              } else {
                                console.log("python script cmd error: " + err);
                              }
                          });
                        }
                      } else {
                        console.log("python script cmd error: " + err);
                        }
                  });
  });

  // log any errors that occur
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  // parse the incoming request containing the form data
  form.parse(req, function(err, fields, files){
  });
});

/* Sliders' change route */
app.post('/slide', function(req, res){
  var folderChar = addFolderPath();
  /* Test if no coarsening has been applied to both sets; if such case is true, return original graph */
  if(req.body.coarsening == "0" && req.body.coarseningSecondSet == "0")
  {
    /* Send .json data back to client */
    fs.readFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + '.json', 'utf8', function(err, data){
      if(err)
      {
        return console.log(err);
      }
      else
      {
        /* Send data to client */
        res.end(addNumberOfEdgesToJSON(data));
      }
    });
  }
  else
  {
    /* Changing file name according to program standard */
    var pyName = fileName.split(".")[0] + "Coarsened" + "l" + req.body.coarsening.split(".").join("") + "r" + req.body.coarseningSecondSet.split(".").join("");
    var pyCoarsening = "-r " + req.body.coarsening + " " + req.body.coarseningSecondSet;
    // if(req.body.firstSet) {
    //   pyCoarsening = pyCoarsening + " " + req.body.coarsening + " 0";
    //   pyName = pyName + "l" + req.body.coarsening.split(".").join("") + "r0";
    // } else {
    //   pyCoarsening = pyCoarsening + " 0 " + req.body.coarsening;
    //   pyName = pyName + "l0" + "r" + req.body.coarsening.split(".").join("");
    // }
    /* Check if coarsened file already exists; if not, generate a new coarsened file */
    fs.readFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + pyName + '.json', 'utf8', function(err, data){
      if(err) /* File doesn't exist */
      {
        /* Convert .json file to .ncol */
        nodeCmd.get('python mob' + folderChar + 'jsonToNcol.py --input uploads' + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + '.json --output uploads' + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + '.ncol', function(data, err, stderr){
          if(!err) {
            // console.log("data from python script " + data);
            /* Build python parameters string */
            var pyPath = "mob" + folderChar;
            var pyProg = "coarsening.py";
            var pyParams = "-f uploads" + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + ".ncol -d uploads" + folderChar + fileName.split(".")[0] + folderChar + " -o " + pyName + " -v " + parseInt(graphSize.split(" ")[0]) + " " + parseInt(graphSize.split(" ")[1]) + " " + pyCoarsening + " -m 1 1 " + " -e gml" ;
            // console.log("pyParams: " + pyParams);
            /* Execute python scripts */
            /* Execute coarsening with a given reduction factor */
            nodeCmd.get('python ' + pyPath + pyProg + " " + pyParams, function(data, err, stderr) {
                              if (!err) {
                                // console.log("data from python script " + data);
                                /* Execute .gml to .json conversion */
                                nodeCmd.get('python ' + pyPath + 'gmlToJson2.py uploads' + folderChar + fileName.split(".")[0] + folderChar + pyName + '.gml uploads' + folderChar + fileName.split(".")[0] + folderChar + pyName + ".json", function(data, err, stderr){
                                  if(!err) {
                                    // console.log("data from python script " + data);
                                    /* Send .json data back to client */
                                    fs.readFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + pyName + '.json', 'utf8', function(err, data){
                                      if(err)
                                      {
                                        return console.log(err);
                                      }
                                      else
                                      {
                                        /* Send data to client */
                                        res.end(addNumberOfEdgesToJSON(data));
                                      }
                                    });
                                  } else {
                                    console.log("python script cmd error: " + err);
                                  }
                                });
                              } else {
                                console.log("python script cmd error: " + err);
                                }
                          });
          } else {
            console.log("python script cmd error: " + err);
          }
        });
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

/* Switch layout route */
app.post('/switch', function(req, res){
  var folderChar = addFolderPath();
  /* Send data back to client */
  fs.readFile('uploads' + folderChar + fileName.split(".")[0] + folderChar + fileName.split(".")[0] + '.json', 'utf8', function(err, data){
    if(err)
    {
      return console.log(err);
    }
    else
    {
      /* Send data to client */
      res.end(addNumberOfEdgesToJSON(data));
    }
  });
  // /* Switch currrent layout */
  // switch(req.body.layout)
  // {
  //   /* Horizontal layout; change to vertical */
  //   case 2:
  //
  //   break;
  //   /* Vertical layout; change to horizontal */
  //   case 3:
  //
  //   break;
  //   default:
  //   break;
  // }
});

/* Main route */
app.get('/', function(req, res){
  // res.sendFile(path.join(__dirname, 'public/views/index.html'));
  res.sendFile(path.join(__dirname, 'public/views/newIndex.html'));
});

app.get('/visualization', function(req, res){
  res.sendFile(path.join(__dirname, 'public/views/visualization.html'));
});

/* Main function to trigger server */
var server = app.listen(3030, function(){
  console.log('Server listening on port 3030');
});

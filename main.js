var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'build')));

app.set('views', __dirname+'/public/views');
// app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

/* Main route */
app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'public/views/index.html'));
});

/* '.json' upload route */
app.post('/upload', function(req, res){
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
    fs.readFile(form.uploadDir + '/' + file.name, 'utf8', function(err, data){
      if(err)
      {
        return console.log(err);
      }
      else
      {
        /* TODO - Generate coarsened files */

        /* Send data to client */
        res.end(data);
      }
    });
  });

  // log any errors that occur
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  // form.on('end', function() {
  //   function waitForFile() {
  //     if(typeof form.openedFiles[0] !== undefined) {
  //       // console.log("form: ");
  //       // console.log(form);
  //       // console.log("file name: " + form.openedFiles[0].name);
  //       res.end(form.uploadDir + "/" + form.openedFiles[0].name);
  //     }
  //     else {
  //       setTimeout(waitForFile, 500);
  //     }
  //   }
  //   waitForFile();
  //   // res.end('success');
  // });

  // parse the incoming request containing the form data
  form.parse(req, function(err, fields, files){
    // console.log("files: ");
    // console.log(files);
  });
});

app.get('/visualization', function(req, res){
  res.sendFile(path.join(__dirname, 'public/views/visualization.html'));
});

/* Main function to trigger server */
var server = app.listen(3030, function(){
  console.log('Server listening on port 3030');
});

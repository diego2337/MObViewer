/**
 * Main Node.js file, containing requires for routers to execute server-side.
 * @author Diego Cintra
 * Date: 1 October 2018
 */

var express = require('express');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');
var serverPort = 3030;
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'build')));
/** Supporting large number of parameters */
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 100000000000000}));

var indexRouter = require('./public/routes/IndexRouter');
var systemRouter = require('./public/routes/SystemRouter');
var graphRouter = require('./public/routes/GraphRouter');
app.use('/', indexRouter);
app.use('/system', systemRouter);
app.use('/graph', graphRouter);

app.set('views', __dirname+'/public/views');
app.set('view engine', 'html');

/** Main function to trigger server */
var server = app.listen(serverPort, function(){
  console.log('Server listening on port ' + serverPort);
});

/**
 * Router for index related AJAX calls - based on https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/routes#Create_the_route-handler_callback_functions.
 * @author Diego Cintra
 * Date: 1 October 2018
 */
var express = require('express');
var router = express.Router();
var path = require('path');

/** Index routes */

/**
 * Server-side callback function from 'express' framework for main route.
 * @public @callback
 * @param {Object} req header incoming from HTTP;
 * @param {Object} res header to be sent via HTTP for HTML page.
 */
router.get('/', function(req, res){
  res.sendFile(path.join(__dirname, '../../views/index.html'));
});

module.exports = router;

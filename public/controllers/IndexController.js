/**
 * Controller for index related AJAX calls - based on https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/routes#Create_the_route-handler_callback_functions.
 * @author Diego Cintra
 * Date: 1 October 2018
 */

/**
 * Check to see which operating system version is being used, assigning either '/' or '\' for folder paths.
 * @public
 * @returns {string} either '\' or '/' symbol for folder paths.
 */
function addFolderPath()
{
  return process.platform == "win32" ? "\\" : "/";
}

/** General variables */
exports.path = require('path');
exports.fs = require('fs');
exports.nodeCmd = require('node-cmd');
exports.fileName = "";
exports.graphSize = [];
exports.pyName = "";
exports.currentLevel = 0;
exports.folderChar = addFolderPath();

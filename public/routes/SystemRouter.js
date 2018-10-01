/**
 * Router for system related AJAX calls - based on https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/routes#Create_the_route-handler_callback_functions.
 * @author Diego Cintra
 * Date: 1 October 2018
 */
var express = require('express');
var router = require('./IndexRouter');

/** Require controller modules */
var systemController = require('../controllers/SystemController');

/** System routes */
router.post('/system/upload', systemController.upload);

router.post('/system/coarse', systemController.coarse);

router.post('/system/convert', systemController.convert);

router.post('/system/setProperties', systemController.setProperties);

router.post('/system/writeSorted', systemController.writeSorted);

router.post('/system/categories', systemController.categories);

module.exports = router;

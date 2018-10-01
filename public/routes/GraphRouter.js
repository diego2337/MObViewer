/**
 * Router for graph related AJAX calls - based on https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/routes#Create_the_route-handler_callback_functions.
 * @author Diego Cintra
 * Date: 1 October 2018
 */
var express = require('express');
var router = require('./IndexRouter');

/** Require controller modules */
var graphController = require('../controllers/GraphController');

/** Graph routes */
router.post('/graph/switch', graphController.switch);

router.post('/graph/getLevels', graphController.getLevels);

router.post('/graph/getClusters', graphController.getClusters);

router.post('/graph/getGraph', graphController.getGraph);

router.post('/graph/getSortedSuccessors', graphController.getSortedSuccessors);

router.post('/graph/getSorted', graphController.getSorted);

router.post('/graph/generateStats', graphController.generateStats);

router.post('/graph/getStats', graphController.getStats);

router.post('/graph/getEdgesWeights', graphController.getEdgesWeights);

module.exports = router;

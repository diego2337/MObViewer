// /**
//   * Base class for building scene and performing preprocessing operations, such as node size and node positions.
//   * Author: Diego S. Cintra
//   */
//
// var Graph = require('../src/graph.js');
// var Node = require('../src/node.js');
// var Edge = require('../src/edge.js');
// var THREE = require('../../../node_modules/three/build/three.js');
//
// /**
//  * Constructor
//  * params:
//  *    - jsonFile: JSON graph
//  */
// var SceneBuilder = function(jsonFile)
// {
// 	/* Converting text string to JSON */
//     var jason = JSON.parse(jsonFile);
//
//     /* Instantiating Graph */
//     this.graph = new Graph(jason, 2, 10, 70);
//
//     /* Create the scene */
//     this.scene = new THREE.Scene();
//
//     /* Create lights to associate with scene */
//     var lights = [];
//     lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 );
//     lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );
//     lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 );
//
//     lights[ 0 ].position.set( 0, 2, 0 );
//     lights[ 1 ].position.set( 1, 2, 1 );
//     lights[ 2 ].position.set( - 1, - 2, - 1 );
//
//     this.scene.add( lights[ 0 ] );
//     this.scene.add( lights[ 1 ] );
//     this.scene.add( lights[ 2 ] );
// }
//
// SceneBuilder.prototype.build = function()
// {
//     /* Build graph */
//     // graph.buildGraph(scene);
//     this.graph.buildGraph();
//
//     /* Add graph elements to scene */
//     for(var i = 0; i < this.graph.getNumberOfNodes(); i++)
//     {
//     	this.scene.add(this.graph.getNodeByIndex(i).getCircle());
//     }
//     for(var i = 0; i < this.graph.getNumberOfEdges(); i++)
//     {
//     	this.scene.add(this.graph.getEdgeByIndex(i).getLine());
//     }
// }
//
// module.exports = SceneBuilder;

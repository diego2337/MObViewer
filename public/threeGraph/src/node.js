/**
 * Base class for a node in the graph.
 * Author: Diego S. Cintra
 */

var THREE = require('../../../node_modules/three/build/three.js');
var ecmaStandard = require('../utils/ecmaStandard.js');

/**
 * Constructor
 * params:
 *    - circleGeometry: a geometry of type circle (from three.js);
 *    - meshBasicMaterial: material for the geometry (from three.js).
 *
function Node(circleGeometry, meshBasicMaterial)
{
    this.circleGeometry = circleGeometry;
    this.meshBasicMaterial = meshBasicMaterial;
}*/

/**
 * Constructor
 * params:
 *    - nodeObject: the node object taken from the JSON file;
 *    - min: min value to be used in feature scaling;
 *    - max: max value to be used in feature scaling;
 *    - circleGeometry: a geometry of type circle (from three.js);
 *    - meshBasicMaterial: material for the geometry (from three.js).
 */
var Node = function(nodeObject, min, max, circleGeometry, meshBasicMaterial)
{
    min = ecmaStandard(min, 0);
    max = ecmaStandard(max, 10);
    circleGeometry = ecmaStandard(circleGeometry, undefined);
    meshBasicMaterial = ecmaStandard(meshBasicMaterial, undefined);
    try
    {
        // CHANGED - INCLUDED this.nodeObject; REMOVED this.id, this.weight
        this.nodeObject = nodeObject;
        //this.id = toInt(nodeObject.id);
        //this.weight = toInt(nodeObject.weight);
    }
    catch(err)
    {
        throw "Constructor must have nodeObject type as first parameter! " +
        " Constructor " +
            " params: " +
            "    - nodeObject: the node object taken from the JSON file; " +
            "    - circleGeometry: a geometry of type circle (from three.js); " +
            "    - meshBasicMaterial: material for the geometry (from three.js).";
    }
    finally
    {
        // CHANGED - FROM this.weight TO this.nodeObject.weight
        if(this.nodeObject.weight == undefined)
        {
            this.nodeObject.weight = 1;
        }

        /* Use feature scaling to fit nodes */
        var x = (this.nodeObject.weight - min)/(max-min);
        this.circleGeometry = new THREE.CircleGeometry(x, 100);

        if(meshBasicMaterial == undefined)
        {
            this.meshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide, depthFunc: THREE.AlwaysDepth });
        }
        else
        {
            this.meshBasicMaterial = meshBasicMaterial;
        }
        this.circle = new THREE.Mesh(this.circleGeometry, this.meshBasicMaterial);
        this.circle.name = "" + this.nodeObject.id;
        this.circle.geometry.computeFaceNormals();
        this.circle.geometry.computeBoundingBox();
        this.circle.geometry.computeBoundingSphere();
        // this.circle.geometry.boundingBox = null;
        this.circle.geometry.verticesNeedUpdate = true;
        this.circle.renderOrder = 1;
    }
}

/**
 * Define constructor

Node.prototype.constructor = Node;
*/

/**
 * Getter for node - COPY, NOT REFERENCE
 */
Node.prototype.getNode = function()
{
    var node = new Node();
    node.setCircleGeometry(this.circleGeometry);
    node.setMeshBasicMaterial(this.meshBasicMaterial);
    node.setCircle(this.circle);
    return node;
}

/**
 * Sets the current node with new node attributes
 * param:
 *    - node: node for copying.
 */
Node.prototype.setNode = function(node)
{
    this.setCircleGeometry(node.circleGeometry);
    this.setMeshBasicMaterial(node.meshBasicMaterial);
    this.setCircle(node.circle);
}

/**
 * Getter for circleGeometry
 */
Node.prototype.getCircleGeometry = function()
{
    return this.circleGeometry;
}

/**
 * Setter for circleGeometry
 */
Node.prototype.setCircleGeometry = function(circleGeometry)
{
    this.circleGeometry = circleGeometry;
}

/**
 * Getter for meshBasicMaterial
 */
Node.prototype.getMeshBasicMaterial = function()
{
    return this.meshBasicMaterial;
}

/**
 * Setter for meshBasicMaterial
 */
Node.prototype.setMeshBasicMaterial = function(meshBasicMaterial)
{
    this.meshBasicMaterial = meshBasicMaterial;
}

/**
 * Getter for circle
 */
Node.prototype.getCircle = function()
{
    return this.circle;
}

/**
 * Setter for circle
 */
Node.prototype.setCircle = function(circle)
{
    this.circle = circle;
}

/**
 * Build the node into the scene
 * params:
 *    - layout: the graph layout;
 *    - theta: used in the parametric equation of radial layout.
 */
Node.prototype.buildNode = function(theta, layout)
{
    switch(layout)
    {
        case 1: // Force-directed layout
            buildForceDirected();
            break;
        case 2: // Radial layout
            this.buildRadial(theta);
            break;
        case 3: // Bipartite layout
            buildBipartite();
            break;
        default:
            break;
    }
}

/**
 * Build a node into the scene, using a force directed layout
 */
Node.prototype.buildForceDirected = function()
{
    console.log("To be implemented");
}

/**
 * Build a node into the scene, using a radial layout
 * param:
 *    - theta: used in the parametric equation of radial layout.
 */
Node.prototype.buildRadial = function(theta)
{
    /* Parametric equation of a circle */
    var x = 15 * Math.sin(theta);
    var y = 15 * Math.cos(theta);
    this.circle.position.set(x, y, 0);
}

/**
 * Build a node into the scene, using a bipartite layout
 */
Node.prototype.buildBipartite = function()
{
    console.log("To be implemented");
}

/**
 * Highlight node
 */
Node.prototype.highlight = function()
{
    this.circle.material.color.setHex(0xFF0000);
}

/**
 * Unhighlight node
 */
Node.prototype.unhighlight = function()
{
    this.circle.material.color.setHex(0x000000);
}

module.exports = Node;

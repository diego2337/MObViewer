/**
 * Base class for a node in the graph.
 * Author: Diego S. Cintra
 */

/**
 * Constructor
 * params: 
 *    - circleGeometry: a geometry of type circle (from three.js);
 *    - meshStandardMaterial: material for the geometry (from three.js).
 *
function Node(circleGeometry, meshStandardMaterial)
{
    this.circleGeometry = circleGeometry;
    this.meshStandardMaterial = meshStandardMaterial;
}*/

/**
 * Constructor
 * params:
 *    - nodeObject: the node object taken from the JSON file
 */
function Node(nodeObject)
{
    
}

/**
 * Getter and setter for circleGeometry
 */
Node.prototype.getCircleGeometry = function()
{
    return this.circleGeometry;
}

Node.prototype.setCircleGeometry = function(circleGeometry)
{
    this.circleGeometry = circleGeometry;
}

/**
 * Getter and setter for meshStandardMaterial
 */
Node.prototype.getMeshStandardMaterial = function()
{
    return this.meshStandardMaterial;
}

Node.prototype.setMeshStandardMaterial = function(meshStandardMaterial)
{
    this.meshStandardMaterial = meshStandardMaterial;
}
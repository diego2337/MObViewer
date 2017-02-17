/**
 * Base class for a node in the graph.
 * Author: Diego S. Cintra
 */

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
 *    - circleGeometry: a geometry of type circle (from three.js);
 *    - meshBasicMaterial: material for the geometry (from three.js).
 */
function Node(nodeObject, circleGeometry = undefined, meshBasicMaterial = undefined)
{
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
        if(this.nodeObject.weight != undefined)
        {
            // CHANGED - FROM this.weight TO this.nodeObject.weight
            this.circleGeometry = new THREE.CircleGeometry(this.nodeObject.weight, 100);
        }
        else
        {
            this.circleGeometry = new THREE.CircleGeometry(1, 100);
        }

        if(meshBasicMaterial == undefined)
        {
            this.meshBasicMaterial = new THREE.MeshBasicMaterial({ color: "rgb(255, 255, 255)" });
        }
        else
        {
            this.meshBasicMaterial = meshBasicMaterial;
        }
        this.circle = new THREE.Mesh(circleGeometry, meshBasicMaterial);
    }
}

/**
 * Define constructor
 
Node.prototype.constructor = Node;
*/

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
            //buildRadial(theta);
            var x = this.nodeObject.weight * Math.sin(theta);
            var y = this.nodeObject.weight * Math.cos(theta);

            this.circle.position.set(x, y, 0);
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
    var x = this.nodeObject.weight * Math.sin(theta);
    var y = this.nodeObject.weight * Math.cos(theta);

    this.circle.position.set(x, y, 10);
}

/**
 * Build a node into the scene, using a bipartite layout
 */
Node.prototype.buildBipartite = function()
{
    console.log("To be implemented");
}
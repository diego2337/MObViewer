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
 *    - meshBasicMaterial: material for geometry (from three.js).
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
        // CHANGED - FROM this.weight TO this.nodeObject.weight
        if(this.nodeObject.weight == undefined)
        {
            this.nodeObject.weight = 1;
        }

        /* Use feature scaling to fit nodes */
        var x = (this.nodeObject.weight - min)/(max-min) + 1.5;
        // circleGeometry.scale(x, x, x);
        // this.circleGeometry = new THREE.CircleGeometry(x, 100);

        /* Store number of nodes from each layer */

        // if(meshBasicMaterial == undefined)
        // {
        //     this.meshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.FrontSide, depthFunc: THREE.AlwaysDepth });
        // }
        // else
        // {
        //     this.meshBasicMaterial = meshBasicMaterial;
        // }
    }
    catch(err)
    {
        throw "Constructor must have nodeObject type as first parameter! " +
        " Constructor " +
            " params: " +
            "    - nodeObject: the node object taken from the JSON file; " +
            "    - min: min value to be used in feature scaling; " +
            "    - max: max value to be used in feature scaling; " +
            "    - circleGeometry: a geometry of type circle (from three.js); " +
            "    - meshBasicMaterial: material for geometry (from three.js).";
    }
    finally
    {
        this.circle = new THREE.Mesh(circleGeometry, meshBasicMaterial);
        this.circle.scale.set(x, x, x);
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
 *    - index: index of current node;
 *    - firstLayer: number of nodes in first layer of bipartite graph;
 *    - lastLayer: number of nodes in second (or last) layer of bipartite graph;
 *    - alpha: value used in bipartite layout;
 *    - layout: the graph layout;
 *    - theta: used in the parametric equation of radial layout.
 */
Node.prototype.buildNode = function(index, firstLayer, lastLayer, alpha, theta, layout)
{
    switch(layout)
    {
        case 1: // Force-directed layout
            this.buildForceDirected();
            break;
        case 2: // Radial layout
            this.buildRadial(theta);
            break;
        case 3: // Bipartite layout
            this.buildBipartite(index, firstLayer, lastLayer, alpha, theta);
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
    var x = 15.00000 * Math.sin(theta);
    var y = 15.00000 * Math.cos(theta);
    // console.log("x: " + x);
    // console.log("y: " + y);
    this.circle.position.set(x, y, 0);
}

/**
 * Build a node into the scene, using a bipartite layout
 * params:
 *    - index: index of node being positioned;
 *    - firstLayer: number of nodes in first layer of bipartite graph;
 *    - lastLayer: number of nodes in second (or last) layer of bipartite graph;
 *    - alpha: value for spacing of parallel lines;
 *    - theta: used for bipartite layout.
 */
Node.prototype.buildBipartite = function(index, firstLayer, lastLayer, alpha, theta)
{
    /* Separate vertical lines according to number of layers */
    if(index >= firstLayer)
    {
        var y = alpha;
        // index = (Math.abs( firstLayer - lastLayer ) / 2) - firstLayer;
        index = lastLayer;
        // index = Math.round(index / lastLayer) + lastIndex;
    }
    else
    {
        var y = alpha * (-1);
    }
    x = index * theta;
    this.circle.position.set(x, y, 0);
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

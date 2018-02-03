/**
 * @constructor
 * @param {Object} nodeObject The node object taken from the JSON file.
 * @param {int} min Min value to be used in feature scaling.
 * @param {int} max Max value to be used in feature scaling.
 * @param {Object} circleGeometry A geometry of type circle (from three.js).
 * @param {Object} meshBasicMaterial Material for geometry (from three.js).
 */
var Node = function(nodeObject, min, max, circleGeometry, meshBasicMaterial)
{
    min = ecmaStandard(min, 0);
    max = ecmaStandard(max, 10);
    circleGeometry = ecmaStandard(circleGeometry, undefined);
    meshBasicMaterial = ecmaStandard(meshBasicMaterial, undefined);
    try
    {
        this.nodeObject = nodeObject;
        if(this.nodeObject.weight == undefined)
        {
            this.nodeObject.weight = 1;
        }
        /* Use feature scaling to fit nodes */
        var x = (this.nodeObject.weight - min)/(max-min) + 1.5;
        if(circleGeometry == undefined)
        {
            this.circleGeometry = new THREE.circleGeometry(1, 32);
        }
        else
        {
            this.circleGeometry = circleGeometry;
        }

        if(meshBasicMaterial == undefined)
        {
            this.meshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.FrontSide, depthFunc: THREE.AlwaysDepth });
        }
        else
        {
          this.meshBasicMaterial = meshBasicMaterial;
        }
    }
    catch(err)
    {
        throw "Constructor must have nodeObject type as first parameter! ";
    }
    finally
    {
        this.circle = new THREE.Mesh(this.circleGeometry, this.meshBasicMaterial);
        this.circle.scale.set(x, x, x);
        this.circle.name = "" + this.nodeObject.id;
        this.circle.geometry.computeFaceNormals();
        this.circle.geometry.computeBoundingBox();
        this.circle.geometry.computeBoundingSphere();
        this.circle.geometry.verticesNeedUpdate = true;
        this.circle.renderOrder = 1;
    }
}

/**
 * Getter for node via copy, not reference.
 * @public
 * @returns {Object} Node type object.
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
 * Sets the current node with new node attributes.
 * @public
 * @param {Object} node Node for copying.
 */
Node.prototype.setNode = function(node)
{
    this.setCircleGeometry(node.circleGeometry);
    this.setMeshBasicMaterial(node.meshBasicMaterial);
    this.setCircle(node.circle);
}

/**
 * Getter for circleGeometry.
 * @public
 * @returns {Object} THREE.CircleGeometry type object.
 */
Node.prototype.getCircleGeometry = function()
{
    return this.circleGeometry;
}

/**
 * Setter for circleGeometry.
 * @public
 * @param {Object} circleGeometry THREE.CircleGeometry type object.
 */
Node.prototype.setCircleGeometry = function(circleGeometry)
{
    this.circleGeometry = circleGeometry;
}

/**
 * Getter for meshBasicMaterial.
 * @public
 * @returns {Object} THREE.MeshBasicMaterial type object.
 */
Node.prototype.getMeshBasicMaterial = function()
{
    return this.meshBasicMaterial;
}

/**
 * Setter for meshBasicMaterial.
 * @public
 * @param {Object} meshBasicMaterial THREE.MeshBasicMaterial type object.
 */
Node.prototype.setMeshBasicMaterial = function(meshBasicMaterial)
{
    this.meshBasicMaterial = meshBasicMaterial;
}

/**
 * Getter for circle.
 * @public
 * @returns {Object} THREE.Mesh type object.
 */
Node.prototype.getCircle = function()
{
    return this.circle;
}

/**
 * Setter for circle.
 * @public
 * @param THREE.Mesh type object.
 */
Node.prototype.setCircle = function(circle)
{
    this.circle = circle;
}

/**
 * Build node into scene.
 * @public
 * @param {int} index Index of current node.
 * @param {int} firstLayer Number of nodes in first layer of bipartite graph.
 * @param {int} lastLayer Number of nodes in second (or last) layer of bipartite graph.
 * @param {int} alpha Value for spacing of parallel lines.
 * @param {int} theta Used to define distance of nodes.
 * @param {int} layout Used for checking if layout is either vertical bipartite (0) or horizontal bipartite (1).
 */
Node.prototype.buildNode = function(index, firstLayer, lastLayer, alpha, theta, layout)
{
    switch(layout)
    {
        /** Radial layout */
        case 1:
            this.buildRadial(theta);
            break;
        /** Bipartite layout - horizontal */
        case 2:
            this.buildBipartite(index, firstLayer, lastLayer, alpha, theta, 1);
            break;
        /** Bipartite layout - vertical */
        case 3:
            this.buildBipartite(index, firstLayer, lastLayer, alpha, theta, 0);
            break;
        default:
            break;
    }
}

/**
 * Build node into scene, using a radial layout.
 * @public
 * @param {int} theta Used in the parametric equation of radial layout.
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
 * Build node into scene, using a bipartite layout.
 * @public
 * @param {int} index Index of node being positioned.
 * @param {int} firstLayer Number of nodes in first layer of bipartite graph.
 * @param {int} lastLayer Number of nodes in second (or last) layer of bipartite graph.
 * @param {int} alpha Value for spacing of parallel lines.
 * @param {int} theta sed to define distance of nodes.
 * @param {int} horizontal Boolean to check if layout is bipartite horizontal or vertical.
 */
Node.prototype.buildBipartite = function(index, firstLayer, lastLayer, alpha, theta, horizontal)
{
    /* Separate vertical lines according to number of layers */
    if(index >= firstLayer)
    {
        var y = alpha;
        index = lastLayer;
    }
    else
    {
        var y = alpha * (-1);
    }
    x = index * theta;
    horizontal ? this.circle.position.set(x, y, 0) : this.circle.position.set(y, x, 0);
}

/**
 * Highlight node.
 * @public
 */
Node.prototype.highlight = function()
{
    this.circle.material.color.setHex(0xFF0000);
}

/**
 * Unhighlight node.
 * @public
 */
Node.prototype.unhighlight = function()
{
    this.circle.material.color.setHex(0x000000);
}

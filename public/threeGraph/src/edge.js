/**
 * Constructor
 * params:
 *    - edgeObject: the edge object taken from the JSON file;
 *    - min: min value to be used in feature scaling;
 *    - max: max value to be used in feature scaling;
 *    - geometry: optimized geometry to build line (from three.js);
 *    - lineBasicMaterial: material for geometry (from three.js).
 */
// var Edge = function(edgeObject, min, max, geometry, lineBasicMaterial)
var Edge = function(edgeObject, min, max, geometry, lineBasicMaterial)
{
    /* Pre ECMAScript 2015 standardization */
    // min = typeof min !== 'undefined' ? min : 0;
    // max = typeof max !== 'undefined' ? max : 50;
    min = ecmaStandard(min, 0);
    max = ecmaStandard(max, 100);
    // geometry = typeof geometry !== 'undefined' ? geometry : undefined;
    // lineBasicMaterial = typeof lineBasicMaterial !== 'undefined' ? lineBasicMaterial : undefined;
    try
    {
        this.edgeObject = edgeObject;
        /* Defining edge id by concatenation of source and target nodes' id */
        this.edgeObject.id = "e" + edgeObject.source.toString() + edgeObject.target.toString();
        if(this.edgeObject.weight == undefined)
        {
            this.edgeObject.weight = 1;
        }

        /* Use feature scaling to fit edges */
        this.edgeRadius = (this.edgeObject.weight - min)/(max-min);
        lineBasicMaterial = new THREE.LineBasicMaterial({linewidth: this.edgeRadius, color: 0x8D9091, side: THREE.DoubleSide});
        this.line = new THREE.LineSegments(geometry, lineBasicMaterial);
        this.line.name = "e" + this.edgeObject.source+this.edgeObject.target;
        this.line.boundingBox = null;
        this.line.renderOrder = 0;
        this.line.matrixAutoUpdate = false;
    }
    catch(err)
    {
        throw "Constructor must have edgeObject type as first parameter! " +
        " Constructor " +
            " params: " +
            "    - edgeObject: the edge object taken from the JSON file; " +
            "    - min: min value to be used in feature scaling; " +
            "    - max: max value to be used in feature scaling; " +
            "    - geometry: a generic geometry (from three.js); " +
            "    - lineBasicMaterial: line material for the object (from three.js).";
    }
    finally
    {
        // if(geometry != undefined && lineBasicMaterial == undefined)
        // {
        //     this.geometry = geometry;
        //     this.lineBasicMaterial = new THREE.LineBasicMaterial({linewidth: this.edgeRadius, color: 0x8D9091, side: THREE.DoubleSide});
        // }
        // else if(geometry == undefined && lineBasicMaterial != undefined)
        // {
        //     this.geometry = new THREE.Geometry();
        //     this.lineBasicMaterial = lineBasicMaterial;
        // }
        // else if(geometry != undefined && lineBasicMaterial != undefined)
        // {
        //     this.geometry = geometry;
        //     this.lineBasicMaterial = lineBasicMaterial;
        // }
        // else
        // {
        //     this.geometry = new THREE.Geometry();
        //     this.lineBasicMaterial = new THREE.LineBasicMaterial({linewidth: this.edgeRadius, color: 0x8D9091, side: THREE.DoubleSide});
        // }

        /* TODO - eliminates ray tracing completely */
        // this.geometry.computeBoundingSphere();
        // this.geometry.computeFaceNormals();
        // this.geometry.boundingBox = null;
        // this.geometry.verticesNeedUpdate = true;
        // this.geometry.computeLineDistances();
        // this.geometry.computeBoundingBox();
        // this.geometry.computeFlatVertexNormals();
        // this.geometry.computeLineDistances();
        // this.geometry.computeMorphNormals();
        // this.geometry.verticesNeedUpdate = true;
    }
}

/**
 * Getter for edge - COPY, NOT REFERENCE
 */
Edge.prototype.getEdge = function()
{
    var edge = new Edge();
    edge.setGeometry(this.circleGeometry);
    edge.setLineBasicMaterial(this.lineBasicMaterial);
    edge.setLine(this.line);
    return edge;
}

/**
 * Sets the current edge with new edge attributes
 * param:
 *    - Edge: edge for copying.
 */
Edge.prototype.setEdge = function(edge)
{
    this.setGeometry(edge.geometry);
    this.setlineBasicMaterial(edge.setlineBasicMaterial);
    this.setLine(edge.line);
}

/**
 * Getter for Geometry
 */
Edge.prototype.getGeometry = function()
{
    return this.geometry;
}

/**
 * Setter for Geometry
 */
Edge.prototype.setGeometry = function(geometry)
{
    this.geometry = geometry;
}

/**
 * Getter for lineBasicMaterial
 */
Edge.prototype.getlineBasicMaterial = function()
{
    return this.lineBasicMaterial;
}

/**
 * Setter for lineBasicMaterial
 */
Edge.prototype.setlineBasicMaterial = function(lineBasicMaterial)
{
    this.lineBasicMaterial = lineBasicMaterial;
}

/**
 * Getter for line
 */
Edge.prototype.getLine = function()
{
    return this.line;
}

/**
 * Setter for line
 */
Edge.prototype.setLine = function(line)
{
    this.line = line;
}

/**
 * Build the edge into the scene
 * params:
 *    - geometry: geometry for edges;
 *    - source: source node from which the edge starts (if directed);
 *    - target: target node from which the edge ends (if dirceted).
 */
Edge.prototype.buildEdge = function(geometry, source, target)
{
    var sourcePos = source.getCircle().position;
    var targetPos = target.getCircle().position;
    var v1 = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z);
    var v2 = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
    geometry.vertices.push(v1);
    geometry.vertices.push(v2);
    // this.geometry = new THREE.Geometry();
    // var path = new Float32Array([
    //     sourcePos.x, sourcePos.y, sourcePos.z,
    //
    //     targetPos.x, targetPos.y, targetPos.z
    // ]);
    // geometry.addAttribute('position', new THREE.BufferAttribute( path, 3 ));
    // this.line.geometry.addAttribute('position', new THREE.BufferAttribute( path, 3 ));
    // this.geometry.computeFaceNormals();
    // this.geometry.computeVertexNormals();
    // this.geometry.computeBoundingSphere();
}

/**
 * Highlight edge
 */
Edge.prototype.highlight = function()
{
    this.line.material.color.setHex(0xFF0000);
}

/**
 * Unhighlight edge
 */
Edge.prototype.unhighlight = function()
{
    this.line.material.color.setHex(0x8D9091);
}

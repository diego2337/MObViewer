/**
 * Base class for a edge in the graph.
 * Author: Diego S. Cintra
 */

/**
 * Constructor
 * params:
 *    - edgeObject: the edge object taken from the JSON file;
 *    - tubeGeometry: a generic tubeGeometry (from three.js);
 *    - lineBasicMaterial: line material for the object (from three.js).
 */
function Edge(edgeObject, min = 0, max = 50, tubeGeometry = undefined, lineBasicMaterial = undefined)
{
    try
    {
        this.edgeObject = edgeObject;
        /* Defining edge id by concatenation of source and target nodes' id */
        this.edgeObject.id = "e" + edgeObject.source.toString() + edgeObject.target.toString();
    }
    catch(err)
    {
        throw "Constructor must have edgeObject type as first parameter! " +
        " Constructor " +
            " params: " +
            "    - edgeObject: the edge object taken from the JSON file; " +
            "    - tubeGeometry: a generic tubeGeometry (from three.js); " +
            "    - lineBasicMaterial: line material for the object (from three.js)."; 
    }
    finally
    {
        if(this.edgeObject.weight == undefined)
        {
            this.edgeObject.weight = 1;
        }
        /* Instantiates simple curve */
        this.edgeLineCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3()]);

        /* Use feature scaling to fit edges */
        this.edgeRadius = (this.edgeObject.weight - min)/(max-min);
        if(tubeGeometry != undefined && lineBasicMaterial == undefined)
        {
            this.tubeGeometry = tubeGeometry;
            this.lineBasicMaterial = new THREE.LineBasicMaterial({ color: 0x8D9091, side: THREE.DoubleSide});
        }
        else if(tubeGeometry == undefined && lineBasicMaterial != undefined)
        {
            this.tubeGeometry = new THREE.TubeGeometry(this.edgeLineCurve, 64, edgeRadius, 8, true);
            this.lineBasicMaterial = lineBasicMaterial;
        }
        else if(tubeGeometry != undefined && lineBasicMaterial != undefined)
        {
            this.tubeGeometry = tubeGeometry;
            this.lineBasicMaterial = lineBasicMaterial;
        }
        else
        {
            this.tubeGeometry = new THREE.TubeGeometry(this.edgeLineCurve, 64, this.edgeRadius, 8, true);
            this.lineBasicMaterial = new THREE.LineBasicMaterial({ color: 0x8D9091, side: THREE.DoubleSide});
        }
        this.tubeGeometry.computeLineDistances();

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
    edge.setTubeGeometry(this.circletubeGeometry);
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
    this.setTubeGeometry(edge.tubeGeometry);
    this.setlineBasicMaterial(edge.setlineBasicMaterial);
    this.setLine(edge.line);
}

/**
 * Getter for tubeGeometry
 */
Edge.prototype.getTubeGeometry = function()
{
    return this.tubeGeometry;
}

/**
 * Setter for tubeGeometry
 */
Edge.prototype.setTubeGeometry = function(tubeGeometry)
{
    this.tubeGeometry = tubeGeometry;
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
 *    - source: source node from which the edge starts (if directed);
 *    - target: target node from which the edge ends (if dirceted).
 */
Edge.prototype.buildEdge = function(source, target)
{
    var sourcePos = source.getCircle().position;
    var targetPos = target.getCircle().position;
    // this.tubeGeometry.vertices.push(
    //     new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z),
    //     new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z)
    // );
    this.edgeLineCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z), new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z)]);
    this.tubeGeometry = new THREE.TubeGeometry(this.edgeLineCurve, 64, this.edgeRadius, 8, true);
    this.tubeGeometry.computeFaceNormals();
    this.tubeGeometry.computeVertexNormals();
    this.tubeGeometry.computeBoundingSphere();
    this.line = new THREE.Mesh(this.tubeGeometry, this.lineBasicMaterial);
    this.line.name = "e" + this.edgeObject.source+this.edgeObject.target;
    this.line.boundingBox = null;
    this.line.renderOrder = 0;
    console.log(this.line);
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
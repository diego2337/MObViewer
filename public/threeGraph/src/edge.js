/**
 * @constructor
 * @param {Object} edgeObject The edge object taken from the JSON file.
 * @param {int} min Min value to be used in feature scaling.
 * @param {int} max Max value to be used in feature scaling.
 * @param {Object} geometry Optimized geometry to build line (from three.js).
 * @param {Object} lineBasicMaterial Material for geometry (from three.js).
 */
var Edge = function(edgeObject, min, max, geometry, lineBasicMaterial)
{
    /* Pre ECMAScript 2015 standardization */
    min = ecmaStandard(min, 0);
    max = ecmaStandard(max, 100);
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
        this.line = new MeshLine();
    }
    catch(err)
    {
        throw "Constructor must have edgeObject type as first parameter! ";
    }
}

/**
 * Getter for edge via copy, not reference.
 * @public
 * @returns {Object} Edge type object.
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
 * Sets the current edge with new node attributes.
 * @public
 * @param {Object} edge Edge for copying.
 */
Edge.prototype.setEdge = function(edge)
{
    this.setGeometry(edge.geometry);
    this.setlineBasicMaterial(edge.setlineBasicMaterial);
    this.setLine(edge.line);
}

/**
 * Build edge into scene.
 * @public
 * @param {Object} geometry Geometry for edges.
 * @param {Object} source Source node from which the edge starts.
 * @param {Object} target Target node from which the edge ends.
 */
Edge.prototype.buildEdge = function(geometry, source, target)
{
    var sourcePos = source.getCircle().position;
    var targetPos = target.getCircle().position;
    var v1 = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z);
    var v2 = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
    geometry.vertices.push(v1);
    geometry.vertices.push(v2);
}

/**
 * Highlight edge.
 * @public
 */
Edge.prototype.highlight = function()
{
    this.line.material.color.setHex(0xFF0000);
}

/**
 * Unhighlight edge.
 * @public
 */
Edge.prototype.unhighlight = function()
{
    this.line.material.color.setHex(0x8D9091);
}

/**
 * Base class for a edge in the graph.
 * Author: Diego S. Cintra
 */

/**
 * Constructor
 * params:
 *    - edgeObject: the edge object taken from the JSON file;
 *    - geometry: a generic geometry (from three.js);
 *    - lineBasicMaterial: line material for the object (from three.js).
 */
function Edge(edgeObject, geometry = undefined, lineBasicMaterial = undefined)
{
    try
    {
        this.edgeObject = edgeObject;
        /* Defining edge id by concatenation of source and target nodes' id */
        this.edgeObject.id = edgeObject.source.toString() + edgeObject.target.toString();
    }
    catch(err)
    {
        throw "Constructor must have edgeObject type as first parameter! " +
        " Constructor " +
            " params: " +
            "    - edgeObject: the edge object taken from the JSON file; " +
            "    - geometry: a generic geometry (from three.js); " +
            "    - lineBasicMaterial: line material for the object (from three.js)."; 
    }
    finally
    {
        if(geometry != undefined && lineBasicMaterial == undefined)
        {
            this.geometry = geometry;
            this.lineBasicMaterial = new THREE.LineBasicMaterial({ color: 0x8D9091, side: THREE.DoubleSide});
        }
        else if(geometry == undefined && lineBasicMaterial != undefined)
        {
            this.geometry = new THREE.Geometry();
            this.lineBasicMaterial = lineBasicMaterial;
        }
        else if(geometry != undefined && lineBasicMaterial != undefined)
        {
            this.geometry = geometry;
            this.lineBasicMaterial = lineBasicMaterial;
        }
        else
        {
            this.geometry = new THREE.Geometry();
            this.lineBasicMaterial = new THREE.LineBasicMaterial({ color: 0x8D9091, side: THREE.DoubleSide});
        }
        this.geometry.computeLineDistances();
    }
}

/**
 * Getter for geometry
 */
Edge.prototype.getGeometry = function()
{
    return this.geometry;
}

/**
 * Setter for geometry
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
 *    - source: the source node from which the edge starts (if directed);
 *    - target: the target node from which the edge starts (if directed).
 */
Edge.prototype.buildEdge = function(source, target)
{
    var sourcePos = source.getCircle().position;
    var targetPos = target.getCircle().position;
    this.geometry.vertices.push(
        new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z),
        new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z)
    );
    this.line = new THREE.Line(this.geometry, this.lineBasicMaterial);
    this.line.renderOrder = 0;
}
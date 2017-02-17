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
            this.lineBasicMaterial = new THREE.LineBasicMaterial();
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
 * Build the edge into the scene
 * param:
 *    - layout: the graph layout.
 */
Edge.prototype.buildEdge = function(layout)
{
    
}
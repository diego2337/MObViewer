/**
 * Base class for a edge in the graph.
 * Author: Diego S. Cintra
 */

/**
 * Constructor
 * params: 
 *    - geometry: a geometry of type circle (from three.js);
 *    - lineBasicMaterial: material for the geometry (from three.js).
 */
function Edge(geometry, lineBasicMaterial)
{
    this.geometry = geometry;
    this.lineBasicMaterial = lineBasicMaterial;
}

/**
 * Getter and setter for geometry
 */
Edge.prototype.getGeometry = function()
{
    return this.geometry;
}

Edge.prototype.setGeometry = function(geometry)
{
    this.geometry = geometry;
}

/**
 * Getter and setter for lineBasicMaterial
 */
Edge.prototype.getlineBasicMaterial = function()
{
    return this.lineBasicMaterial;
}

Edge.prototype.setlineBasicMaterial = function(lineBasicMaterial)
{
    this.lineBasicMaterial = lineBasicMaterial;
}
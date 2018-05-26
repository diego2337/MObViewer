/**
 * @desc Base class for vertex info. Responsible for fetching and storing vertex info from .json file.
 * @author Diego Cintra
 * 25 May 2018
 */

/**
 * @constructor
 */
var VertexInfo = function()
{
  /** Create an empty array of properties for first and second layer */
  this.propertiesFirstLayer = this.propertiesSecondLayer = [];
}

// /**
//  * Getter for properties.
//  * @public
//  * @returns {Array} Properties property from vertexInfo.
//  */
// vertexInfo.prototype.getProperties = function()
// {
//   return this.propertiesFirstLayer;
// }
//
// /**
//  * Setter for raycaster.
//  * @public
//  * @param {Array} props Array of properties.
//  */
// vertexInfo.prototype.setProperties = function(props)
// {
//   this.propertiesFirstLayer = props;
// }

/**
 * @desc Parse a string into JSON object, and store its keys in an array.
 * @param {String} props Properties.
 * @param {int} layer Used to identify from which layer "props" is being passed from - (0) from first layer, (1) from second layer.
 */
VertexInfo.prototype.storeProperties = function(props, layer)
{
  for(key in props)
  {
    layer == 0 ? this.propertiesFirstLayer.push(key) : this.propertiesSecondLayer.push(key);
  }
}

/**
 * @desc Concatenates arrays to display.

 */
VertexInfo.prototype.getProps = function()
{

}

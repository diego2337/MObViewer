/**
 * @desc Base class for vertex info. Responsible for fetching and storing vertex info from .json file.
 * @author Diego Cintra
 * 25 May 2018
 */

/**
 * @constructor
 */
var vertexInfo = function()
{
  /** Create an empty array of properties */
  this.properties = [];
}

/**
 * Getter for properties.
 * @public
 * @returns {Array} Properties property from vertexInfo.
 */
vertexInfo.prototype.getProperties = function()
{
  return this.properties;
}

/**
 * Setter for raycaster.
 * @public
 * @param {Array} props Array of properties.
 */
vertexInfo.prototype.setProperties = function(props)
{
  this.properties = props;
}

/**
 * @desc Parse a string into JSON object, and store its keys in an array.
 * @param {String} props Properties.
 */
vertexInfo.prototype.storeProperties = function(props)
{
  /** Transform into JSON object */
  var p = JSON.parse(props);
  for(key in p)
  {
    this.properties.push(key);
  }
}

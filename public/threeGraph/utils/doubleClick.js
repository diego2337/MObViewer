/**
 * @desc Base class for DoubleClick, handling user's double click on layout.
 * @author Diego Cintra
 * Date: 27 July 2018
 */

/**
 * @constructor
 * @param {Object} clicked State variable to check if layout has been clicked or not.
 */
var DoubleClick = function(clicked)
{
  this.clicked = ecmaStandard(clicked, {wasClicked: false});
}

/**
 * @desc Getter for clicked.
 * @returns {Object} clicked object.
 */
DoubleClick.prototype.getClicked = function()
{
  return this.clicked;
}

/**
 * @desc Setter for clicked.
 * @param {Object} clicked Object indicating double-click state in layout.
 */
DoubleClick.prototype.setClicked = function(clicked)
{
  this.clicked = clicked;
}

/**
 * @desc Update layout, removing edges and coloring vertexes to default color.
 * @param {Object} scene Scene for raycaster.
 * @param {Array} neighbors Array of neighbor vertexes.
 * @param {Array} edges Array of edges displayed in layout.
 */
DoubleClick.prototype.updateLayout = function(scene, neighbors, edges)
{
  /** Change vertexes colors to original color */
  for(var i = 0; i < neighbors.length; i++)
  {
    var mesh = scene.getObjectByName(neighbors[i].mesh);
    for(var j = 0; j < 32; j++)
    {
      if(mesh.geometry.faces[(neighbors[i].vertexInfo*32)+j] !== undefined)
      {
        mesh.geometry.faces[(neighbors[i].vertexInfo*32)+j].color.setRGB(0.0, 0.0, 0.0);
      }
      else if(mesh.geometry.faces[(neighbors[i].vertexInfo)+j] !== undefined)
      {
        mesh.geometry.faces[(neighbors[i].vertexInfo)+j].color.setRGB(0.0, 0.0, 0.0);
      }
      mesh.geometry.colorsNeedUpdate = true;
    }
  }
  /** Clearing array of neighbors */
  neighbors = [];
  /** Remove 'parentConnections' edges */
  for(var i = 0; i < edges; i++)
  {
    scene.remove(scene.getObjectByName("parentConnections" + i.toString()));
  }
  /** Remove 'neighborEdges' edges */
  scene.remove(scene.getObjectByName("neighborEdges"));
}

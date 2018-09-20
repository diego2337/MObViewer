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
 * @param {Object} eventHandler EventHandler type object containing neighbors and edges arrays.
 */
DoubleClick.prototype.updateLayout = function(scene, eventHandler)
{
  /** Change vertexes colors to original color */
  for(var i = 0; i < eventHandler.neighbors.length; i++)
  {
    var mesh = scene.getObjectByName(eventHandler.neighbors[i].mesh);
    for(var j = 0; j < 32; j++)
    {
      if(mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo*32)+j] !== undefined)
      {
        mesh.name == "MainMesh" ? mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo*32)+j].color.setRGB(0.0, 0.0, 0.0) : mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo*32)+j].color.setRGB(0.8, 0.8, 0.8);
      }
      if(mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo)+j] !== undefined)
      {
        mesh.name == "MainMesh" ? mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo)+j].color.setRGB(0.0, 0.0, 0.0) : mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo)+j].color.setRGB(0.8, 0.8, 0.8);
      }
      mesh.geometry.colorsNeedUpdate = true;
    }
  }
  /** Clearing array of neighbors */
  eventHandler.neighbors = [];
  eventHandler.realNeighbors = [];
  /** Remove 'parentConnections' edges */
  // for(var i = 0; i < edges; i++)
  for(var i = 0; i < eventHandler.nEdges; i++)
  {
    scene.remove(scene.getObjectByName("parentConnections" + i.toString()));
  }
  /** Remove 'neighborEdges' edges */
  scene.remove(scene.getObjectByName("neighborEdges"));
  /**
   * @param {Array} neighbors Array of neighbor vertexes.
   * @param {Array} edges Array of edges displayed in layout.
  */
}

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
 * @desc Check duplicates in array of neighbors.
 * @param {Array} neighbors Array of neighbors.
 * @returns {Array} Array with no duplicates.
 */
DoubleClick.prototype.checkDuplicates = function(neighbors)
{
  var arr = [];
  for(var i = 0; i < neighbors.length; i++)
  {
    for(var j = i+1; j < neighbors.length; j++)
    {
      if( (neighbors[i].vertexInfo == neighbors[j].vertexInfo/32) || (neighbors[i].vertexInfo == neighbors[j].vertexInfo*32) )
      {
        neighbors[j] = -1;
      }
    }
  }
  for(var i = 0; i < neighbors.length; i++)
  {
    if(neighbors[i] != -1)
    {
      arr.push(neighbors[i]);
    }
  }
  return arr;
}

/**
 * @desc Update layout, removing edges and coloring vertexes to default color.
 * @param {Object} scene Scene for raycaster.
 * @param {Object} eventHandler EventHandler type object containing neighbors and edges arrays.
 */
DoubleClick.prototype.updateLayout = function(scene, eventHandler)
{
  eventHandler.neighbors = this.checkDuplicates(eventHandler.neighbors);
  /** Change vertexes colors to original color */
  for(var i = 0; i < eventHandler.neighbors.length; i++)
  {
    var mesh = scene.getObjectByName(eventHandler.neighbors[i].mesh);
    for(var j = 0; j < 32; j++)
    {
      if(mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo*32)+j] !== undefined)
      {
        // mesh.name == "MainMesh" ? mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo*32)+j].color.setRGB(0.0, 0.0, 0.0) : mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo*32)+j].color.setRGB(0.8, 0.8, 0.8);
        mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo*32)+j].color.setRGB(mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo*32)+j].color.r-0.3, mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo*32)+j].color.g-0.3, mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo*32)+j].color.b-0.3);
      }
      if(mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo)+j] !== undefined)
      {
        // mesh.name == "MainMesh" ? mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo)+j].color.setRGB(0.0, 0.0, 0.0) : mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo)+j].color.setRGB(0.8, 0.8, 0.8);
        mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo)+j].color.setRGB(mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo)+j].color.r-0.3, mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo)+j].color.g-0.3, mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo)+j].color.b-0.3);
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
  /** Remove 'selected' vertices */
  scene.remove(scene.getObjectByName("selected"));
  var indexes = [];
  /** Remove 'neighboriindex', 'predecessori' or 'successori' vertices */
  for(var i = 0; i < scene.children.length; i++)
  {
    // if(scene.children[i].name.substring(0, scene.children[i].name.length-1) == 'neighbor' || scene.children[i].name.substring(0, scene.children[i].name.length-1) == 'predecessor' || scene.children[i].name.substring(0, scene.children[i].name.length-1) == 'successor')
    if(scene.children[i].name.includes('neighbor') || scene.children[i].name.includes('predecessor') || scene.children[i].name.includes('successor'))
    {
      indexes.push(i);
      // scene.remove(scene.children[i]);
    }
  }
  indexes.sort(function(a, b){
    return parseInt(b)-parseInt(a);
  });
  for(var i = 0; i < indexes.length; i++)
  {
    scene.remove(scene.children[indexes[i]]);
  }
  /**
   * @param {Array} neighbors Array of neighbor vertexes.
   * @param {Array} edges Array of edges displayed in layout.
  */
}

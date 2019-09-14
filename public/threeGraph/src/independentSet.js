/**
 * Base class for Independent Set, which consists of an independent set of nodes.
 * @author Diego Cintra
 * 30 april 2018
 */

/**
 * @constructor
 */
var IndependentSet = function()
{
  /** Array to store (x,y,z) coordinates of nodes */
  this.positions = [];
  /** Array to store sizes of nodes */
  this.circleSizes = [];
}

/**
 * Find node's neighbors.
 * @public
 * @param {Array} nodes Array of objects containing .json type nodes (id, weight...).
 * @param {Array} links Array of objects containing .json type edges (source, target, weight).
 * @param {int} i Index for node stored at 'graph' object.
 * @returns List of neighbors for given node.
 */
IndependentSet.prototype.findNeighbors = function(nodes, links, i)
{
  var neighbors = [];
  /** Add itself first */
  neighbors.push(parseInt(nodes[i].id));
  for(j = 0; j < links.length; j++)
  {
    if(parseInt(links[j].source) == parseInt(nodes[i].id))
    {
      neighbors.push(parseInt(links[j].target));
    }
    else if(parseInt(links[j].target) == parseInt(nodes[i].id))
    {
      neighbors.push(parseInt(links[j].source));
    }
  }
  return neighbors;
}

/**
 * @desc Calculate super-vertice size.
 * @param {float} minNodeWeight Minimum node weight for 'nodes' set.
 * @param {float} maxNodeWeight Maximum node weight for 'nodes' set.
 * @param {float} minNormalizingRange Minimum range to be used when normalizing vertexes.
 * @param {float} maxNormalizingRange Maximum range to be used when normalizing vertexes.
 * @param {int} weight Vertice weight.
 * @returns {int} Normalized super-vertice weight.
 */
IndependentSet.prototype.getVerticeWeight = function(minNodeWeight, maxNodeWeight, minNormalizingRange, maxNormalizingRange, weight)
{
  var normalizedWeight = (maxNormalizingRange - minNormalizingRange) * ( (parseInt(weight) - parseInt(minNodeWeight))/((parseInt(maxNodeWeight)-parseInt(minNodeWeight))+1) ) + minNormalizingRange;
  return normalizedWeight == 0 ? parseInt(minNodeWeight) : normalizedWeight;
  // if(normalizedWeight == 0) normalizedWeight = parseInt(minNodeWeight);
  // return normalizedWeight;
}

/**
 * @desc Creates a horizontal bipartite graph, having nodes as bar charts.
 * @param {Object} independentSetScope Scope for "IndependentSet" class.
 * @param {Object} geometry Single geometry which will contain all node geometries, merged.
 * @param {Array} nodes Array of objects containing .json type nodes (id, weight...).
 * @param {float} minNodeWeight Minimum node weight for 'nodes' set.
 * @param {float} maxNodeWeight Maximum node weight for 'nodes' set.
 * @param {int} pos x-axis starting coordinate for nodes.
 * @param {int} y y-axis coordinate for nodes.
 * @param {float} theta Theta value which defines spacing between nodes.
 * @param {float} maxNormalizingRange Maximum range to be used when normalizing vertexes.
 * @param {float} minNormalizingRange Minimum range to be used when normalizing vertexes.
 * @param {Object} data Return object from server-side containing node information.
 * @param {Array} colour Color to be used when rendering a node.
 */
IndependentSet.prototype.createHorizontalBarChart = function(independentSetScope, geometry, nodes, minNodeWeight, maxNodeWeight, pos, y, theta, maxNormalizingRange, minNormalizingRange, data, colour)
{
  for(var i = 0; i < nodes.length && nodes[i] !== undefined; i++, pos++)
  {
    /** Calculate bar size */
    if(nodes[i].weight == undefined) nodes[i].weight = parseInt(minNodeWeight);
    var planeSize = this.getVerticeWeight(minNodeWeight, maxNodeWeight, minNormalizingRange, maxNormalizingRange, nodes[i].weight);
    // var planeSize = 10000;
    /** Check if "data.colors" variable exist */
    if(data.colors[i] == undefined || data.repeats[i] == undefined)
    {
      /** Color vertexes */
      var planeGeometry = new THREE.PlaneGeometry(2, 2);
      for(var k = 0; k < planeGeometry.faces.length; k++)
      {
        planeGeometry.faces[k].color.setRGB(colour[0], colour[1], colour[2]);
      }
    }
    else
    {
      /** Calculate amount of different colors */
      var sum = 0;
      for(var sumI = 0; sumI < data.repeats[i].length; sumI = sumI + 1)
      {
        sum = sum + parseInt(data.repeats[i][sumI]);
      }
      /** Calculate sizes for each stack of stacked bar chart */
      var proportion = parseFloat(parseFloat(planeSize) / parseFloat(sum));
      var proportionLengths = [];
      for(var sumI = 0; sumI < data.repeats[i].length; sumI = sumI + 1)
      {
        proportionLengths.push(parseInt(parseFloat(data.repeats[i][sumI])*proportion));
      }
      var planeGeometry = new THREE.Geometry();
      var barChartGeometry = new THREE.PlaneGeometry(2, 2);
      /** Check how many colors there are in one "data.colors" index, to create as many planes */
      for(var j = 0; j < data.colors[i].length; j++)
      {
        for(var k = 0; k < barChartGeometry.faces.length; k++)
        {
          barChartGeometry.faces[k].color.setRGB(data.colors[i][j][0], data.colors[i][j][1], data.colors[i][j][2]);
        }
        /** Scale according to proportionLengths */
        barChartGeometry.scale(1, proportionLengths[j], 1);
        /** Translate stack to specific position in stacked bar chart */
        j-1 < 0 ? barChartGeometry.translate(0, 0, 0) : barChartGeometry.translate(0, proportionLengths, 0);
        /** Merge into planeGeometry */
        planeGeometry.merge(barChartGeometry);
        /** Return geometry for reusing */
        if(j-1 >= 0) barChartGeometry.translate(0, -proportionLengths, 0);
        barChartGeometry.scale(1, (1/proportionLengths[j]), 1);
      }
      // for(var k = 0, l = 0; k < planeGeometry.faces.length; k++)
      // {
      //   if(k > proportionLengths[l])
      //   {
      //     l = l + 1;
      //     proportionLengths[l] = proportionLengths[l] + proportionLengths[l-1];
      //   }
      //   data.colors[i][l] != null ? planeGeometry.faces[k].color.setRGB(data.colors[i][l][0], data.colors[i][l][1], data.colors[i][l][2]) : planeGeometry.faces[k].color.setRGB(colour[0], colour[1], colour[2]);
      // }
    }
    /** Calculate position */
    var x = pos * theta;
    /** Using feature scale for node sizes */
    planeGeometry.scale(planeSize, planeSize, 1);
    /** Push size to array */
    independentSetScope.circleSizes.push(planeSize);
    /** Give geometry name the same as its id */
    planeGeometry.name = nodes[i].id;
    /** Translate geometry for its coordinates */
    planeGeometry.translate(x, y, 0);
    /** Push coordinates to array */
    independentSetScope.positions.push({x: x, y: y, z: 0});
    /** Merge into geometry */
    geometry.merge(planeGeometry);
    /** Return geometry for reusing */
    planeGeometry.translate(-x, -y, 0);
    planeGeometry.arrayOfProperties = [];
    planeGeometry.name = "";
    planeGeometry.scale((1/planeSize), (1/planeSize), 1);
  }
  /** Properly dispose of object */
  if(barChartGeometry)
  {
    barChartGeometry.dispose();
    barChartGeometry = null;
  }
  planeGeometry.dispose();
  planeGeometry = null;
}

/**
 * @desc Creates a horizontal bipartite graph, having nodes as as circles.
 * @param {Object} independentSetScope Scope for "IndependentSet" class.
 * @param {Object} geometry Single geometry which will contain all node geometries, merged.
 * @param {Array} nodes Array of objects containing .json type nodes (id, weight...).
 * @param {float} minNodeWeight Minimum node weight for 'nodes' set.
 * @param {float} maxNodeWeight Maximum node weight for 'nodes' set.
 * @param {int} pos x-axis starting coordinate for nodes.
 * @param {int} y y-axis coordinate for nodes.
 * @param {float} theta Theta value which defines spacing between nodes.
 * @param {float} maxNormalizingRange Maximum range to be used when normalizing vertexes.
 * @param {float} minNormalizingRange Minimum range to be used when normalizing vertexes.
 * @param {Object} data Return object from server-side containing node information.
 * @param {Array} colour Color to be used when rendering a node.
 */
IndependentSet.prototype.createHorizontalNodeLinkGraph = function(independentSetScope, geometry, nodes, minNodeWeight, maxNodeWeight, pos, y, theta, maxNormalizingRange, minNormalizingRange, data, colour)
{
  var circleGeometry = new THREE.CircleGeometry(1, 32);
  for(var i = 0; i < nodes.length && nodes[i] !== undefined; i++, pos++)
  {
    /** Color vertexes */
    if(data.colors[i] === undefined || data.repeats[i] === undefined)
    {
      for(var k = 0; k < circleGeometry.faces.length; k++)
      {
        circleGeometry.faces[k].color.setRGB(colour[0], colour[1], colour[2]);
      }
    }
    else
    {
      /** Calculate proportion for each color space */
      var sum = 0;
      for(var sumI = 0; sumI < data.repeats[i].length; sumI = sumI + 1)
      {
        sum = sum + parseInt(data.repeats[i][sumI]);
      }
      var proportion = parseFloat(32.0 / parseFloat(sum));
      var proportionLengths = [];
      for(var sumI = 0; sumI < data.repeats[i].length; sumI = sumI + 1)
      {
        proportionLengths.push(parseInt(parseFloat(data.repeats[i][sumI])*proportion));
      }
      for(var k = 0, l = 0; k < circleGeometry.faces.length; k++)
      {
        if(k > proportionLengths[l])
        {
          l = l + 1;
          proportionLengths[l] = proportionLengths[l] + proportionLengths[l-1];
        }
        data.colors[i][l] != null ? circleGeometry.faces[k].color.setRGB(data.colors[i][l][0], data.colors[i][l][1], data.colors[i][l][2]) : circleGeometry.faces[k].color.setRGB(colour[0], colour[1], colour[2]);
      }
      // var length = data[i].length;
      // var colorLength = parseInt(circleGeometry.faces.length/length);
      // for(var k = 0, l = 0; k < circleGeometry.faces.length; k++)
      // {
      //   if(k > colorLength)
      //   {
      //     l = l + 1;
      //     colorLength = colorLength + colorLength;
      //   }
      //   data[i][l] != null ? circleGeometry.faces[k].color.setRGB(data[i][l][0], data[i][l][1], data[i][l][2]) : circleGeometry.faces[k].color.setRGB(colour[0], colour[1], colour[2]);
      // }
    }
    var x = pos * theta;
    if(nodes[i].weight == undefined) nodes[i].weight = parseInt(minNodeWeight);
    var circleSize = (maxNormalizingRange - minNormalizingRange) * ( (parseInt(nodes[i].weight) - parseInt(minNodeWeight))/((parseInt(maxNodeWeight)-parseInt(minNodeWeight))+1) ) + minNormalizingRange;
    if(circleSize == 0) circleSize = parseInt(minNodeWeight);
    /** Using feature scale for node sizes */
    circleGeometry.scale(circleSize, circleSize, 1);
    /** Give geometry name the same as its id */
    circleGeometry.name = nodes[i].id;
    // if(layout == 3)
    // {
    //   /** Translate geometry for its coordinates */
    //   circleGeometry.translate(y, x, 0);
    //   /** Push coordinates to array */
    //   independentSetScope.positions.push({x: y, y: x, z: 0});
    //   /** Push size to array */
    //   independentSetScope.circleSizes.push(circleSize);
    //   /** Merge into geometry */
    //   geometry.merge(circleGeometry);
    //   /** Return geometry for reusing */
    //   circleGeometry.translate(-y, -x, 0);
    // }
    // else
    // {
    //   /** Translate geometry for its coordinates */
    //   circleGeometry.translate(x, y, 0);
    //   /** Push coordinates to array */
    //   independentSetScope.positions.push({x: x, y: y, z: 0});
    //   /** Push size to array */
    //   independentSetScope.circleSizes.push(circleSize);
    //   /** Merge into geometry */
    //   geometry.merge(circleGeometry);
    //   /** Return geometry for reusing */
    //   circleGeometry.translate(-x, -y, 0);
    //   circleGeometry.arrayOfProperties = [];
    // }
    /** Translate geometry for its coordinates */
    circleGeometry.translate(x, y, 0);
    /** Push coordinates to array */
    independentSetScope.positions.push({x: x, y: y, z: 0});
    /** Push size to array */
    independentSetScope.circleSizes.push(circleSize);
    /** Merge into geometry */
    geometry.merge(circleGeometry);
    /** Return geometry for reusing */
    circleGeometry.translate(-x, -y, 0);
    circleGeometry.arrayOfProperties = [];
    circleGeometry.name = "";
    circleGeometry.scale((1/circleSize), (1/circleSize), 1);
  }
  /** Properly dispose of object */
  circleGeometry.dispose();
  circleGeometry = null;
}

/**
 * @desc Creates geometry and colors for node.
 * @param {Object} independentSetScope Scope for "IndependentSet" class.
 * @param {Object} geometry Single geometry which will contain all node geometries, merged.
 * @param {Array} nodes Array of objects containing .json type nodes (id, weight...).
 * @param {float} minNodeWeight Minimum node weight for 'nodes' set.
 * @param {float} maxNodeWeight Maximum node weight for 'nodes' set.
 * @param {int} pos x-axis starting coordinate for nodes.
 * @param {int} y y-axis coordinate for nodes.
 * @param {float} theta Theta value which defines spacing between nodes.
 * @param {int} layout Graph layout.
 * @param {float} maxNormalizingRange Maximum range to be used when normalizing vertexes.
 * @param {float} minNormalizingRange Minimum range to be used when normalizing vertexes.
 * @param {Object} data Return object from server-side containing node information.
 * @param {Array} colour Color to be used when rendering a node.
 */
IndependentSet.prototype.createNodes = function(independentSetScope, geometry, nodes, minNodeWeight, maxNodeWeight, pos, y, theta, layout, maxNormalizingRange, minNormalizingRange, data, colour)
{
  /** Check which layout is currently being used */
  switch(layout)
  {
    case 0:
      independentSetScope.createHorizontalBarChart(independentSetScope, geometry, nodes, minNodeWeight, maxNodeWeight, pos, y, theta, maxNormalizingRange, minNormalizingRange, data, colour);
      break;
    case 1:
      console.log("To be implemented");
      break;
    case 2:
      independentSetScope.createHorizontalNodeLinkGraph(independentSetScope, geometry, nodes, minNodeWeight, maxNodeWeight, pos, y, theta, maxNormalizingRange, minNormalizingRange, data, colour);
      break;
    case 3:
      console.log("To be implemented.");
      break;
    default:
      console.log("Undefined layout.");
      break;
  }
}

/**
 * @desc Builds an independent set, given a y-axis coordinate and a theta spacing between nodes.
 * @param {Object} renderLayers Object containing boolean for rendering both first and second layers.
 * @param {int} firstLayer Number of nodes in first layer.
 * @param {int} lastLayer Number of nodes in last layer.
 * @param {Object} geometry Single geometry which will contain all node geometries, merged.
 * @param {Array} nodes Array of objects containing .json type nodes (id, weight...).
 * @param {Array} links Array of objects containing .json type edges (source, target, weight).
 * @param {float} minNodeWeight Minimum node weight for 'nodes' set.
 * @param {float} maxNodeWeight Maximum node weight for 'nodes' set.
 * @param {int} pos x-axis starting coordinate for nodes.
 * @param {int} y y-axis coordinate for nodes.
 * @param {float} theta Theta value which defines spacing between nodes.
 * @param {int} layout Graph layout.
 * @param {float} maxNormalizingRange Maximum range to be used when normalizing vertexes.
 * @param {float} minNormalizingRange Minimum range to be used when normalizing vertexes.
 * @param {Array} colour Color to be used when rendering a node.
 */
IndependentSet.prototype.buildSet = function(renderLayers, firstLayer, lastLayer, geometry, nodes, links, minNodeWeight, maxNodeWeight, pos, y, theta, layout, maxNormalizingRange, minNormalizingRange, colour)
{
  try
  {
    var independentSetScope = this;
    /** Perform AJAX call to fetch colors server-side */
    var getColors = $.ajax({
      url: 'graph/getColors',
      type: 'POST',
      async: false,
      data: { nodes: nodes },
      xhr: loadGraph
    });
    getColors.done(function(data){
      data = JSON.parse(data);
      // data = data.colors;
      /** Store number of faces before adding nodes */
      var numberOfFaces = geometry.faces.length;
      /** Build nodes */
      /** Creating geometry for nodes - FIXME method "createNode" will contain all possible geometries and logic */
      independentSetScope.createNodes(independentSetScope, geometry, nodes, minNodeWeight, maxNodeWeight, pos, y, theta, layout, maxNormalizingRange, minNormalizingRange, data, colour);
      /** Populate vertices with additional .json information */
      for(var i = numberOfFaces, j = 0; i < geometry.faces.length && j < nodes.length; i = i + 32, j++)
      {
        geometry.faces[i].properties = JSON.stringify(nodes[j]);
        /** Find vertex neighbors - FIXME not an IndependentSet responsibility */
        geometry.faces[i].neighbors = independentSetScope.findNeighbors(nodes, links, j);
        /** Store vertex position */
        geometry.faces[i].position = independentSetScope.positions[j];
        /** Store circle size */
        geometry.faces[i].size = independentSetScope.circleSizes[j];
        /** Store vertex position */
        // geometry.faces[i].position = independentSetScope.positions[j];
        /** Store which layers are being rendered */
        geometry.faces[i].layers = JSON.stringify(renderLayers);
        /** Store number of vertexes for each layer */
        geometry.faces[i].firstLayer = firstLayer;
        geometry.faces[i].lastLayer = lastLayer;
      }
    });
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in function IndependentSet.buildSet. " + err;
  }
}

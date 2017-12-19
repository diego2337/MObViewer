/**
* Constructor
* params:
*    - graph: object containing JSON graph file, with:
*      - graphInfo: object containing information such as:
*              1) if the graph is directed;
*              2) which multilevel is;
*              3) the number of layers;
*              4) n integers, each containing the number of nodes in a layer.
*      - nodes: array of Node type;
*      - edges: array of Edge type;
*    - min: the minimal value for feature scaling, applied to nodes and edges. Default is 0
*    - max: the maximum value for feature scaling, applied to nodes and edges. Default is 10
*/
var Graph = function(graph, min, max)
{
   /* Pre ECMAScript2015 standardization */
   // layout = typeof layout !== 'undefined' ? layout : 2;
   // min = typeof min !== 'undefined' ? min : 0;
   // max = typeof max !== 'undefined' ? max : 10
   min = ecmaStandard(min);
   max = ecmaStandard(max);
   try
   {
       this.graphInfo = graph.graphInfo[0];
       if(this.graphInfo.vlayer != undefined)
       {
           this.firstLayer = this.graphInfo.vlayer.split(" ");
           this.firstLayer = this.firstLayer[0];
           this.lastLayer = this.graphInfo.vlayer.split(" ");
           this.lastLayer = this.lastLayer[this.lastLayer.length-1];
       }
       else
       {
           this.firstLayer = this.lastLayer =  Math.floor(graph.nodes.length / 2);
       }
       this.graphInfo.min = min;
       this.graphInfo.max = max;
       this.theta = 0;
       /* Graph keeps instances of geometries and materials for optimization */
       this.circleGeometry = new THREE.CircleGeometry(1, 32);
       this.meshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.FrontSide, depthFunc: THREE.AlwaysDepth });
       if(graph.nodes instanceof Array)
       {
           this.nodes = [];
           for(var i = 0; i < graph.nodes.length; i++)
           {
               this.nodes[i] = new Node(graph.nodes[i], min, max, this.circleGeometry, this.meshBasicMaterial);
           }
           // graph.nodes.forEach(function(d, i){
           //     this.nodes[i] = new Node(d);
           // });
       }
       /* Graph keeps instances of geometries and materials for optimization */
       this.geometry = new THREE.Geometry();
       if(graph.links instanceof Array)
       {
           this.edges = [];
           for(var i = 0; i < graph.links.length; i++)
           {
               this.edges[i] = new Edge(graph.links[i], 0, 100, this.lineBasicMaterial);
           }
           // graph.edges.forEach(function(d, i){
           //     this.edges[i] = new Edge(d);
           // })
       }
   }
   catch(err)
   {
       throw "Unexpected error ocurred at line " + err.lineNumber + ", in function Graph. " + err;
   }
}

/**
* Get element by id
* param:
*    - id: element id.
*/
Graph.prototype.getElementById = function(id)
{
   var identification = id.slice(0,1);
   if(identification == "e") // edge
   {
       return this.getEdgeById(id);
   }
   else // node
   {
       return this.getNodeById(id);
   }
}

/**
* Get nodes from graph
*/
Graph.prototype.getNodes = function()
{
   return this.nodes;
}

/**
* Get nodes meshes
*/
Graph.prototype.getNodesMeshes = function()
{
   var meshes = [];
   for(var i = 0; i < this.nodes.length; i++)
   {
       meshes.push(this.nodes[i].getCircle());
   }
   return meshes;
}

/**
* Get specific node from graph by id
* param:
*    - id: node id.
*/
Graph.prototype.getNodeById = function(id)
{
   return this.getNodeByIndex(this.findNode(id));
}

/**
* Find node by id
* param:
*    - id: node id.
*/
Graph.prototype.findNode = function(id)
{
   for(var i = 0; i < this.nodes.length; i++)
   {
       if(this.nodes[i].nodeObject.id == id)
       {
           return i;
       }
   }
   return -1;
}

/**
* Get specific node from graph by index
* param:
*    - i: index from array of nodes in "Graph" class.
*/
Graph.prototype.getNodeByIndex = function(i)
{
   return i != -1 ? this.nodes[i] : "Node not found.";
}

/**
* Get number of nodes from graph
*/
Graph.prototype.getNumberOfNodes = function()
{
   return this.nodes.length;
}

/**
* Set node by id
* param:
*    - id: node id;
*    - node: object to be assigned.
*/
Graph.prototype.setNodeById = function(id, node)
{
   var index = this.findNode(id);
   this.nodes[index].setNode(node);
}

/**
  * Get leftmost (or downmost) node of graph
  * returns:
  *    - world coordinate of leftmost (or downmost) element of graph.
  */
Graph.prototype.getMinNode = function()
{
  return this.minNode;
}

/**
  * Set leftmost (or downmost) node of graph
  * param:
  *    - minNode: world coordinate of leftmost (or downmost) element of graph.
  */
Graph.prototype.setMinNode = function(minNode)
{
  this.minNode = minNode;
}

/**
  * Get rightmost (or upmost) node of graph
  * returns:
  *    - world coordinate of rightmost (or upmost) element of graph.
  */
Graph.prototype.getMaxNode = function()
{
  return this.maxNode;
}

/**
  * Set rightmost (or upmost) node of graph
  * param:
  *    - maxNode: world coordinate of rightmost (or upmost) element of graph.
  */
Graph.prototype.setMaxNode = function(maxNode)
{
  this.maxNode = maxNode;
}

/**
* Get edges from graph
*/
Graph.prototype.getEdges = function()
{
   return this.edges;
}

/**
* Get edges meshes
*/
Graph.prototype.getEdgesMeshes = function()
{
   var meshes = [];
   for(var i = 0; i < this.edges.length; i++)
   {
       meshes.push(this.edges[i].getLine());
   }
   return meshes;
}

/**
* Get specific edge from graph by id
* params:
*    - id: edge id.
*/
Graph.prototype.getEdgeById = function(id)
{
   return this.getEdgeByIndex(this.findEdge(id));
}

/**
* Find edge by id
* param:
*    - id: edge id.
*/
Graph.prototype.findEdge = function(id)
{
   for(var i = 0; i < this.edges.length; i++)
   {
       if(this.edges[i].edgeObject.id == id)
       {
           return i;
       }
   }
   return -1;
}

/**
* Get specific edge from graph by index
* param:
*    - i: index from array of edges in "Graph" class.
*/
Graph.prototype.getEdgeByIndex = function(i)
{
   return i != -1 ? this.edges[i] : "Edge not found.";
}

/**
* Get specific edge from graph by index
* param:
*    - i: index from array of edges in "Graph" class.
*/
Graph.prototype.getEdgeByIndex = function(i)
{
   return this.edges[i];
}

/**
* Get number of edges from graph
*/
Graph.prototype.getNumberOfEdges = function()
{
   return this.edges.length;
}

/**
* Set edge by id
* param:
*    - id: edge id;
*    - edge: object to be assigned.
*/
Graph.prototype.setEdgeById = function(id, edge)
{
   var index = this.findEdge(id);
   this.edges[index].setEdge(edge);
}

/**
* Highlight edges from highlighted graph
* param:
*    - highlightedElements: a list of names, containing highlighted elements at a specific mouse position.
*/
Graph.prototype.highlightEdges = function(highlightedElements)
{
  for(var i = 0; i < highlightedElements.length; i++)
  {
      if(highlightedElements[i] instanceof Node)
      {

      }
      else if(highlightedElements[i] instanceof Edge)
      {
        
      }
  }
}

/**
* Builds the graph in the scene. All the node and edge calculations are performed, and the elements added
* params:
*    - scene: the scene in which the graph will be built;
*    - layout: graph layout. Default is 2 = radial.
*/
Graph.prototype.buildGraph = function(scene, layout)
{
   layout = ecmaStandard(layout, 3);
   scene = ecmaStandard(scene, undefined);
   try
   {
       var scale, theta;
       /* From D3, use a scaling function for placement */
       scale = d3.scaleLinear().domain([0, (this.getNumberOfNodes())]).range([0, 2 * Math.PI]);

       /* Set which type of bipartite graph to be built */
       if(layout == 2) this.theta = scale(i);
       /* TODO - fix theta size; Must be according to size of nodes */
       else if(layout == 3)
       {
         this.theta = 3;
       }

       /* Build nodes' meshes */
       //  var j = this.lastLayer;
       var j = 0;
      //  var singleGeometry = new THREE.Geometry();
       for(var i = 0; i < this.nodes.length; i++)
       {
           if(i == this.firstLayer)
           {
             this.theta = ((this.firstLayer / this.lastLayer)  * this.theta);
             j = parseInt(j) + parseInt(1);
           }
           else if(i > this.firstLayer)
           {
             j = parseInt(j) + parseInt(1);
           }
           if(i == 0) this.setMinNode(parseInt(i*this.theta));
           if(i == this.nodes.length - 1) this.setMaxNode(parseInt(i*this.theta));
           this.nodes[i].buildNode(i, this.firstLayer, j, 20, this.theta, layout);
          //  this.nodes[i].getCircle().updateMatrix();
          //  singleGeometry.merge(this.nodes[i].getCircle().geometry, this.nodes[i].getCircle().matrix);
           if(scene !== undefined) scene.add(this.nodes[i].getCircle());
       }
      //  if(scene !== undefined)
      //  {
      //      var material = new THREE.MeshPhongMaterial({color: 0xFF0000});
      //      var mesh = new THREE.Mesh(singleGeometry, material);
      //      scene.add(mesh);
      //  }

      //  /* Build edges' meshes and add to scene */
      // var singleGeometry2 = new THREE.Geometry();
      for(var i = 0; i < this.edges.length; i++)
      {
         this.edges[i].buildEdge(this.geometry, this.getNodeById(this.edges[i].edgeObject.source), this.getNodeById(this.edges[i].edgeObject.target)); //this.graphInfo.min, this.graphInfo.max
         // var helper = new THREE.FaceNormalsHelper(this.edges[i].getLine());
         // scene.add(helper);
         // this.edges[i].getLine().updateMatrix();
         // singleGeometry2.merge(this.edges[i].getLine().geometry, this.edges[i].getLine().matrix);
        // if(scene !== undefined) scene.add(this.edges[i].getLine());
      }
      if(scene !== undefined)
      {
        // var lineSegment = new THREE.LineSegments(this.geometry, this.lineBasicMaterial, THREE.LinePieces);
        // scene.add(lineSegment);
        var line = new MeshLine();
        // line.setGeometry(this.geometry);
        line.setGeometry(this.geometry, function(p){
          return 0.3;
        });
        var material = new MeshLineMaterial({color: new THREE.Color(0x8D9091)});
        var lineMesh = new THREE.Mesh(line.geometry, material);
        scene.add(lineMesh);
      }
      //  if(scene !== undefined)
      //  {
      //      var material = new THREE.MeshPhongMaterial({color: 0xFF0000});
      //      var mesh = new THREE.Mesh(singleGeometry2, material);
      //      scene.add(mesh);
      //  }
   }
   catch(err)
   {
       throw "Unexpected error ocurred at line " + err.line + ". " + err;
   }
}

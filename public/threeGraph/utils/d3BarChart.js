/**
 * Base class for d3's bar chart, to visualize vertex stats. Based on https://bl.ocks.org/mbostock/3885304#index.html
 * @author Diego Cintra
 * Date: 31 july 2018
 */

 /**
  * @constructor
  * @param {String} HTMLelement HTML element to build d3BarChart div in.
  */
var d3BarChart = function(HTMLelement)
{
  try
  {
    /** Store parent element to create bar chart */
    this.parentElement = HTMLelement;
    this.barChart = this.margin = this.width = this.height = this.x = this.y = this.g = undefined;
    this.setCreate(false);
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in barChart constructor. " + err;
  }
}

/**
 * @desc Getter for margin.
 * @returns {Object} Margin properties.
 */
d3BarChart.prototype.getMargin = function()
{
  return this.margin;
}

/**
 * @desc Setter for margin.
 * @param {Object} margin Margin properties.
 */
d3BarChart.prototype.setMargin = function(margin)
{
  this.margin = margin;
}

/**
 * @desc Getter for width.
 * @returns {Object} width.
 */
d3BarChart.prototype.getWidth = function()
{
  return this.width;
}

/**
 * @desc Setter for width.
 * @param {Object} width width.
 */
d3BarChart.prototype.setWidth = function(width)
{
  this.width = width;
}

/**
 * @desc Getter for height.
 * @returns {Object} height.
 */
d3BarChart.prototype.getHeight = function()
{
  return this.height;
}

/**
 * @desc Setter for height.
 * @param {Object} height height.
 */
d3BarChart.prototype.setHeight = function(height)
{
  this.height = height;
}

/**
 * @desc Getter for x.
 * @returns {Object} x.
 */
d3BarChart.prototype.getX = function()
{
  return this.x;
}

/**
 * @desc Setter for x.
 * @param {Object} x x.
 */
d3BarChart.prototype.setX = function(x)
{
  this.x = x;
}

/**
 * @desc Getter for y.
 * @returns {Object} y.
 */
d3BarChart.prototype.getY = function()
{
  return this.y;
}

/**
 * @desc Setter for y.
 * @param {Object} y y.
 */
d3BarChart.prototype.setY = function(y)
{
  this.y = y;
}

/**
 * @desc Getter for g (group).
 * @returns {Object} g group structure.
 */
d3BarChart.prototype.getG = function()
{
  return this.g;
}

/**
 * @desc Setter for g (group).
 * @param {Object} g g group structure.
 */
d3BarChart.prototype.setG = function(g)
{
  this.g = g;
}

/**
 * @desc Getter for created.
 * @returns {Boolean} True if bar chart was created; false otherwise.
 */
d3BarChart.prototype.getCreate = function()
{
  return this.created;
}

/**
 * @desc Setter for created.
 * @param {Boolean} True if bar chart was created; false otherwise.
 */
d3BarChart.prototype.setCreate = function(created)
{
  this.created = created;
}

/**
 * @desc Define sizes.
 * @param {Number} width Width size.
 * @param {Number} height Height size.
 */
d3BarChart.prototype.defineSizes = function(width, height)
{
  this.setWidth(width);
  this.setHeight(height);
}

/**
 * @desc Define axes.
 * @param {int} x X axis.
 * @param {int} y Y axis.
 */
d3BarChart.prototype.defineAxes = function(x, y)
{
  this.setX(x);
  this.setY(y);
}

/**
 * @desc Define bar chart position.
 * @param {string} position String-like parameter to be used in "transform" attribute, e.g. "translate(...)", "rotate(...)".
 */
d3BarChart.prototype.definePosition = function(position)
{
  try
  {
    if(this.getG() == undefined)
    {
      this.setG(this.barChart.append("g"));
    }
    this.getG()
      .attr("transform", position);
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in function definePosition. " + err;
  }
}

/**
 * @desc Creates a d3 bar chart on HTML page, to check for vertex info.
 * @public
 * @param {String} HTMLelement HTML element to build d3BarChart div in; if specified, replaces "this.parentElement" value.
 */
d3BarChart.prototype.created3BarChart = function(HTMLelement)
{
  /** FIXME - receive width and height from parameters */
  var height = 300;
  var width = 600;
  this.parentElement = ecmaStandard(HTMLelement, this.parentElement);
  /** Create bar chart */
  this.barChart = d3.select("#" + this.parentElement)
    .append("svg")
    .attr("id", "vStats")
    .attr("width", width)
    .attr("height", height)
    .style("z-index", "100");
  /** Define dimensions if none was defined */
  if(this.getMargin() == undefined)
  {
    this.setMargin({top: 20, right: 20, bottom: 150, left: 50});
    /** Define sizes */
    this.defineSizes(+width - this.getMargin().left - this.getMargin().right, +height - this.getMargin().top - this.getMargin().bottom);
    /** Define axes */
    this.defineAxes(d3.scaleBand().rangeRound([0, this.getWidth()]).padding(0.1), d3.scaleLinear().rangeRound([this.getHeight(), 0]));
    /** Define default position */
    this.definePosition("translate(" + this.getMargin().left + "," + this.getMargin().top + ")");
  }
  /** Create barChart initially hidden */
  this.hideBarChart();
}

/**
 * @desc Populates bar chart and set its opacity to 1.
 * @public
 * @param {String} data String-like data to populate bar chart.
 */
d3BarChart.prototype.populateAndShowBarChart = function(data)
{
  this.populateBarChart(data);
  if(data.length != 0) this.showBarChart();
}

/**
 * FIXME - Not d3BarChart responsibility
 * @desc Return bar chart data properties, to be used as labels for x axis.
 * @param {Array} data String-like or Array data to populate bar chart.
 * @returns {Array} Sorted array of properties.
 */
d3BarChart.prototype.getProperties = function(data)
{
  var dict = {};
  for(element in data)
  {
    if(!(data[element].property in dict))
    {
      dict[data[element].property] = 1;
    }
  }
  return Object.keys(dict).sort();
}

/**
 * @desc Populates bar chart with information provided by data, setting domains and ticks for axes.
 * @public
 * @param {(String|Array)} data String-like or Array data to populate bar chart.
 */
d3BarChart.prototype.populateBarChart = function(data)
{
  try
  {
    this.getX().domain(data.map(function(d) { return d.categories; }));
    this.getY().domain([0, d3.max(data, function(d) { return d.percentage; })]);

    this.getG().append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + this.getHeight() + ")")
        .call(d3.axisBottom(this.getX()))
        .selectAll("text")
        .attr("transform", "rotate(90)")
        // .attr("x", 22)
        .attr("x", 60)
        .attr("y", -6);

    /** Add label for x-axis */
    this.barChart.append("text")
    	  .attr("transform", "translate(" + (this.getWidth()/2) + " ," + (this.getHeight()+150) + ")")
    	  .style("text-anchor", "middle")
    	  .text(this.getProperties(data));

    this.getG().append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(this.getY()).ticks(10).tickFormat(function(d){ return d + "%"; }))
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -20)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("Frequency");

  	// // text label for the x axis
  	// this.barChart().append("text")
  	//   .attr("transform",
  	//         "translate(" + (this.getWidth()/2) + " ," +
  	//                        (this.getHeight() + this.getMargin().top + 40) + ")")
  	//   .style("text-anchor", "middle")
  	//   .text("Date");
    //
  	// // text label for the y axis
  	// this.barChart().append("text")
  	//   .attr("transform", "rotate(-90)")
  	//   .attr("y", 0 - this.getMargin().left)
  	//   .attr("x", 0 - (this.getHeight() / 2))
  	//   .attr("dy", "1em")
  	//   .style("text-anchor", "middle")
  	//   .text("Value");

    /** Create bar chart */
    this.createBarChart(data);
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in function populateBarChart. " + err;
  }
}

/**
 * @desc Creates a bar chart, with given data.
 * @public
 * @param {(String|Array)} data String-like or Array data to populate bar chart.
 */
d3BarChart.prototype.createBarChart = function(data)
{
  var d3Scope = this;
  this.getG().selectAll(".bar")
    .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return d3Scope.getX()(d.categories); })
      .attr("y", function(d) { return d3Scope.getY()(d.percentage); })
      .attr("width", this.getX().bandwidth())
      .attr("height", function(d) { return d3Scope.getHeight() - d3Scope.getY()(d.percentage); });
  this.setCreate(true);
}

/**
 * @desc Shows bar chart by setting opacity to 1.
 * @public
 */
d3BarChart.prototype.showBarChart = function()
{
  this.barChart.style("opacity", 1);
}

/**
 * @desc Hides bar chart by setting opacity to 0.
 * @public
 */
d3BarChart.prototype.hideBarChart = function()
{
  this.barChart.style("opacity", 0);
}

/**
 * @desc Clear bar chart content.
 * @public
 */
d3BarChart.prototype.clearBarChart = function()
{
  // this.barChart.html();
  d3.select("#vStats").remove();
  this.barChart = this.margin = this.width = this.height = this.x = this.y = this.g = undefined;
  this.setCreate(false);
}

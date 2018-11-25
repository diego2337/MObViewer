/**
 * Base class for gradient legend, to check edge weights. Based on https://bl.ocks.org/duspviz-mit/9b6dce37101c30ab80d0bf378fe5e583
 * @author Diego S. Cintra
 * Date: 30 april 2018
 */

/**
 * @constructor
 * @param {Function} linearScale Linear scale function from d3 to map from the minimum edge weight to maximum edge weight.
 * @param {float} minDomainValue Minimum domain value.
 * @param {float} maxDomainValue Maximum domain value.
 * @param {int} width Width of gradient legend, in pixel units.
 * @param {int} height Height of gradient legend, in pixel units.
 * @param {int} ticks Number of ticks to be displayed for the y-axis.
 */
var GradientLegend = function(linearScale, minDomainValue, maxDomainValue, width, height, ticks)
{
  try
  {
    // this.graphInfo = graphInfo;
    this.spanElementId = "spanElementId";
    this.width = ecmaStandard(width, 300);
    this.height = ecmaStandard(height, 50);
    this.minDomainValue = ecmaStandard(minDomainValue, 1.0);
    this.maxDomainValue = ecmaStandard(maxDomainValue, 5.0);
    /** Default linearScale value, with assigned minimum and maximum values and color ranging from light blue to dark blue */
    var defaultLinearScale = d3.scaleLinear().domain([this.minDomainValue, this.maxDomainValue]).range(['rgb(220, 255, 255)', 'rgb(0, 0, 255)']);
    this.linearScale = ecmaStandard(linearScale, defaultLinearScale);
    this.ticks = ecmaStandard(ticks, 5);
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in GradientLegend constructor. " + err;
  }
}

/**
 * @desc Destructor equivalent function to clear page of svg elements, so that they can be deleted with 'delete' keyword.
 * @public
 */
GradientLegend.prototype.clear = function()
{
  try
  {
    d3.select("#" + this.spanElementId).remove();
    d3.select("svg").remove();
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in GradientLegend.clear. " + err;
  }
}

/**
 * @desc Creates a gradient legend on HTML page, defining type of legend and start and end values. Creates the rectangle for legend and appends it to HTML page.
 * @public
 * @param {string} elementId Id of element in which legend will be appended.
 * @param {string} gradientTitle Title for gradient.
 */
GradientLegend.prototype.createGradientLegend = function(elementId, gradientTitle)
{
  try
  {
    /** Set gradient title */
    var span = d3.select("#" + elementId)
      .append("span")
      .attr("id", this.spanElementId)
      .style("padding-right", "20px")
      .style("margin", "25px");
    span._groups[0][0].innerHTML = gradientTitle;
    /** Create SVG element */
    var key = d3.select("#" + elementId)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .style("margin", "25px");
    var legend = key.append("defs")
        .append("svg:linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "100%")
        .attr("y2", "100%")
        .attr("spreadMethod", "pad");
    /** Defining range of gradient from 'light blue' (rgb(220, 255, 255)) to 'dark blue' (rgb(0, 0, 255)) */
    legend.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#dcffff")
      .attr("stop-opacity", 1);
    legend.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#0000ff")
      .attr("stop-opacity", 1);
    /** Creating rectangle */
    key.append("rect")
      .attr("width", this.width-5)
      .attr("height", this.height - 30)
      .style("fill", "url(#gradient)")
      .attr("transform", "translate(0,10)");
    /** Scale original edge weights to normalized edge weights */
    var y = d3.scaleLinear()
      // .range([this.graphInfo.maxDomainValue, this.graphInfo.minDomainValue])
      .range([this.width-6, 0])
      .domain([this.maxDomainValue, this.minDomainValue]);
      // .domain([this.graphInfo.maxDomainValue, this.graphInfo.minDomainValue]);
    /** Define scale ticks */
    var yAxis = d3.axisBottom()
      .scale(y)
      .ticks(this.ticks);
    /** Create and append legend to svg */
    key.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(0,30)")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("axis title");
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in function GradientLegend.createGradientLegend. " + err;
  }
}

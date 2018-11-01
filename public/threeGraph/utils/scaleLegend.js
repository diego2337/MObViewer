/**
 * Base class for legends, to identify community colors. Uses d3.legend component from https://d3-legend.susielu.com/
 * @author Diego S. Cintra
 * Date: 01 november 2018
 */

/**
 * @constructor
 * @param {Array} domain Domain of names to be used in legend.
 * @param {Array} range Range of values for each name.
 * @param {int} width Width of gradient legend, in pixel units.
 * @param {int} height Height of gradient legend, in pixel units.
 */
var ScaleLegend = function(domain, range, width, height)
{
  try
  {
    this.legendElementId = "legendElementId";
    this.width = ecmaStandard(width, 350);
    this.height = ecmaStandard(height, 50);
    this.domain = domain;
    this.range = range;
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in ScaleLegend constructor. " + err;
  }
}

/**
 * @desc Destructor equivalent function to clear page of svg elements, so that they can be deleted with 'delete' keyword.
 * @public
 */
ScaleLegend.prototype.clear = function()
{
  try
  {
    d3.select("#" + this.legendElementId).remove();
    d3.select("svg").remove();
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in ScaleLegend.clear. " + err;
  }
}

/**
 * @desc Convert array values to RGB.
 * @param {Array} values Values to be converted to RGB notation.
 * @returns {Array} Array of arrays containing following format: ['rgb(0, 0, 0)', 'rgb(255, 255, 255)'...].
 */
ScaleLegend.prototype.toRGB = function(values)
{
  var arr = [];
  values.forEach(function(d, i){
    var rgb = "rgb(";
    d.forEach(function(e, j){
      j != 2 ? rgb = rgb + (e*255).toString() + ',' : rgb = rgb + (e*255).toString();
    });
    rgb = rgb + ')';
    arr.push(rgb);
  });
  return arr;
}

/**
 * @desc Creates a scale legend on HTML page, defining elements contained in it. Appends to HTML page.
 * @param {string} elementId Id of element in which legend will be appended.
 * @param {string} legendTitle Title for Legend.
 */
ScaleLegend.prototype.createScaleLegend = function(elementId, legendTitle)
{
  try
  {
    /** Set scale title */
    var span = d3.select("#" + elementId)
      .append("span")
      .attr("id", this.legendElementId)
      .style("padding-right", "20px");
    span._groups[0][0].innerHTML = legendTitle;
    /** Create SVG element */
    var svg = d3.select("#" + elementId)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);

    /** Set domain adjusted to range */
    var ordinal = d3.scaleOrdinal()
      .domain(this.domain)
      .range(this.toRGB(this.range));

    svg.append("g")
      .attr("class", "legendOrdinal")
      .attr("transform", "translate(10,20)");

    var paddingValue = 0;
    this.domain.forEach(function(d, i){
      if(d.length > paddingValue)
      {
        paddingValue = d.length;
      }
    });

    var legendOrdinal = d3.legendColor()
      .shape("path", d3.symbol().type(d3.symbolCircle).size(150)())
      .shapePadding(paddingValue*4)
      .orient("horizontal")
      .scale(ordinal);

    svg.select(".legendOrdinal")
      .call(legendOrdinal);

  }
  catch(err)
  {
     throw "Unexpected error ocurred at line " + err.lineNumber + ", in ScaleLegend.createScaleLegend. " + err;
  }
}

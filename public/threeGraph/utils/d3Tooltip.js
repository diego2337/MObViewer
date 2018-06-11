/**
 * Base class for d3's tooltip, to visualize vertex info inside a node. Based on https://evortigosa.github.io/pollution/
 * @author Diego Cintra
 * Date: 22 may 2018
 */

/**
 * @constructor
 * @param {String} HTMLelement HTML element to build d3Tooltip div in.
 */
var d3Tooltip = function(HTMLelement)
{
  try
  {
    /** Store parent element to create tooltip */
    this.parentElement = HTMLelement;
    this.tooltip = undefined;
    /** Offsets from mouse so that tooltip won't show on top of mouse */
    this.xOffset = 70;
    this.yOffset = 28;
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in d3Tooltip constructor. " + err;
  }
}

/**
 * @desc Creates a d3 tooltip on HTML page, to check for vertex info.
 * @public
 * @param {String} HTMLelement HTML element to build d3Tooltip div in; if specified, replaces "this.parentElement" value.
 */
d3Tooltip.prototype.created3Tooltip = function(HTMLelement)
{
  this.parentElement = ecmaStandard(HTMLelement, this.parentElement);
  /** Create tooltip */
  this.tooltip = d3.select(this.parentElement)
    .append("div")
    .attr("class", "tooltip")
    .style("z-index", "100");
  /** Create tooltip initially hidden */
  this.hideTooltip();
}

/**
 * @desc Populates tooltip and set its opacity to 1.
 * @public
 * @param {String} data String-like data to populate tooltip.
 */
d3Tooltip.prototype.populateAndShowTooltip = function(data)
{
  this.populateTooltip(data);
  if(data.length != 0) this.showTooltip();
}

/**
 * @desc Use input data to generate HTML table format, using classes from material design lite.
 * @param {(String|Array)} data String-like or Array data to populate tooltip.
 * @returns {String} HTML table.
 */
d3Tooltip.prototype.generateHTMLTable = function(data)
{
  var table = "<table class=\"mdl-cell mdl-cell--12-col mdl-data-table mdl-js-data-table mdl-shadow--2dp\"><thead><tr>";
  for(var i = 0; i < data.length; i++)
  {
    for(key in data[i].rows)
    {
      table = table + "<th class=\"mdl-data-table__cell--non-numeric\">" + key + "</th>";
    }
    table = table + "</tr></thead>";
    // for(key in data[i].rows)
    // {
    //
    // }
  }
  return table;
}

/**
 * @desc Populates tooltip with information provided by data.
 * @public
 * @param {(String|Array)} data String-like or Array data to populate tooltip.
 */
d3Tooltip.prototype.populateTooltip = function(data)
{
  try
  {
    this.tooltip.html(JSON.stringify(data, undefined, 5));
    // this.tooltip.html(this.generateHTMLTable(data));
    // for(var i = 0; i < data.rows.length; i++)
    // {
    //   for(key in data.rows[i])
    //   {
    //     console.log(key);
    //     console.log(data.rows[i][key]);
    //   }
    // }
    // this.tooltip.html(data);
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in function populateTooltip. " + err;
  }
}

/**
 * @desc Hides tooltip by setting opacity to 0.
 * @public
 */
d3Tooltip.prototype.hideTooltip = function()
{
  this.tooltip.style("opacity", 0);
}

/**
 * @desc Shows tooltip by setting opacity to 1.
 * @public
 */
d3Tooltip.prototype.showTooltip = function()
{
  this.tooltip.style("opacity", 1);
}

/**
 * @desc Clear tooltip content.
 * @public
 */
d3Tooltip.prototype.clearTooltip = function()
{
  this.tooltip.html();
}

/**
 * @desc Set tooltip position according to x and y values.
 * @param {int} x X offset to place tooltip.
 * @param {int} y Y offset to place tooltip.
 */
d3Tooltip.prototype.setPosition = function(x, y)
{
  this.tooltip.style("left", (x - this.xOffset) + "px").style("top", (y - this.yOffset) + "px");
}

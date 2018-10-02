/**
 * Base class for statsHandler, implementing basic statistical processing and visualization.
 * @author Diego Cintra
 * Date: 31 July 2018
 */

/**
 * @constructor
 * @param {String} SVGId Id to store <svg> id value.
 */
var statsHandler = function(SVGId)
{
  this.d3BarChart = new d3BarChart(SVGId);
}

/**
 * @desc Generate vertex stats. Sends information server-side to generate statistics.
 * @param {JSON} vertexProps Vertex properties, to generate statistics.
 */
statsHandler.prototype.generateStats = function(vertexProps)
{
  $.ajax({
    url: '/graph/generateStats',
    type: 'POST',
    /** FIXME - <bold>NEVER use async!</bold> */
    async: false,
    data: { props: vertexProps },
    xhr: loadGraph
  });
}

/**
 * @desc Visualize vertex stats as bar charts. Invokes "barChart" class to render chart.
 * @param {int} id Vertex id.
 */
statsHandler.prototype.visualizeStats = function(id)
{
  this.d3BarChart.created3BarChart();
  var statsHandlerScope = this;
  $.ajax({
    url: '/graph/getStats',
    type: 'POST',
    data: { vertexId: id },
    success: function(html){
      html = JSON.parse(html).arr;
      if(html != undefined || html != "" || (html.length !== undefined && html.length > 0))
      {
          statsHandlerScope.d3BarChart.populateAndShowBarChart(html);
          $("#vertexStatsCard").css('visibility', 'visible');
      }
    },
    xhr: loadGraph
  });
}

 /**
  * @desc Generate and visualize vertex stats.
  * @param {JSON} vertexProps Vertex properties, to generate statistics.
  */
statsHandler.prototype.generateAndVisualizeStats = function(vertexProps)
{
  if(this.d3BarChart != undefined)
  {
    this.d3BarChart.clearBarChart();
  }
  /** Generate statistics */
  this.generateStats(vertexProps);
  /** Visualize statistics */
  this.visualizeStats(vertexProps.id);
}

/**
 * Base class for d3's word cloud, serving as bridge between client and server side operations, mostly to fetch words server side.
 * @author Diego Cintra
 * Date: 08 November 2018
 */

class d3WordCloudWrapper
{
  /**
   * @constructor
   */
  constructor()
  {
    /** Default constructor, nothing to be done here */
  }

  /**
   * @desc Make an AJAX call to fetch words server-side.
   * @param {Object} clickedNode Clicked node.
   * @param {Object} d3WordCloud d3WordCloud object to call callback response.
   * @returns {Array} Array of words, respecting https://github.com/jasondavies/d3-cloud syntax.
   */
  fetchWords(clickedNode, d3WordCloud)
  {
    // let words;
    $.ajax({
      url: '/graph/fetchWords',
      type: 'POST',
      async: true,
      data: { node: clickedNode },
      success: function(data){
        // words = JSON.parse(data).frequencies;
        d3WordCloud.created3WordCloud(JSON.parse(data).frequencies, 500, 400);
      }
    });
    // return words;
  }
}

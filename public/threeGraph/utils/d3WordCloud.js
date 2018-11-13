/**
 * Base class for d3's word cloud, to visualize vertex values as word clouds. Using word cloud code from https://github.com/jasondavies/d3-cloud, and based on https://bl.ocks.org/jyucsiro/767539a876836e920e38bc80d2031ba7
 * @author Diego Cintra
 * Date: 08 November 2018
 */

class d3WordCloud extends d3Position
{
  /**
   * @constructor
   * @param {String} HTMLelement HTML element to build d3WordCloud div in.
   * @param {Number} width Width of element.
   * @param {Number} height Height of element.
   * @param {Number} margin Margin of element.
   * @param {Array} words Array of word objects, containing attributes such as "font", "width", "height" and "value".
   */
   constructor(HTMLelement, width, height, margin, words = undefined)
   {
     super(HTMLelement, width, height, margin);
     if(words != undefined) this.setWords(words);
   }

   /**
    * @desc Getter for words.
    * @returns {Array} Array of words.
    */
   getWords()
   {
     return this.words;
   }

   /**
    * @desc Setter for words.
    * @param {Array} words Array of words.
    */
   setWords(words)
   {
     this.words = words;
   }

   /**
    * @desc Getter for xScale.
    * @param {Object} word Word to be scaled.
    * @returns {Object} Scaling function.
    */
   getXScale(word)
   {
     return this.xScale(word);
   }

   /**
    * @desc Setter for xScale.
    * @param {Object} words Set of words to be scaled to a specific domain.
    */
   setXScale(words)
   {
     this.xScale = d3.scaleLinear()
          .domain([0, d3.max(words, function(d){
             return d.value;
           })])
          .range([10,50]);
   }

   /**
    * @desc Clear word cloud from HTML page.
    */
   clearWordCloud()
   {
     super.clearElement("#wordCloudStats");
    //  d3.select("#wordCloudStats").remove();
    //  this.HTMLelement = super.getWidth() = super.getHeight() = super.getMargin() = this.words = undefined;
   }

   /**
    * FIXME - Not working outside of anonymous function
    * @desc Draw word cloud in container.
    * @param {Array} words Array of words resulting from 'd3.layout.cloud' (callback defined parameter)
    */
   drawWordCloud(words)
   {
     var width = 500, height = 400;
     var fill = d3.scaleOrdinal(d3.schemeCategory20);
     var d3WordCloudScope = this;
     d3.select("#wordCloudCard").append("svg")
        .attr("id", "wordCloudStats")
        .attr("width", 500)
        .attr("height", 400)
      .append("g")
        .attr("transform", "translate(" + [500 >> 1,  400 >> 1] + ")")
      .selectAll("text")
      .data(words)
      .enter().append("text")
        .style("font-size", function(d) {console.log(d3WordCloudScope); return d3WordCloudScope.getXScale(d.value) + "px"; })
        .style("font-family", "Impact")
        .style("fill", function(d, i) { return fill(i); })
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.key; });

     d3.layout.cloud().stop();
   }

   /**
    * @desc Create a word cloud and display it on HTML page.
    * @param {Array} words Array of word objects, containing attributes such as "font", "width", "height" and "value".
    * @param {String} HTMLelement HTML element to build d3BarChart div in; if specified, replaces "this.parentElement" value.
    * @param {Number} width Width of element; if specified, replaces "super.getWidth()" value.
    * @param {Number} height Width of element; if specified, replaces "super.getWidth()" value.
    */
   created3WordCloud(words, HTMLelement, width, height)
   {
     try
     {
      // super.setHTMLelement(ecmaStandard(HTMLelement, super.getHTMLelement()));
      // super.setWidth(ecmaStandard(width, super.getWidth()));
      // super.setHeight(ecmaStandard(width, super.getHeight()));
      this.setWords(ecmaStandard(words, this.getWords()));
      var wordEntries = d3.entries(this.getWords());
      /** Scale words from its domain to range [10,100] */
      this.setXScale(wordEntries);
      var d3WordCloudScope = this;
      /** Define word cloud  */
      d3.layout.cloud().size([500, 400])
          .timeInterval(20)
          .words(wordEntries)
          .fontSize(function(d) { return d3WordCloudScope.getXScale(+d.value); })
          .text(function(d) { return d.key; })
          .rotate(function() { return ~~(Math.random() * 2) * 90; })
          .font("Impact")
          .on("end", function(words){
            var fill = d3.scaleOrdinal(d3.schemeCategory20);
            d3.select("#wordCloudCard").append("svg")
               .attr("id", "wordCloudStats")
               .attr("width", 500)
               .attr("height", 400)
             .append("g")
               .attr("transform", "translate(" + [250,  200] + ")")
             .selectAll("text")
             .data(words)
             .enter().append("text")
               .style("font-size", function(d) { return d3WordCloudScope.getXScale(d.value) + "px"; })
               .style("font-family", "Impact")
               .style("fill", function(d, i) { return fill(i); })
               .attr("text-anchor", "middle")
               .attr("transform", function(d) {
                 return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
               })
               .text(function(d) { return d.key; });

            d3.layout.cloud().stop();
          })
          .start();
     }
     catch(err)
     {
       throw "Unexpected error ocurred at line " + err.lineNumber + ", in function created3WordCloud. " + err;
     }
   }
}

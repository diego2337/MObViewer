/**
 * Base class for positioning d3 elements in an HTML page.
 * @author Diego Cintra
 * Date: 08 November 2018
 */

/**
 * @class d3Position
 */
class d3Position
{
  /**
   * @constructor
   * @param {String} HTMLelement HTML element to build d3WordCloud div in.
   * @param {Number} width Width of element.
   * @param {Number} height Height of element.
   * @param {Number} margin Margin of element.
   */
  constructor(HTMLelement, width, height, margin = 2)
  {
    this.HTMLelement = HTMLelement;
    this.width = width;
    this.height = height;
    this.margin = margin;
  }

  /**
   * @desc Getter for margin.
   * @returns {Number} Margin properties.
   */
   getMargin()
   {
     return this.margin;
   }

   /**
    * @desc Setter for margin.
    * @param {Number} margin Margin properties.
    */
    setMargin(margin)
    {
      this.margin = margin;
    }

    /**
     * @desc Getter for width.
     * @returns {Number} width.
     */
    getWidth()
    {
      return this.width;
    }

    /**
     * @desc Setter for width.
     * @param {Number} width width.
     */
     setWidth(width)
     {
       this.width = width;
     }

     /**
      * @desc Getter for height.
      * @returns {Number} height.
      */
     getHeight()
     {
       return this.height;
     }

     /**
      * @desc Setter for height.
      * @param {Number} height height.
      */
     setHeight(height)
     {
       this.height = height;
     }

     /**
      * @desc Getter for HTMLelement.
      * @returns {String} HTMLelement.
      */
     getHTMLelement()
     {
       return this.HTMLelement;
     }

     /**
      * @desc Setter for HTMLelement.
      * @param {String} HTMLelement HTMLelement.
      */
     setHTMLelement(HTMLelement)
     {
       this.HTMLelement = HTMLelement;
     }

     /**
      * @desc Clear element from HTML page.
      * @param {String} svgElement <svg> tag to be removed from HTML page.
      */
     clearElement(svgElement)
     {
       d3.select(svgElement).remove();
       this.width = this.height = this.margin = undefined;
     }
}

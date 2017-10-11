/**
 * Base class for pre ECMAScript2015 standardization.
 * Author: Diego S. Cintra
 */
var ecmaStandard = function(variable, defaultValue)
{
  return variable !== 'undefined' ? variable : defaultValue;
}

module.exports = ecmaStandard;

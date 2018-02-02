/**
 * @desc Base class for pre ECMAScript2015 standardization.
 * @author Diego S. Cintra
 */
var ecmaStandard = function(variable, defaultValue)
{
  return variable !== undefined ? variable : defaultValue;
}

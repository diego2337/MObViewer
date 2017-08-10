/**
 * Singleton base class for depth of the scene.
 * Author: Diego S. Cintra
 */
var Depth = (function (){
 
        // Instance stores a reference to the Singleton
        var instance;
        
        // Singleton
        function init(z2) 
        {
            // Private methods and variables
            var z = z2;

            return{
            
                // Public methods and variables
                /**
                 * Getter of z
                 */
                getZ : function()
                {
                    return z;
                },

                /**
                * Setter of z
                */
                setZ : function(z)
                {
                    this.z = z;
                }
            
            };
            
        };
        
        return{
        
            // Get the Singleton instance if one exists
            // or create one if it doesn't
            getInstance: function (z2 = 0) 
            {
                if ( !instance ) {
                    instance = init(z2);
                }
            
                return instance;
            }
        
        };
 
})();

/**
 * Constructor
 * params:
 *    - z: Depth to be applied in every element of the scene.
 */
// function Depth(z)
// {
//     this.z = z;
// }
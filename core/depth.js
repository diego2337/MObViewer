/**
 * Singleton base class for depth of the scene.
 * Author: Diego S. Cintra
 */

// TODO Depth function not being identified
var Depth = 
(
    function()
    {
        /**
         * Constructor
         * params:
         *    - z: Depth to be applied in every element of the scene.
         */
        function Depth(z)
        {
            this.z = z;
        }
        
        /**
         * Getter of z
         */
        function getZ()
        {
            return this.z;
        }

        /**
         * Setter of z
         */
        function setZ(z)
        {
            this.z = z;
        }
    }
)();
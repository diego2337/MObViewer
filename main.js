requirejs(['../threeJs/build/three'], function(){
    requirejs(['core/edge'], function(){
        requirejs(['core/node'], function(){
            requirejs(['core/graph'], function(){
                console.log("All functions loaded.");
            });
        });
    });
});
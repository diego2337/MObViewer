requirejs(['../threeJs/build/three'], function(){
    requirejs(['core/edge'], function(){
        requirejs(['core/node'], function(){
            requirejs(['core/graph'], function(){
                console.log("All functions loaded.");
            });
        });
    });
});

function main()
{
    /* Converting passed textarea input to JSON */
    var jason = JSON.parse($.trim($("textarea").val()));
    // console.log(jason);
}
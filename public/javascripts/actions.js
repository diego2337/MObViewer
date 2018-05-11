/**
  * @desc File to watch for actions triggered at main page, such as the opening and closing of menus.
  * @author Diego Cintra
  * Date: 06/12/2017
  */

/**
 * Change current layout value.
 * @public
 */
function layoutUpdate()
{
  if(layout == 2)
  {
    layout = 3;
    document.getElementById("panLeft").disabled = "disabled";
    document.getElementById("panRight").disabled = "disabled";
  }
  else if(layout == 3)
  {
    layout = 2;
    document.getElementById("panLeft").disabled = "";
    document.getElementById("panRight").disabled = "";
  }
}

/** Change values for first layer coarsening */
$('#multilevelCoarsener').on('change', function(){
  document.getElementById("output1").innerHTML = parseFloat($('#multilevelCoarsener')[0].value);
});

/** Change values for second layer coarsening */
$('#multilevelCoarsener2').on('change', function(){
  document.getElementById("output2").innerHTML = parseFloat($('#multilevelCoarsener2')[0].value);
});

/** Change from horizontal layout to vertical layout */
$('#switchLayout').on('click', function(){
  $.ajax({
    url: '/switch',
    type: 'POST',
    success: function(html){
      layoutUpdate();
      graphUpdate(html, layout);
    },
    xhr: loadGraph
  });
});

/**
 * Build graph on screen using three.js.
 * @public
 */
function graphUpdate(data, layout){
  /* Render updated graph */
  build(data, layout);
}

/**
 * While server-side functions are running, display progress bar.
 * @public
 * @return {Object} xhr object for AJAX call.
 */
function loadGraph()
{
  var xhr = new window.XMLHttpRequest();

  // Upload progress
  xhr.upload.addEventListener("progress", function(evt){
      if (evt.lengthComputable) {
          var percentComplete = evt.loaded / evt.total;
          /* Hide graph */
          $('#WebGL').css('visibility', 'hidden');
          /*  Show WebGL div */
          $('#progressBar').css('visibility', 'visible');
          // console.log(percentComplete);
      }
  }, false);

  // Download progress
  xhr.addEventListener("progress", function(evt){
     if (evt.lengthComputable) {
         var percentComplete = evt.loaded / evt.total;
         //  console.log(percentComplete);
     }
     else {
     }
     /* Hide loading bar */
     $('#progressBar').css('visibility', 'hidden');
     /*  Show WebGL div */
     $('#WebGL').css('visibility', 'visible');
  }, false);

  return xhr;
}

/**
 * Check to see if value is integer; if true, returns casted int value. Otherwise return undefined.
 * @param {String} value Value to check.
 * @returns {(int|undefined)} Returns int if value is integer; returns undefined otherwise.
 */
function getInteger(value)
{
  if(parseInt(value) === NaN)
  {
    return undefined;
  }
  else
  {
    return parseInt(value);
  }
  // parseInt(value) == NaN ? return undefined : return parseInt(value);
}

/** Apply multilevel coarsening with user defined reduction factor and number of levels */
$("#coarseGraph").on('click', function(){
  $.ajax({
    url:'/coarse',
    type: 'POST',
    data: {nLevels: getInteger($("#nLevels")[0].value), coarsening: $('#multilevelCoarsener')[0].value, coarseningSecondSet: $('#multilevelCoarsener2')[0].value, firstSet: $('#multilevelCoarsener')[0].value != 0 ? 1 : 0},
    // success: graphUpdate,
    success: function(html){
      graphUpdate(html, layout);
    },
    xhr: loadGraph
  });
});

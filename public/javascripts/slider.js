/**
  * File to watch for changes in slider used for multilevel paradigm.
  * Author: Diego Cintra
  * Date: 15/11/2017
  */

/**
  * Change min and max values for input type range element in HTML page
  * Param:
  *    - data: .json graph uploaded to server-side
  */
function changeMinAndMaxValues(data)
{
  // console.log("changeMinAndMaxFunction");
  var d = JSON.parse(data);
  var numberOfNodes1 = d.graphInfo[0].vlayer.split(" ");
  $('#multilevelCoarsener').prop({
    'min': 1,
    'max': numberOfNodes1[0],
    'value': numberOfNodes1[0]
  });
  $('#multilevelCoarsener2').prop({
    'min': 1,
    'max': numberOfNodes1[1],
    'value': numberOfNodes1[1]
  });
  document.getElementById("output1").innerHTML = numberOfNodes1[0];
  document.getElementById("output2").innerHTML = numberOfNodes1[1];
}

/**
  * Outputs current slider value
  */
function showValue()
{
  document.getElementById("output1").innerHTML = document.getElementById("multilevelCoarsener").value;
  document.getElementById("output2").innerHTML = document.getElementById("multilevelCoarsener2").value;
}

function graphUpdate(data){
  console.log("Graph update successful");
  /* Render updated graph */
  build(data);
}

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

/* Apply changes for first layer coarsening */
$('#multilevelCoarsener').on('change', function(){
  document.getElementById("output1").innerHTML = parseFloat($('#multilevelCoarsener')[0].value);
  /* Perform an AJAX request to server */
  $.ajax({
    url: '/slide',
    type: 'POST',
    data: {coarsening: $('#multilevelCoarsener')[0].value, coarseningSecondSet: $('#multilevelCoarsener2')[0].value, firstSet: true},
    // data: JSON.parse($('#multilevelCoarsener')[0].value),
    success: graphUpdate,
    xhr: loadGraph
  });
});

/* Apply changes for second layer coarsening */
$('#multilevelCoarsener2').on('change', function(){
  document.getElementById("output2").innerHTML = $('#multilevelCoarsener2')[0].value;
  /* Perform an AJAX request to server */
  $.ajax({
    url: '/slide',
    type: 'POST',
    data: {coarsening: $('#multilevelCoarsener')[0].value, coarseningSecondSet: $('#multilevelCoarsener2')[0].value, firstSet: false},
    // data: JSON.parse($('#multilevelCoarsener')[0].value),
    success: graphUpdate,
    xhr: loadGraph
  });
});

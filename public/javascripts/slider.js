/*
 * File to watch for changes in slider used for multilevel paradigm.
 * Author: Diego Cintra
 * Date: 15/11/2017
 */

/* Change min and max values for input type range element in HTML page
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

function graphUpdate(data){
  console.log("Graph update successful");
}

/* Apply changes for first layer coarsening */
$('#multilevelCoarsener').on('change', function(){
  document.getElementById("output1").innerHTML = parseInt($('#multilevelCoarsener')[0].value);
  /* Perform an AJAX request to server */
  $.ajax({
    url: '/slide',
    type: 'POST',
    data: {coarsening: $('#multilevelCoarsener')[0].value},
    success: graphUpdate
  });
});

/* Apply changes for second layer coarsening */
$('#multilevelCoarsener2').on('change', function(){
  document.getElementById("output2").innerHTML = $('#multilevelCoarsener2')[0].value;
});
/**
  * File to watch for actions triggered at main page.
  * Author: Diego Cintra
  * Date: 06/12/2017
  */

/* Collapse graph info menu */
$('#showGraphInfoMinimized').on('click', function(){
  $('#graphInfoMinimized').css('display', 'none');
  $('#graphInfoCollapsed').css('display', 'inline');
});

/* Minimize graph info menu */
$('#showGraphInfoCollapsed').on('click', function(){
  $('#graphInfoMinimized').css('display', 'inline');
  $('#graphInfoCollapsed').css('display', 'none');
});

/* Collapse graph configuration menu */
$('#showGraphConfigurationMinimized').on('click', function(){
  $('#graphConfigurationMinimized').css('display', 'none');
  $('#graphConfigurationCollapsed').css('display', 'inline');
});

/* Minimize graph configuration menu */
$('#showGraphConfigurationCollapsed').on('click', function(){
  $('#graphConfigurationCollapsed').css('display', 'none');
  $('#graphConfigurationMinimized').css('display', 'inline');
});

/* Collapse multilevel options menu */
$('#showMultilevelOptionsMinimized').on('click', function(){
  $('#multilevelOptionsMinimized').css('display', 'none');
  $('#multilevelOptionsCollapsed').css('display', 'inline');
});

/* Minimize multilevel options menu */
$('#showMultilevelOptionsCollapsed').on('click', function(){
  $('#multilevelOptionsCollapsed').css('display', 'none');
  $('#multilevelOptionsMinimized').css('display', 'inline');
});

/* Collapse vertex info menu */
$('#showVertexInfoMinimized').on('click', function(){
  $('#vertexInfoMinimized').css('display', 'none');
  $('#vertexInfoCollapsed').css('display', 'inline');
});

/* Minimize vertex info menu */
$('#showVertexInfoCollapsed').on('click', function(){
  $('#vertexInfoCollapsed').css('display', 'none');
  $('#vertexInfoMinimized').css('display', 'inline');
});

/**
  * Change current layout value
  */
function layoutUpdate()
{
  if(layout == 2)
    layout = 3;
  else if(layout == 3)
    layout = 2;
}

/* Change from horizontal layout to vertical layout */
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
  * File to watch for clicks in buttons used for saving either .png graph image or .json file.
  * Author: Diego Cintra
  * Date: 06/12/2017
  */

$('#saveImgButton').on('click', function (){
  capture = true;
  // document.getElementById('saveImgButton').href = dataURL;
  // document.getElementById('saveImg').click();
});

$('#saveFileButton').on('click', function(){
  $.ajax({
    url: '/switch',
    type: 'POST',
    success: function(html){
      var dataStr = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(html));
      var dlAnchorElem = document.getElementById('downloadAnchorElem');
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute("download", "graph.json");
      dlAnchorElem.click();
    }
  });
});

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
  build(data, layout);
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

$('.upload-btn').on('click', function (){
    $('#upload-input').click();
    $('.progress-bar').text('0%');
    $('.progress-bar').width('0%');
});

$('#upload-input').on('change', function(){
  var files = $(this).get(0).files;
  if (files.length > 0){
    // create a FormData object which will be sent as the data payload in the
    // AJAX request
    var formData = new FormData();

    // loop through all the selected files and add them to the formData object
    for (var i = 0; i < files.length; i++) {
      var file = files[i];

      // add the files to formData object for the data payload
      formData.append('uploads[]', file, file.name);
    }

    $.ajax({
      url: '/upload',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function(data){
          console.log('Upload successful!\n');
          /* Change slider min & max values */
          // changeMinAndMaxValues(data);
          /* Show slider's current value */
          showValue();
          /* Hide upload box */
          $('#uploadBox').css('display', 'none');
          /* Build the graph after loading .json file */
          build(data);
          /* Below won't work - AJAX call works for same page only! */
          // location.href = '/visualization';
      },
      xhr: loadGraph
      // xhr: function() {
      //   // create an XMLHttpRequest
      //   var xhr = new XMLHttpRequest();
      //
      //   // listen to the 'progress' event
      //   xhr.upload.addEventListener('progress', function(evt) {
      //
      //     if (evt.lengthComputable) {
      //       // calculate the percentage of upload completed
      //       var percentComplete = evt.loaded / evt.total;
      //       percentComplete = parseInt(percentComplete * 100);
      //
      //       // update the Bootstrap progress bar with the new percentage
      //       $('.progress-bar').text(percentComplete + '%');
      //       $('.progress-bar').width(percentComplete + '%');
      //
      //       // once the upload reaches 100%, set the progress bar text to done
      //       if (percentComplete === 100) {
      //         $('.progress-bar').html('Done');
      //       }
      //
      //     }
      //
      //   }, false);
      //
      //   return xhr;
      // }
    });

  }
});

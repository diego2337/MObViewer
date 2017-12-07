/**
  * File to watch for actions triggered at main page.
  * Author: Diego Cintra
  * Date: 06/12/2017
  */
$('#showGraphInfo').on('click', function(){
  
});

/**
  * File to watch for clicks in buttons used for saving either .png graph image or .json file.
  * Author: Diego Cintra
  * Date: 06/12/2017
  */

$('#saveImgButton').on('click', function (){
  var dataURL = document.getElementsByTagName('canvas')[0].toDataURL('image/png');
  var wd = window.open('about:blank', 'graph');
  wd.document.write("<img src='" + dataURL + "' alt='from canvas'/>");
  document.getElementById('saveImg').href = dataURL;
  // document.getElementById('saveImg').click();
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

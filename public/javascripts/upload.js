/**
  * @desc File to watch for uploaded files by user.
  * @author Diego Cintra
  * Date: 02/02/2018
  */

/**
  * Outputs current slider value.
  * @public
  */
function showValue()
{
  document.getElementById("output1").innerHTML = document.getElementById("multilevelCoarsener").value;
  document.getElementById("output2").innerHTML = document.getElementById("multilevelCoarsener2").value;
}

/** Trigger upload-input element click */
$('.upload-btn').on('click', function (){
    $('#upload-input').click();
    $('.progress-bar').text('0%');
    $('.progress-bar').width('0%');
});

/** Trigger AJAX call to send data server-side */
$('#upload-input').on('change', function(){
  var files = $(this).get(0).files;
  if (files.length > 0){
    /* Create a FormData object which will be sent as the data payload in the AJAX request */
    var formData = new FormData();

    /* Loop through all the selected files and add them to the formData object */
    for (var i = 0; i < files.length; i++) {
      var file = files[i];

      /* Add the files to formData object for the data payload */
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
          /* Show slider's current value */
          showValue();
          /** Allow button to selected user info to be enabled */
          $("#userInfo").prop("disabled", false);
          /* Build graph after loading .json file */
          layout.build(data);
          /** Update vertex data */
          vueTableUserRows._data.rows = layout.vertexInfo.getProps();
      },
      xhr: loadGraph
    });

  }
});

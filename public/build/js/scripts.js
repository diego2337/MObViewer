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
  if(layout.lay == 2)
  {
    layout.lay = 3;
    document.getElementById("panLeft").disabled = "disabled";
    document.getElementById("panRight").disabled = "disabled";
  }
  else if(layout.lay == 3)
  {
    layout.lay = 2;
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
      graphUpdate(html, layout.lay);
    },
    xhr: loadGraph
  });
});

/**
 * Build graph on screen using three.js.
 * @public
 */
function graphUpdate(data, lay){
  /* Render updated graph */
  layout.build(data, layout.lay);
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

/**
 * Check to see if value is integer; if true, returns casted int value. Otherwise return zero.
 * @param {String} value Value to check.
 * @returns {(int|undefined)} Returns int if value is integer; returns zero otherwise.
 */
function getInteger(value)
{
  if(parseInt(value) === NaN)
  {
    // return undefined;
    return 0;
  }
  else
  {
    return parseInt(value);
  }
  // parseInt(value) == NaN ? return undefined : return parseInt(value);
}

/** Apply multilevel coarsening with user defined reduction factor and number of levels */
$("#coarseGraph").on('click', function(){
  /** Iterate through a for loop to create nLevels of coarsened graphs */
  $.ajax({
    url:'/coarse',
    type: 'POST',
    data: {nLevels: getInteger($("#nLevels")[0].value), coarsening: $('#multilevelCoarsener')[0].value, coarseningSecondSet: $('#multilevelCoarsener2')[0].value, firstSet: $('#multilevelCoarsener')[0].value != 0 ? 1 : 0},
    // success: graphUpdate,
    success: function(html){
      let nOfExecutions = getInteger($("#nLevels")[0].value);
      /** Finished coarsening, perform multiple ajax calls to convert from .gml to .json */
      for(let i = 0; i < getInteger($("#nLevels")[0].value); i++)
      {
        $.ajax({
          url:'/convert',
          type: 'POST',
          data: {nLevels: getInteger($("#nLevels")[0].value), coarsening: $('#multilevelCoarsener')[0].value, coarseningSecondSet: $('#multilevelCoarsener2')[0].value, firstSet: $('#multilevelCoarsener')[0].value != 0 ? 1 : 0, currentLevel: (i+1).toString()},
          success: function(html){
            /** Finished all conversions; set properties properly */
            if(nOfExecutions == 1)
            {
                $.ajax({
                  url:'/setProperties',
                  type: 'POST',
                  data: {nLevels: getInteger($("#nLevels")[0].value), coarsening: $('#multilevelCoarsener')[0].value, coarseningSecondSet: $('#multilevelCoarsener2')[0].value, firstSet: $('#multilevelCoarsener')[0].value != 0 ? 1 : 0},
                  success: function(html){
                    graphUpdate(html, layout.lay);
                  }
                });
            }
            else
            {
              nOfExecutions = nOfExecutions - 1;
              // console.log("nOfExecutions: " + nOfExecutions);
            }
          }
        });
      }
      // graphUpdate(html, layout.lay);
    },
    xhr: loadGraph
  });
});

/** Reset vertex info being shown by clicking */
$("#resetInfo").on('click', function(){
  vueTableHeader._data.headers = "";
  vueTableRows._data.rows = "";
});

/** Show dialog to allow user to specify which information is to be shown on tooltip */
$("#userInfo").on('click', function(){
  $("#userDefinedInfo").css('visibility', 'visible');
});

/** Cancel all user defined info */
$("#cancel").on('click', function(){
  $("#userDefinedInfo").css('visibility', 'hidden');
});

/** Store user defined info in eventHandler object */
$("#apply").on('click', function(){
  var allRows = $(".userRows");
  var arrOfNames = [];
  for(var i = 0; i < allRows.length; i++)
  {
    /** Check if checkbox was checked */
    if(allRows[i].children[0].children[0].children[0].checked == true)
    {
      /** Store defined name */
      arrOfNames.push(allRows[i].children[1].children[0].textContent);
    }
  }
  /** Let eventHandler store array of names and hide checkboxes */
  layout.eventHandler.userInfo = arrOfNames;
  $("#userDefinedInfo").css('visibility', 'hidden');
});

/** Show connections between super vertexes and original vertexes */
$("#showConnections").on('click', function(){
  $.ajax({
    url:'/coarse',
    type: 'POST',
    data: {nLevels: getInteger($("#nLevels")[0].value), coarsening: $('#multilevelCoarsener')[0].value, coarseningSecondSet: $('#multilevelCoarsener2')[0].value, firstSet: $('#multilevelCoarsener')[0].value != 0 ? 1 : 0},
    success: function(html){
      /** Tell layout to update variable "parentConnections" */
      layout.parentConnections == 0 ? layout.parentConnections = 1 : layout.parentConnections = 0;
      graphUpdate(html, layout.lay);
    },
    xhr: loadGraph
  });
});

/** Coarse graph based on json input given by user */
$("#coarseJson").on('click', function(){
  $.ajax({
    url:'/coarse',
    type: 'POST',
    data: {jsonInput: JSON.parse($("#jsonTextArea")[0].value)},
    success: function(html){
      let maxCoarsening = Math.max(JSON.parse($("#jsonTextArea")[0].value).max_levels[0], JSON.parse($("#jsonTextArea")[0].value).max_levels[1]);
      console.log("maxCoarsening:" + maxCoarsening);
      let nOfExecutions = maxCoarsening;
      if(maxCoarsening != 0)
      {
        /** Finished coarsening, perform multiple ajax calls to convert from .gml to .json */
        for(let i = 0; i < maxCoarsening; i++)
        {
          $.ajax({
            url:'/convert',
            type: 'POST',
            data: {nLevels: maxCoarsening, firstSetLevel: JSON.parse($("#jsonTextArea")[0].value).max_levels[0], secondSetLevel: JSON.parse($("#jsonTextArea")[0].value).max_levels[1], coarsening: JSON.parse($("#jsonTextArea")[0].value).reduction_factor[0], coarseningSecondSet: JSON.parse($("#jsonTextArea")[0].value).reduction_factor[1], firstSet: JSON.parse($("#jsonTextArea")[0].value).reduction_factor[0] != 0 ? 1 : 0, currentLevel: (i+1).toString()},
            success: function(html){
              /** Finished all conversions; set properties properly */
              if(nOfExecutions == 1)
              {
                  $.ajax({
                    url:'/setProperties',
                    type: 'POST',
                    data: {nLevels: maxCoarsening, firstSetLevel: JSON.parse($("#jsonTextArea")[0].value).max_levels[0], secondSetLevel: JSON.parse($("#jsonTextArea")[0].value).max_levels[1], coarsening: JSON.parse($("#jsonTextArea")[0].value).reduction_factor[0], coarseningSecondSet: JSON.parse($("#jsonTextArea")[0].value).reduction_factor[1], firstSet: JSON.parse($("#jsonTextArea")[0].value).reduction_factor[0] != 0 ? 1 : 0},
                    success: function(html){
                      graphUpdate(html, layout.lay);
                    }
                  });
              }
              else
              {
                nOfExecutions = nOfExecutions - 1;
              }
            }
          });
        }
      }
      else
      {
        $.ajax({
          url:'/getGraph',
          type: 'POST',
          data: {graphName: JSON.parse($("#jsonTextArea")[0].value).filename.split(".")[0]},
          success: function(html){
            graphUpdate(html, layout.lay);
          }
        });
      }
      /** Tell layout to update variable "parentConnections" */
      // layout.parentConnections == 0 ? layout.parentConnections = 1 : layout.parentConnections = 0;
      // graphUpdate(html, layout.lay);
    },
    xhr: loadGraph
  });
});

/** Show json input card on click */
$("#jsonInfo").on('click', function(){
    $("#jsonInput").css('visibility') == 'hidden' ?  $("#jsonInput").css('visibility', 'visible') : $("#jsonInput").css('visibility', 'hidden');
});

/** */
$("#coarseJson").on('click', function(){
  $("#jsonInput").css('visibility', 'hidden');
})

/**
  * @ File to watch for clicks in buttons used for saving either .png graph image or .json file.
  * @author Diego Cintra
  * Date: 06/12/2017
  */

/** Trigger image saving when button is clicked */
$('#saveImgButton').on('click', function (){
  layout.capture = true;
});

/** Generate .json file from graph */
$('#saveFileButton').on('click', function(){
  $.ajax({
    url: '/switch',
    type: 'POST',
    success: function(html){
      var dataStr = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(html, undefined, "\t"));
      var dlAnchorElem = document.getElementById('downloadAnchorElem');
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute("download", "graph.json");
      dlAnchorElem.click();
    }
  });
});

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
          /** Allow button to select user info to be clicked */
          $("#userInfo").prop("disabled", false);
          /** Allow button to select parameters for coarsening to be clicked */
          $("#jsonInfo").prop("disabled", false);
          /* Build graph after loading .json file */
          layout.build(data);
          /** Update vertex data */
          vueTableUserRows._data.rows = layout.vertexInfo.getProps();
      },
      xhr: loadGraph
    });

  }
});

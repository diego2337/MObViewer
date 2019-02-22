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
    url: '/graph/switch',
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

/**
 * Check to see if value is '0.0'; if true, convert to integer.
 * @param {Float} value Value to check.
 * @returns {(int|Float)} Returns int if value is '0.0'; returns same value otherwise.
 */
function treatFloatZero(value)
{
  return parseFloat(value) === 0 ? 0 : value;
  // console.log("value:");
  // console.log(parseFloat(value));
  // if(!isInt(parseFloat(value)) && value == 0.0)
  // {
  //   console.log("returned casted int value");
  //   return parseInt(value);
  // }
  // else
  // {
  //     return value;
  // }
}

/**
 * Create 'categories.csv' file, containing data attributes and their respective types.
 * @param {String} textarea "<textarea>" tag.
 */
function createCategoriesFile(textarea)
{
  $.ajax({
    url: '/system/categories',
    type: 'POST',
    data: {jsonInput: textarea.value},
    success: function(html){
      alert(".csv file successfully created!");
    },
    xhr: loadGraph
  });
}

/**
 * Create 'label.txt' file.
 * @param {String} textarea "<textarea>" tag.
 */
function createLabelFile(textarea)
{
  $.ajax({
    url: 'graph/defineLabel',
    type: 'POST',
    data: { l: textarea.value },
    success: function(html){
      alert(".txt file successfully created!");
      $.ajax({
        url: 'graph/createGraphColors',
        type: 'POST',
        /** FIXME - NEVER NEVER EVER use async! */
        async: false,
        success: function(){
          alert('Color scheme for label successfully created! Saved as \'colors.json\' file.');
        },
        xhr: loadGraph
      });
    },
    xhr: loadGraph
  });
}

/**
 * Create 'wordCloud.txt' file.
 * @param {String} textarea "<textarea>" tag.
 */
function createWordCloudFile(textarea)
{
  $.ajax({
    url: 'graph/defineWordCloud',
    type: 'POST',
    data: { l: textarea.value },
    success: function(html){
      alert(".txt file successfully created!");
    },
    xhr: loadGraph
  });
}

/** Apply multilevel coarsening with user defined reduction factor and number of levels */
$("#coarseGraph").on('click', function(){
  /** Iterate through a for loop to create nLevels of coarsened graphs */
  $.ajax({
    url:'/system/coarse',
    type: 'POST',
    data: {nLevels: getInteger($("#nLevels")[0].value), coarsening: treatFloatZero($('#multilevelCoarsener')[0].value), coarseningSecondSet: treatFloatZero($('#multilevelCoarsener2')[0].value), firstSet: $('#multilevelCoarsener')[0].value != 0 ? 1 : 0},
    // success: graphUpdate,
    success: function(html){
      let nOfExecutions = getInteger($("#nLevels")[0].value);
      /** Finished coarsening, perform multiple ajax calls to convert from .gml to .json */
      for(let i = 0; i < getInteger($("#nLevels")[0].value); i++)
      {
        $.ajax({
          url:'/system/convert',
          type: 'POST',
          data: {nLevels: getInteger($("#nLevels")[0].value), coarsening: treatFloatZero($('#multilevelCoarsener')[0].value), coarseningSecondSet: treatFloatZero($('#multilevelCoarsener2')[0].value), firstSet: $('#multilevelCoarsener')[0].value != 0 ? 1 : 0, currentLevel: (i+1).toString()},
          success: function(html){
            /** Finished all conversions; set properties properly */
            if(nOfExecutions == 1)
            {
                $.ajax({
                  url:'/system/setProperties',
                  type: 'POST',
                  data: {nLevels: getInteger($("#nLevels")[0].value), coarsening: treatFloatZero($('#multilevelCoarsener')[0].value), coarseningSecondSet: treatFloatZero($('#multilevelCoarsener2')[0].value), firstSet: $('#multilevelCoarsener')[0].value != 0 ? 1 : 0},
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
  vueTableHeaderSecondLayer._data.headers = "";
  vueTableRowsSecondLayer._data.rows = "";
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
    url:'/system/coarse',
    type: 'POST',
    data: {nLevels: getInteger($("#nLevels")[0].value), coarsening: treatFloatZero($('#multilevelCoarsener')[0].value), coarseningSecondSet: treatFloatZero($('#multilevelCoarsener2')[0].value), firstSet: $('#multilevelCoarsener')[0].value != 0 ? 1 : 0},
    success: function(html){
      /** Tell layout to update variable "parentConnections" */
      layout.parentConnections == 0 ? layout.parentConnections = 1 : layout.parentConnections = 0;
      graphUpdate(html, layout.lay);
    },
    xhr: loadGraph
  });
});

var maxLevelsNl = 0;
var maxLevelsNr = 0;
var leftReductionFactor = 0;
var rightReductionFactor = 0;
/** Coarse graph based on json input given by user */
// $("#coarseJson").on('click', function(){
//   $.ajax({
//     url:'/system/coarse',
//     type: 'POST',
//     data: {jsonInput: JSON.parse($("#jsonTextArea")[0].value)},
//     success: function(html){
//       html = JSON.parse(html);
//       maxLevelsNl = html.nl;
//       maxLevelsNr = html.nr;
//       leftReductionFactor = html.lr;
//       rightReductionFactor = html.rr;
//       JSON.parse($("#jsonTextArea")[0].value).reduction_factor = [html.lr, html.rr];
//       // let maxCoarsening = Math.max(JSON.parse($("#jsonTextArea")[0].value).max_levels[0], JSON.parse($("#jsonTextArea")[0].value).max_levels[1]);
//       let maxCoarsening = Math.max(maxLevelsNl, maxLevelsNr);
//       let nOfExecutions = maxCoarsening;
//       let nl = nr = 0;
//       if(maxCoarsening != 0)
//       {
//         /** Finished coarsening, perform multiple ajax calls to convert from .gml to .json */
//         for(let i = 0; i < maxCoarsening; i++)
//         {
//           if(nl < maxLevelsNl)
//           {
//             nl = nl + 1;
//           }
//           if(nr < maxLevelsNr)
//           {
//             nr = nr + 1;
//           }
//           $.ajax({
//             url:'/system/convert',
//             type: 'POST',
//             // data: {firstSetLevel: maxLevelsNl, secondSetLevel: maxLevelsNr, coarsening: treatFloatZero(JSON.parse($("#jsonTextArea")[0].value).reduction_factor[0]), coarseningSecondSet: treatFloatZero(JSON.parse($("#jsonTextArea")[0].value).reduction_factor[1]), firstSet: JSON.parse($("#jsonTextArea")[0].value).reduction_factor[0] != 0 ? 1 : 0, currentLevel: (i+1).toString()},
//             // data: {firstSetLevel: nl, secondSetLevel: nr, coarsening: treatFloatZero(JSON.parse($("#jsonTextArea")[0].value).reduction_factor[0]), coarseningSecondSet: treatFloatZero(JSON.parse($("#jsonTextArea")[0].value).reduction_factor[1]), firstSet: JSON.parse($("#jsonTextArea")[0].value).reduction_factor[0] != 0 ? 1 : 0, currentLevel: (i+1).toString()},
//             data: {firstSetLevel: nl, secondSetLevel: nr, coarsening: leftReductionFactor, coarseningSecondSet: rightReductionFactor, firstSet: leftReductionFactor != 0 ? 1 : 0, currentLevel: (i+1).toString()},
//             success: function(html){
//               /** Finished all conversions; set properties properly */
//               if(nOfExecutions == 1)
//               {
//                   $.ajax({
//                     url:'/system/setProperties',
//                     type: 'POST',
//                     data: {nLevels: maxCoarsening, firstSetLevel: maxLevelsNl, secondSetLevel: maxLevelsNr, coarsening: leftReductionFactor, coarseningSecondSet: rightReductionFactor, firstSet: leftReductionFactor != 0 ? 1 : 0},
//                     success: function(html){
//                       $("#userInfo").prop("disabled", false);
//                       /** Update vertex data */
//                       vueTableUserRows._data.rows = layout.vertexInfo.getProps();
//                       graphUpdate(html, layout.lay);
//                     }
//                   });
//               }
//               else
//               {
//                 nOfExecutions = nOfExecutions - 1;
//               }
//             }
//           });
//         }
//       }
//       else
//       {
//         $.ajax({
//           url:'/graph/getGraph',
//           type: 'POST',
//           data: {graphName: JSON.parse($("#jsonTextArea")[0].value).filename.split(".")[0]},
//           success: function(html){
//             $("#userInfo").prop("disabled", false);
//             /** Update vertex data */
//             vueTableUserRows._data.rows = layout.vertexInfo.getProps();
//             graphUpdate(html, layout.lay);
//           }
//         });
//       }
//       /** Tell layout to update variable "parentConnections" */
//       // layout.parentConnections == 0 ? layout.parentConnections = 1 : layout.parentConnections = 0;
//       // graphUpdate(html, layout.lay);
//     },
//     xhr: loadGraph
//   });
// });

/** Show json input card on click */
$("#jsonInfo").on('click', function(){
    // $("#jsonInput").css('visibility') == 'hidden' ?  $("#jsonInput").css('visibility', 'visible') : $("#jsonInput").css('visibility', 'hidden');
    var meta = 'jsonTextArea';
    showDialog({
          title: 'Define json input',
          metaTitle: meta,
          text: 'Create a .json file associating attributes for execution of multilevel paradigm, e.g: { "vertices": [10, 20], "reduction_factor": [0.2, 0.3] ... }',
          textArea: true,
          negative: {
              title: 'Go back'
          },
          positive: {
              title: 'Create',
              onClick: function(e) {
                var text = document.getElementsByTagName('textarea');
                $("#jsonTextArea").val(text[1].value);
                $.ajax({
                  url:'/system/coarse',
                  type: 'POST',
                  data: {jsonInput: JSON.parse($("#jsonTextArea")[0].value)},
                  success: function(html){
                    html = JSON.parse(html);
                    maxLevelsNl = html.nl;
                    maxLevelsNr = html.nr;
                    leftReductionFactor = html.lr;
                    rightReductionFactor = html.rr;
                    JSON.parse($("#jsonTextArea")[0].value).reduction_factor = [html.lr, html.rr];
                    // let maxCoarsening = Math.max(JSON.parse($("#jsonTextArea")[0].value).max_levels[0], JSON.parse($("#jsonTextArea")[0].value).max_levels[1]);
                    let maxCoarsening = Math.max(maxLevelsNl, maxLevelsNr);
                    let nOfExecutions = maxCoarsening;
                    let nl = nr = 0;
                    if(maxCoarsening != 0)
                    {
                      /** Finished coarsening, perform multiple ajax calls to convert from .gml to .json */
                      for(let i = 0; i < maxCoarsening; i++)
                      {
                        if(nl < maxLevelsNl)
                        {
                          nl = nl + 1;
                        }
                        if(nr < maxLevelsNr)
                        {
                          nr = nr + 1;
                        }
                        $.ajax({
                          url:'/system/convert',
                          type: 'POST',
                          // data: {firstSetLevel: maxLevelsNl, secondSetLevel: maxLevelsNr, coarsening: treatFloatZero(JSON.parse($("#jsonTextArea")[0].value).reduction_factor[0]), coarseningSecondSet: treatFloatZero(JSON.parse($("#jsonTextArea")[0].value).reduction_factor[1]), firstSet: JSON.parse($("#jsonTextArea")[0].value).reduction_factor[0] != 0 ? 1 : 0, currentLevel: (i+1).toString()},
                          // data: {firstSetLevel: nl, secondSetLevel: nr, coarsening: treatFloatZero(JSON.parse($("#jsonTextArea")[0].value).reduction_factor[0]), coarseningSecondSet: treatFloatZero(JSON.parse($("#jsonTextArea")[0].value).reduction_factor[1]), firstSet: JSON.parse($("#jsonTextArea")[0].value).reduction_factor[0] != 0 ? 1 : 0, currentLevel: (i+1).toString()},
                          data: {firstSetLevel: nl, secondSetLevel: nr, coarsening: leftReductionFactor, coarseningSecondSet: rightReductionFactor, firstSet: leftReductionFactor != 0 ? 1 : 0, currentLevel: (i+1).toString()},
                          success: function(html){
                            /** Finished all conversions; set properties properly */
                            if(nOfExecutions == 1)
                            {
                                $.ajax({
                                  url:'/system/setProperties',
                                  type: 'POST',
                                  data: {nLevels: maxCoarsening, firstSetLevel: maxLevelsNl, secondSetLevel: maxLevelsNr, coarsening: leftReductionFactor, coarseningSecondSet: rightReductionFactor, firstSet: leftReductionFactor != 0 ? 1 : 0},
                                  success: function(html){
                                    $("#userInfo").prop("disabled", false);
                                    /** Update vertex data */
                                    vueTableUserRows._data.rows = layout.vertexInfo.getProps();
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
                        url:'/graph/getGraph',
                        type: 'POST',
                        data: {graphName: JSON.parse($("#jsonTextArea")[0].value).filename.split(".")[0]},
                        success: function(html){
                          $("#userInfo").prop("disabled", false);
                          /** Update vertex data */
                          vueTableUserRows._data.rows = layout.vertexInfo.getProps();
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
              }
          }
      });
});

/** Show text area to define categories on click */
$("#defineCategories").on('click', function(){
  var meta = 'categories';
  showDialog({
        title: 'Define data categories',
        metaTitle: meta,
        text: 'Create a csv file associating data attributes with their respective types, e.g: attribute1,{categorical|ordinal},{nOfElem|range-range} attribute2,{categorical|ordinal},{nOfElem|range-range}...',
        textArea: true,
        negative: {
            title: 'Go back'
        },
        positive: {
            title: 'Create',
            onClick: function(e) {
              // console.log(document.getElementsByTagName("textarea"));
              var text = document.getElementsByTagName("textarea");
              var createCat = undefined;
              for(t in text)
              {
                if(text[t].id == "")
                {
                  createCat = text[t];
                }
              }
              createCategoriesFile(createCat);
            }
        }
    });
});

/** Show text area to define word cloud attribute on click */
$("#defineWordCloud").on('click', function(){
  var meta = 'wordCloud';
  showDialog({
        title: 'Define word cloud attribute',
        metaTitle: meta,
        text: 'Create a .txt file associated with an attribute, to be used as element to be checked for word cloud, e.g \'artist\' will look for \'artist\' key in JSON graph to define as word cloud attribute.',
        textArea: true,
        negative: {
            title: 'Go back'
        },
        positive: {
            title: 'Create',
            onClick: function(e) {
              // console.log(document.getElementsByTagName("textarea"));
              var text = document.getElementsByTagName("textarea");
              var createWordCloud = undefined;
              for(t in text)
              {
                if(text[t].id == "")
                {
                  createWordCloud = text[t];
                }
              }
              createWordCloudFile(createWordCloud);
            }
        }
    });
});

/** Toggle between showing all coarsened graphs in the hierarchy or just most coarsened */
$("#toggleLayout").on('click', function(){
  $.ajax({
    url: '/graph/getConfFile',
    type: 'POST',
    success: function(data) {
      $.ajax({
        url: '/graph/getMostCoarsenedGraph',
        type: 'POST',
        // data: { graphName: JSON.parse($("#jsonTextArea")[0].value).filename.split(".")[0], firstSetLevel: parseInt(JSON.parse($("#jsonTextArea")[0].value).max_levels[0]), secondSetLevel: parseInt(JSON.parse($("#jsonTextArea")[0].value).max_levels[1]), onlyCoarsest: parseInt(layout.onlyCoarsest) == 1 ? 0 : 1 },
        data: { graphName: JSON.parse($("#jsonTextArea")[0].value).filename.split(".")[0], firstSetLevel: parseInt(JSON.parse(data).conf.total_levels[0]), secondSetLevel: parseInt(JSON.parse(data).conf.total_levels[1]), onlyCoarsest: parseInt(layout.onlyCoarsest) == 1 ? 0 : 1 },
        success: function(html) {
          graphUpdate(html);
        }
      });
    }
  });
});

/** Clear data table on click */
$("#clearTable1").on('click', function(){
  $("#divVertexInfoTable").css('visibility', 'hidden');
  vueTableHeader._data.headers = "";
  vueTableRows._data.rows = "";
});

$("#clearTable2").on('click', function(){
  $("#divVertexInfoTableSecondLayer").css('visibility', 'hidden');
  vueTableHeaderSecondLayer._data.headers = "";
  vueTableRowsSecondLayer._data.rows = "";
});

/** Clear histogram card */
$("#clearTableVertexStats").on('click', function(){
  $("#vertexStatsCard").css('visibility', 'hidden');
});

/** Clear word cloud card */
$("#wordCloudCard").on('click', function(){
  $("#wordCloudCard").css('visibility', 'hidden');
});

/** Show text area to define label on click */
$("#defineUserLabel").on('click', function(){
  var meta = 'label';
  showDialog({
        title: 'Define user label',
        metaTitle: meta,
        text: 'Create a .txt file with a label, from vertex attributes, to be used as color coding for vertexes.',
        textArea: true,
        negative: {
            title: 'Go back'
        },
        positive: {
            title: 'Create',
            onClick: function(e) {
              var text = document.getElementsByTagName("textarea");
              var createLabel = undefined;
              for(t in text)
              {
                if(text[t].id == "")
                {
                  createLabel = text[t];
                }
              }
              createLabelFile(createLabel);
            }
        }
    });
});

/** Use user defined label to create 'colors.json' file and associate it with vertice colors */
$("#useLabel").on('click', function(){
  $.ajax({
    url: 'graph/createGraphColors',
    type: 'POST',
    success: function(html){
      $.ajax({
        url: 'graph/getMostCoarsenedGraph',
        type: 'POST',
        data: { graphName: JSON.parse($("#jsonTextArea")[0].value).filename.split(".")[0] },
        success: function(html){
          graphUpdate(html, layout.lay);
        },
        xhr: loadGraph
      });
    },
    xhr: loadGraph
  });
});

/** Open a bigger mdl-card showing entire word cloud */


/** Trigger upload-input element click */
$("#loadGraphButton").on('click', function (){
    $('#upload-input').click();
    $('.progress-bar').text('0%');
    $('.progress-bar').width('0%');
});

/** Define label */
// $("#defineLabel").on('click', function(){
//   var defineLabel = $.ajax({
//     url: 'graph/defineLabel',
//     type: 'POST',
//     /** FIXME - NEVER NEVER EVER use async! */
//     async: false,
//     success: function(){
//       console.log("entrou nesse success");
//       $.ajax({
//         url: 'graph/createGraphColors',
//         type: 'POST',
//         /** FIXME - NEVER NEVER EVER use async! */
//         async: false,
//         success: function(){
//           alert('Color scheme for label successfully created! Saved as \'colors.json\' file.');
//         },
//         xhr: loadGraph
//       });
//     },
//     xhr: loadGraph
//   });
  // defineLabel.done(function(){
  //   $.ajax({
  //     url: 'graph/createGraphColors',
  //     type: 'POST',
  //     /** FIXME - NEVER NEVER EVER use async! */
  //     async: false,
  //     success: function(){
  //       alert('Color scheme for label successfully created! Saved as \'colors.json\' file.');
  //     },
  //     xhr: loadGraph
  //   });
  // });
// });

/** */
$("#coarseJson").on('click', function(){
  $("#jsonInput").css('visibility', 'hidden');
})

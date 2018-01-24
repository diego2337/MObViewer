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

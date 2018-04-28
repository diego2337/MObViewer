/**
  * @ File to watch for clicks in buttons used for saving either .png graph image or .json file.
  * @author Diego Cintra
  * Date: 06/12/2017
  */

/** Trigger image saving when button is clicked */
$('#saveImgButton').on('click', function (){
  capture = true;
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

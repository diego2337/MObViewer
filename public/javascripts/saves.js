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

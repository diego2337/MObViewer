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

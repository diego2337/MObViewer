/**
 * @desc Javascript file containing HTML components, defined using Vue.js.
 * @author Diego Cintra
 * 17 November 2018
 */

/** Register 'mdl-aside' component */
Vue.component('mdl-aside', {
  template: `
    <aside>
      <slot></slot>
    </aside>
  `
})

/** Register 'mdl-icon' component */
Vue.component('mdl-icon', {
 props: ['icon', 'tooltip', 'description'],
 template: `
   <button v-bind:id="tooltip" class="mdl-button mdl-button--icon mdl-js-button mdl-js-ripple-effect">
     <i class="material-icons">{{ icon }}</i>
     <div class="layout-lower-case mdl-tooltip" v-bind:for="tooltip">
         {{ description }}
     </div>
   </button>
 `
})

/** Register 'mdl-card' component */
Vue.component('mdl-card', {
 props: ['identification', 'tooltip', 'title'],
 template: `
  <div v-bind:id="identification" class="scrollable-y scrollable-x mdl-card mdl-expandable-card mdl-shadow--2dp">
    <div class="mdl-card__title mdl-card--table__header">
      <h4 class="mdl-card__title-text">{{ title }}</h4>
    </div>
    <slot></slot>
  </div>
 `
})

// <div class="mdl-card__menu">
//   <button v-bind:id="tooltip" class="mdl-button mdl-button--icon mdl-js-button mdl-js-ripple-effect">
//     <i class="material-icons">expand_more</i>
//   </button>
//   <div class="layout-lower-case mdl-tooltip" v-bind:for="tooltip">
//       Minimze/expand card.
//   </div>
// </div>

/** Register 'mdl-button' component */
Vue.component('mdl-button', {
 props: ['identification', 'title', 'description'],
 template: `
   <button v-bind:id="identification" class="mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--raised mdl-button--colored expand-button">
     <span class="mdl-color-text--white ">{{ title }}</span>
     <div class="layout-lower-case mdl-tooltip" v-bind:for="identification">
         {{ description }}
     </div>
   </button>
 `
})

/** Register 'mdl-header' component */
Vue.component('mdl-header', {
 props: ['title'],
 template: `
  <header class="mdl-layout__header">
    <a id="downloadAnchorElem" class="no-display"></a>
    <div class="mdl-layout__header-row">
      <span class="mdl-layout__title">{{ title }}</span>
      <div class="mdl-layout-spacer"></div>
      <slot></slot>
      <button class="mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--icon" id="moreInfo">
        <i class="material-icons">more_vert</i>
      </button>
      <ul class="mdl-menu mdl-js-menu mdl-js-ripple-effect mdl-menu--bottom-right" for="moreInfo">
        <li class="mdl-menu__item">About</li>
        <li class="mdl-menu__item">Contact</li>
        <li class="mdl-menu__item">Legal information</li>
      </ul>
    </div>
  </header>
 `
})

/** Register 'mdl-footer' component */
Vue.component('mdl-footer', {
  props: ['title'],
  template: `
    <footer class="mdl-mini-footer">
      <h6>
         {{ title }}
      </h6>
      <div class="mdl-mini-footer__left-section">
        <slot name="footerLeftSection"></slot>
      </div>
      <div class="mdl-mini-footer__right-section">
        <slot name="footerRightSection"></slot>
      </div>
    </footer>
  `
})

/** Define root Vue instance */
var vueRootInstance = new Vue({
  el: "#container",
  data : {
    /** CSS elements */
    margins: { margin: '10px' },
    margins5: { margin: '5px' },
    floatLeft: { float: 'left' },
    floatRight: { float: 'right' },
    overflowAuto: { overflow: 'auto' },
    absolute: { position: 'absolute' },
    /** HTML elements */
    buttons: [
      { identification: 'jsonInfo', title: 'Define json input', description: 'Toggle between showing or hiding dialog for input parameters.' },
      { identification: 'defineUserLabel', title: 'Define label', description: 'Create a txt file with a label, from vertex attributes, to be used as color coding for vertexes.' },
      // { identification: 'useLabel', title: 'Use label', description: 'Apply (if not already) user defined label in bipartite graph.' },
      { identification: 'defineCategories', title: 'Define data categories', description: 'Create a csv file associating data attributes with their respective types, e.g: attribute1,{categorical|ordinal},{nOfElem|range-range} attribute2,{categorical|ordinal},{nOfElem|range-range}...' },
      { identification: 'defineWordCloud', title: 'Define word cloud attribute', description: 'Create a .txt file associated with an attribute, to be used as element to be checked for word cloud, e.g \'artist\' will look for \'artist\' key in JSON graph to define as word cloud attribute.' },
      { identification: 'toggleLayout', title: 'Toggle layout', description: 'Toggle between showing all levels of the hierarchy or just the most coarsened graph. Default to show only most coarsened level.' },
      { identification: 'userInfo', title: 'Define vertex info', description: 'Define vertex info to be shown on tooltip (to be implemented).' },
      // { identification: 'uploadGraph', title: 'Load graph...', description: 'Upload graph server-side.' },
      { identification: 'saveImgButton', title: 'Save .png...', description: 'Save current graph as .jpg image.'},
      { identification: 'saveFileButton', title: 'Save .json...', description: 'Save most coarsened graph as a .json file.'},
      { identification: 'loadGraphButton', title: 'Load graph...', description: 'Load bipartite graph server side.'}
    ],
    tableCards: [
      { identification: 'divVertexInfoTable', tooltip: 'divVertexInfoTableTooltip', title: 'Vertice info (first layer)', tableId: 'vertexInfoTable', tableHeadId: 'dynamicTableHeaders', tableBodyId: 'dynamicTableRows', headers: [], rows: [] },
      { identification: 'divVertexInfoTableSecondLayer', tooltip: 'divVertexInfoTableSecondLayerTooltip', title: 'Vertice info (second layer)', tableId: 'vertexInfoTableSecondLayer', tableHeadId: 'dynamicTableHeadersSecondLayer', tableBodyId: 'dynamicTableRowsSecondLayer', headers: [], rows: [] }
    ],
    cards: [
      // { identification: 'graphInfo', tooltip: 'graphInfoTooltip', title: 'Graph info' },
      { identification: 'wordCloudCard', tooltip: 'wordCloudCardTooltip', title: 'Word cloud' },
      { identification: 'vertexStatsCard', tooltip: 'vertexStatsCardTooltip', title: 'Frequency histogram' },
      // { identification: 'gradientScale', tooltip: 'gradientScaleTooltip', title: 'Edge weights' },
      // { identification: 'communityLegend', tooltip: 'communityLegendTooltip', title: 'Communities legend' }
    ],
    icons: [
      { icon: 'visibility', tooltip: 'resetButton', description: 'Reset camera to default position.' },
      { icon: 'add', tooltip: 'zoomIn', description: 'Zoom in.' },
      { icon: 'remove', tooltip: 'zoomOut', description: 'Zoom out.' },
      { icon: 'keyboard_arrow_left', tooltip: 'panLeft', description: 'Pan all the way to leftmost part of bipartite graph.' },
      { icon: 'keyboard_arrow_right', tooltip: 'panRight', description: 'Pan all the way to rightmost part of bipartite graph.' },
      { icon: 'loop', tooltip: 'switchLayout', description: 'Switch to either vertical or horizontal bipartite graph layout.' },
    ],
    headers: "",
    rows: "",
    graphInfo: { headers: ['Graph level', 'Vertices', 'Edges', 'First layer', 'Second layer'], rows: [] },
  },
})

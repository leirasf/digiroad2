(function(root) {
  root.NavigationPanel = {
    initialize: initialize
  };

  function initialize(container, searchBox, openProjectsBox, assetControlGroups) {
    var navigationPanel = $('<div class="navigation-panel"></div>');

    navigationPanel.append(searchBox.element);
    navigationPanel.append(openProjectsBox.element);

    var assetControls = _.flatten(assetControlGroups);

    var assetElementDiv = $('<div></div>');
    assetControls.forEach(function(asset) {
      assetElementDiv.append(asset.element);
    });
    navigationPanel.append(assetElementDiv);

    var assetControlMap = _.chain(assetControls)
      .map(function(asset) {
        return [asset.layerName, asset];
      })
      .zipObject()
      .value();

    bindEvents();

    eventbus.on('layer:selected', function selectLayer(layer, previouslySelectedLayer) {
      var previousControl = assetControlMap[previouslySelectedLayer];
      if (previousControl) previousControl.hide();
      assetControlMap[layer].show();
      assetElementDiv.show();
    });

    container.append(navigationPanel);

    function bindEvents() {
      openProjectsBox.button.on('click', function(){
        //TODO get the list of projects to show on VIITE-86
        openProjectsBox.toggle();
      });
    }
    
  }
})(this);

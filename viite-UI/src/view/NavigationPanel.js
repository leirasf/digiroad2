(function(root) {
  root.NavigationPanel = {
    initialize: initialize
  };

  function initialize(container, searchBox, assetSelectionMenu,  assetControlGroups) {
    var navigationPanel = $('<div class="navigation-panel"></div>');

    navigationPanel.append(searchBox.element);
    navigationPanel.append(assetSelectionMenu.element);

    var assetControls = _.flatten(assetControlGroups);

    var assetElementDiv = $('<div></div>');
    assetElementDiv.append(assetSelectionMenu.element);
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

    eventbus.on('layer:selected', function selectLayer(layer, previouslySelectedLayer) {
      var previousControl = assetControlMap[previouslySelectedLayer];
      if (previousControl) previousControl.hide();
      assetControlMap[layer].show();
      assetElementDiv.show();
    });

    container.append(navigationPanel);
    
  }
})(this);

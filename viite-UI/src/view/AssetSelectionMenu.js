(function (root) {
  root.AssetSelectionMenu = function(assetGroups, options) {
    var onSelection = options.onSelect;
    var assetSelection = $('<div class="asset-selection"></div>');

    var assetLinks =
      _.chain(assetGroups)
        .map(function(assets) {
          var assetGroupDiv = $('<div class="asset-group"></div>');
          return assetGroupDiv.append(_.map(assets, function (asset) {
            return $('<div class="radio">').append($('<label>', {
              'for': 'nav-' + asset.layerName,
              text: ' ' + asset.title
            }).prepend($('<input>', {
              type: 'radio',
              name: 'navigation-radio',
              id: 'nav-' + asset.layerName,
              value: asset.layerName
            })));
          }));
        })
        .values()
        .flatten()
        .value();

    assetSelection.append(assetLinks).hide();

    startListening();

    function startListening() {
      assetSelection.on('click', 'input', onClick);
    }

    function ignoringEvents(f) {
      assetSelection.off('click', 'input', onClick);
      f();
      startListening();
    }

    function onClick() {
      hide();
      onSelection($(this).val());
    }

    function toggle() {
      assetSelection.toggle();
    }

    function hide() {
      assetSelection.hide();
    }

    function select(layer) {
      ignoringEvents(function() {
        assetSelection.find('input[value="' + layer + '"]').click();
      });
    }

    return {
      toggle: toggle,
      hide: hide,
      element: assetSelection,
      select: select
    };
  };
})(this);

(function(root) {
  root.MapView = function(map, layers, instructionsPopup) {
    var isInitialized = false;
    var centerMarkerLayer;

    var showAssetZoomDialog = function() {
      instructionsPopup.show('Zoomaa lähemmäksi, jos haluat nähdä kohteita', 2000);
    };

    var minZoomForContent = function() {
      if (applicationModel.getSelectedLayer()) {
        return layers[applicationModel.getSelectedLayer()].minZoomForContent || zoomlevels.minZoomForAssets;
      }
      return zoomlevels.minZoomForAssets;
    };

    var mapMovedHandler = function(mapState) {
      if (mapState.zoom < minZoomForContent()) {
        if (isInitialized && mapState.hasZoomLevelChanged) {
          showAssetZoomDialog();
        }
      }
    };

    var drawCenterMarker = function(position) {
      // var size = new OpenLayers.Size(16, 16);
      // var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h / 2);
      // var icon = new OpenLayers.Icon('./images/center-marker.svg', size, offset);
      //
      // centerMarkerLayer.clearMarkers();
      // var marker = new OpenLayers.Marker(new OpenLayers.LonLat(position.lon, position.lat), icon);
      // centerMarkerLayer.addMarker(marker);
    };

    var addCenterMarkerLayerToMap = function(map) {
      // centerMarkerLayer = new OpenLayers.Layer.Markers('centerMarker');
      // map.addLayer(centerMarkerLayer);
    };

    eventbus.on('application:initialized', function() {
      var zoom = map.getView().getZoom();
      applicationModel.setZoomLevel(zoom);
      if (!zoomlevels.isInAssetZoomLevel(zoom)) {
        showAssetZoomDialog();
      }
      new CrosshairToggle($('.mapplugin.coordinates'));
      isInitialized = true;
      eventbus.trigger('map:initialized', map);
    }, this);

    var setCursor = function(tool) {
      var cursor = {'Select': 'default', 'Add': 'crosshair', 'Cut': 'pointer'};
      $('.olMap').css('cursor', cursor[tool]);
    };

    eventbus.on('tool:changed', function(tool) {
      setCursor(tool);
    });

    eventbus.on('coordinates:selected', function(position) {
      if (geometrycalculator.isInBounds(map.getMaxExtent(), position.lon, position.lat)) {
        map.getView().setCenter([position.lon, position.lat]);
        map.getView().setZoom(zoomlevels.getAssetZoomLevelIfNotCloser(map.getZoom()));
      } else {
        instructionsPopup.show('Koordinaatit eivät osu kartalle.', 3000);
      }
    }, this);

    eventbus.on('map:moved', mapMovedHandler, this);

    eventbus.on('coordinates:marked', drawCenterMarker, this);

    eventbus.on('layer:selected', function selectLayer(layer, previouslySelectedLayer) {
      var layerToBeHidden = layers[previouslySelectedLayer];
      var layerToBeShown = layers[layer];

      if (layerToBeHidden) layerToBeHidden.hide(map);
      layerToBeShown.show(map);
      applicationModel.setMinDirtyZoomLevel(minZoomForContent());
    }, this);

    // map.events.register('moveend', this, function() {
    //   applicationModel.moveMap(map.getZoom(), map.getExtent());
    // });
    //
    // map.events.register('mousemove', map, function(event) {
    //   eventbus.trigger('map:mouseMoved', event);
    // }, true);
    //
    // map.events.register('click', map, function(event) {
    //   eventbus.trigger('map:clicked', { x: event.xy.x, y: event.xy.y });
    // });

    addCenterMarkerLayerToMap(map);

    setCursor(applicationModel.getSelectedTool());
  };
})(this);

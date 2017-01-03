var RoadStyles = function() {
  // var styleMap = new OpenLayers.StyleMap({
  //   "select": new OpenLayers.Style({
  //     strokeWidth: 6,
  //     strokeOpacity: 1,
  //     strokeColor: "#5eaedf"
  //   }),
  //   "default": new OpenLayers.Style({
  //     strokeWidth: 5,
  //     strokeColor: "#a4a4a2",
  //     strokeOpacity: 0.7
  //   })
  // });
  //
  // this.roadStyles = styleMap;
  // styleMap.styles.default.rules.push(new OpenLayers.Rule({
  //   elseFilter: true,
  //   symbolizer: styleMap.styles.default.defaultStyle
  // }));
};

(function(root) {
  root.RoadLayer = function(map, roadCollection) {
    var vectorLayer;
    var selectControl;
    var layerStyleMaps = {};
    var layerStyleMapProviders = {};
    var layerMinContentZoomLevels = {};
    var uiState = { zoomLevel: 9 };

    function stylesUndefined() {
      return _.isUndefined(layerStyleMaps[applicationModel.getSelectedLayer()]) &&
        _.isUndefined(layerStyleMapProviders[applicationModel.getSelectedLayer()]);
    }

    var enableColorsOnRoadLayer = function() {
      if (stylesUndefined()) {
        var administrativeClassStyleLookup = {
          Private: { strokeColor: '#0011bb' },
          Municipality: { strokeColor: '#11bb00' },
          State: { strokeColor: '#ff0000' },
          Unknown: { strokeColor: '#888' }
        };
        vectorLayer.styleMap.addUniqueValueRules('default', 'administrativeClass', administrativeClassStyleLookup);
      }
    };

    var disableColorsOnRoadLayer = function() {
      if (stylesUndefined()) {
        // vectorLayer.styleMap.styles.default.rules = [];
      }
    };

    var changeRoadsWidthByZoomLevel = function() {
      // if (stylesUndefined()) {
      //   var widthBase = 2 + (map.getZoom() - minimumContentZoomLevel());
      //   var roadWidth = widthBase * widthBase;
      //   if (applicationModel.isRoadTypeShown()) {
      //     vectorLayer.styleMap.styles.default.defaultStyle.strokeWidth = roadWidth;
      //     vectorLayer.styleMap.styles.select.defaultStyle.strokeWidth = roadWidth;
      //   } else {
      //     vectorLayer.styleMap.styles.default.defaultStyle.strokeWidth = 5;
      //     vectorLayer.styleMap.styles.select.defaultStyle.strokeWidth = 7;
      //   }
      // }
    };

    var usingLayerSpecificStyleProvider = function(action) {
      if (!_.isUndefined(layerStyleMapProviders[applicationModel.getSelectedLayer()])) {
        vectorLayer.styleMap = layerStyleMapProviders[applicationModel.getSelectedLayer()]();
      }
      action();
    };

    var toggleRoadType = function() {
      if (applicationModel.isRoadTypeShown()) {
        enableColorsOnRoadLayer();
      } else {
        disableColorsOnRoadLayer();
      }
      changeRoadsWidthByZoomLevel();
      // usingLayerSpecificStyleProvider(function() { vectorLayer.redraw(); });
    };

    var minimumContentZoomLevel = function() {
      if (!_.isUndefined(layerMinContentZoomLevels[applicationModel.getSelectedLayer()])) {
        return layerMinContentZoomLevels[applicationModel.getSelectedLayer()];
      }
      return zoomlevels.minZoomForRoadLinks;
    };

    var handleRoadsVisibility = function() {
      if (_.isObject(vectorLayer)) {
        vectorLayer.setVisibility(map.getZoom() >= minimumContentZoomLevel());
      }
    };

    var mapMovedHandler = function(mapState) {
      if (mapState.zoom >= minimumContentZoomLevel()) {
        changeRoadsWidthByZoomLevel();
      } else {
        vectorLayer.removeAllFeatures();
        roadCollection.reset();
      }
      handleRoadsVisibility();
    };

    var drawRoadLinks = function(roadLinks, zoom) {
      uiState.zoomLevel = zoom;
      eventbus.trigger('roadLinks:beforeDraw');
      vectorLayer.clear();
      var features = _.map(roadLinks, function(roadLink) {
        var points = _.map(roadLink.points, function(point) {
          return new ol.geom.Point([point.x, point.y]);
        });
        return new ol.Feature({
          geometry: new ol.geom.LineString(points),
          id: roadLink.id
        });
      });
      usingLayerSpecificStyleProvider(function() {
        vectorLayer.addFeatures(features);
      });
      eventbus.trigger('roadLinks:afterDraw', roadLinks);
    };

    var drawRoadLink = function(roadLink) {
      var points = _.map(roadLink.points, function(point) {
        return new ol.geom.Point([point.x, point.y]);
      });
      var feature = new new ol.Feature({
        geometry: new ol.geom.LineString(points),
        id: roadLink.id
      });
      usingLayerSpecificStyleProvider(function() {
        vectorLayer.addFeature(feature);
      });
    };

    var setLayerSpecificStyleMap = function(layer, styleMap) {
      layerStyleMaps[layer] = styleMap;
      if (applicationModel.getSelectedLayer() === layer) {
        activateLayerStyleMap(layer);
      }
    };

    var addUIStateDependentLookupToStyleMap = function(styleMap, renderingIntent, uiAttribute, lookup) {
      styleMap.addUniqueValueRules(renderingIntent, uiAttribute, lookup, uiState);
    };

    var createZoomLevelFilter = function(zoomLevel) {
      return new ol.format.filter.EqualTo('zoomLevel', uiState.zoomLevel);
    };

    var activateLayerStyleMap = function(layer) {
      vectorLayer.styleMap = layerStyleMaps[layer] || new RoadStyles().roadStyles;
    };

    var setLayerSpecificStyleMapProvider = function(layer, provider) {
      layerStyleMapProviders[layer] = provider;
    };

    var setLayerSpecificMinContentZoomLevel = function(layer, zoomLevel) {
      layerMinContentZoomLevels[layer] = zoomLevel;
    };

    var redraw = function() {
      usingLayerSpecificStyleProvider(function() {
        vectorLayer.redraw();
      });
    };

    var clear = function() {
      vectorLayer.clear();
    };

    var selectRoadLink = function(roadLink) {
      var feature = _.find(vectorLayer.features, function(feature) {
        if (roadLink.linkId) return feature.attributes.linkId === roadLink.linkId;
        else return feature.attributes.roadLinkId === roadLink.roadLinkId;
      });
      selectControl.getFeatures().clear();
      selectControl.setFeatures([feature]);
    };

    eventbus.on('asset:saved asset:updateCancelled asset:updateFailed', function() {
      // selectControl.unselectAll();
    }, this);

    eventbus.on('road-type:selected', toggleRoadType, this);

    eventbus.on('map:moved', mapMovedHandler, this);

    eventbus.on('layer:selected', function(layer) {
      activateLayerStyleMap(layer);
      toggleRoadType();
    }, this);

    vectorLayer = new ol.layer.Vector({
      title: "road",
      style: new RoadStyles().roadStyles
    });
    vectorLayer.setVisible(false);
    selectControl = new ol.interaction.Select({
      layers: [vectorLayer]
    });
    map.addLayer(vectorLayer);
    toggleRoadType();

    return {
      layer: vectorLayer,
      redraw: redraw,
      clear: clear,
      selectRoadLink: selectRoadLink,
      setLayerSpecificStyleMapProvider: setLayerSpecificStyleMapProvider,
      setLayerSpecificStyleMap: setLayerSpecificStyleMap,
      setLayerSpecificMinContentZoomLevel: setLayerSpecificMinContentZoomLevel,
      addUIStateDependentLookupToStyleMap: addUIStateDependentLookupToStyleMap,
      drawRoadLink: drawRoadLink,
      drawRoadLinks: drawRoadLinks,
      createZoomLevelFilter: createZoomLevelFilter,
      uiState: uiState
    };
  };
})(this);

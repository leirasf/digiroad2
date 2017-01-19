(function(root) {
  root.RoadLayer3 = function(map, roadCollection,styler) {
    var vectorLayer;
    var drawRoadLinks = function(roadLinks, zoom) {
      console.log("Draw road links");
    };
    var layerMinContentZoomLevels = {};
    var layerStyleMaps = {};
    var layerStyleMapProviders = {};
    var currentZoom = 0;

    var vectorSource = new ol.source.Vector({
      loader: function(extent, resolution, projection) {
        var zoom = Math.log(1024/resolution) / Math.log(2);
        eventbus.once('roadLinks:fetched', function(roadLinkGroups) {
          var features = _.map(roadCollection.getAll(), function(roadLink) {
            var points = _.map(roadLink.points, function(point) {
              return [point.x, point.y];
            });
            var feature =  new ol.Feature({ geometry: new ol.geom.LineString(points)
            });
            feature.roadLinkData = roadLink;
            feature.setStyle(styler.generateStyleByFeature(feature.roadLinkData, zoom));
            return feature;
          });
          loadFeatures(features);
        });
        roadCollection.fetch(extent.join(','), zoom);
      },
      strategy: ol.loadingstrategy.bbox
    });

    //TODO: Since the creation of the Styler, do we need this?
    function vectorLayerStyle(feature) {
      if (stylesUndefined()) {
        var widthBase = 2 + (map.getView().getZoom() - minimumContentZoomLevel());
        var roadWidth = widthBase * widthBase;
        if (applicationModel.isRoadTypeShown()) {
          return [new ol.style.Style({
            stroke: new ol.style.Stroke({
              width: roadWidth
            })
          })];
        } else {
          return [new ol.style.Style({
            stroke: new ol.style.Stroke({
              width: 5
            })
          })];
        }
      }
    }

    var loadFeatures = function (features) {
      vectorSource.addFeatures(features);
    };

    function stylesUndefined() {
      return _.isUndefined(layerStyleMaps[applicationModel.getSelectedLayer()]) &&
        _.isUndefined(layerStyleMapProviders[applicationModel.getSelectedLayer()]);
    }

    var changeRoadsWidthByZoomLevel = function() {
      if (stylesUndefined()) {
        var widthBase = 2 + (map.getView().getZoom() - minimumContentZoomLevel());
        var roadWidth = widthBase * widthBase;
        if (applicationModel.isRoadTypeShown()) {
          vectorLayer.setStyle({stroke: roadWidth});
        } else {
          vectorLayer.setStyle({stroke: roadWidth});
          vectorLayer.styleMap.styles.default.defaultStyle.strokeWidth = 5;
          vectorLayer.styleMap.styles.select.defaultStyle.strokeWidth = 7;
        }
      }
    };

    var minimumContentZoomLevel = function() {
      if (!_.isUndefined(layerMinContentZoomLevels[applicationModel.getSelectedLayer()])) {
        return layerMinContentZoomLevels[applicationModel.getSelectedLayer()];
      }
      return zoomlevels.minZoomForRoadLinks;
    };

    var handleRoadsVisibility = function() {
      if (_.isObject(vectorLayer)) {
        vectorLayer.setVisible(map.getView().getZoom() >= minimumContentZoomLevel());
      }
    };

    var mapMovedHandler = function(mapState) {
      console.log("map moved");
      console.log("zoom = " + mapState.zoom);
      if (mapState.zoom !== currentZoom) {
        currentZoom = mapState.zoom;
        vectorSource.clear();
      }
      // If zoom changes clear the road list
      // if (mapState.zoom >= minimumContentZoomLevel()) {
      //
      //   vectorLayer.setVisible(true);
      //   changeRoadsWidthByZoomLevel();
      // } else {
      //   vectorLayer.clear();
      //   roadCollection.reset();
      // }
      handleRoadsVisibility();
    };


    vectorLayer = new ol.layer.Vector({
      source: vectorSource,
      style: vectorLayerStyle
    });
    vectorLayer.setVisible(true);
    map.addLayer(vectorLayer);

    eventbus.on('map:moved', mapMovedHandler, this);

    return {
      layer: vectorLayer
    };
  };
})(this);

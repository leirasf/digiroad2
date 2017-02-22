(function(root) {
  root.Layer = function(layerName, roadLayer) {
    var me = this;

    var mapOverLinkMiddlePoints = function(links, transformation) {
      return _.map(links, function(link) {
        var points = _.map(link.points, function(point) {
          return new ol.geom.Point(point.x, point.y);
        });
        var lineString = new OpenLayers.Geometry.LineString(points);
        var middlePoint = GeometryUtils.calculateMidpointOfLineString(lineString);
        return transformation(link, middlePoint);
      });
    };

    this.eventListener = _.extend({running: false}, eventbus);
    this.refreshView = function() {};
    this.isDirty = function() { return false; };
    this.layerStarted = function() {};
    this.removeLayerFeatures = function() {};
    this.isStarted = function() {
      return me.eventListener.running;
    };
    this.activateSelection = function() {
      me.selectControl.activate();
    };
    this.deactivateSelection = function() {
      me.selectControl.deactivate();
    };
    this.start = function(event) {
      if (!me.isStarted()) {
        me.activateSelection();
        me.eventListener.running = true;
        me.layerStarted(me.eventListener);
        me.refreshView(event);
      }
    };
    this.stop = function() {
      if (me.isStarted()) {
        me.removeLayerFeatures();
        me.deactivateSelection();
        me.eventListener.stopListening(eventbus);
        me.eventListener.running = false;
      }
    };
    this.displayConfirmMessage = function() { new Confirm(); };
    this.handleMapMoved = function(state) {
      if (state.selectedLayer === layerName && state.zoom >= me.minZoomForContent) {
        if (!me.isStarted()) {
          me.start('moved');
        }
        else {
          me.refreshView('moved');
        }
      } else {
        me.stop();
      }
    };
    this.drawSigns = function(layer, roadLinks) {
      var signs = mapOverLinkMiddlePoints(roadLinks, function(link, middlePoint) {
        var attributes = _.merge({}, link, { rotation: 0 });
        return new OpenLayers.Feature.Vector(new ol.geom.Point(middlePoint.x, middlePoint.y), attributes);
      });

      layer.addFeatures(signs);
    };
    this.drawRoadNumberMarkers = function(layer, roadLinks) {
      // var groupedLinks = _.groupBy(roadLinks, 'roadPartNumber');
      // var midpoint = _.map(groupedLinks, function(n, links) {
      //   var x = _.flatMap(links, function(link) {
      //     return link.points.x;
      //   });
      //   var y = _.flatMap(links, function(link) {
      //     return link.points.x;
      //   });
      //   return {x: x, y: y, text: links[0].roadNumber + ' / ' + links[0].roadPartNumber };
      // });
      // var markers = _.map(midpoint, function (rno, middlePoint) {
      //   return new OpenLayers.Feature.Vector(ol.geom.Point(middlePoint.x, middlePoint.y), {label: middlePoint.text});
      // });
      // layer.addFeatures(markers);
    };
    this.drawCalibrationMarkers = function(layer, roadLinks) {
      var calibrationPoints = _.flatten(_.filter(roadLinks, function(roadLink) {
        return roadLink.calibrationPoints.length > 0;
      }).map(function(roadLink) {
        return roadLink.calibrationPoints;
      }));
      return _.filter(calibrationPoints, function(cp){
        return cp.point !== undefined;
      });
    };

    this.mapOverLinkMiddlePoints = mapOverLinkMiddlePoints;
    this.show = function(map) {
      eventbus.on('map:moved', me.handleMapMoved);
      if (map.getZoom() >= me.minZoomForContent) {
        me.start('shown');
      }
    };
    this.hide = function() {
      //roadLayer.clear();
      layer.clear();
      eventbus.off('map:moved', me.handleMapMoved);
    };

  };
})(this);

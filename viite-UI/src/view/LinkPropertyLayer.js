(function(root) {
  root.LinkPropertyLayer = function(map, roadLayer, selectedLinkProperty, roadCollection, linkPropertiesModel, applicationModel,styler) {
    var layerName = 'linkProperty';
    var cachedLinkPropertyMarker = null;
    var cachedMarker = null;
    Layer.call(this, layerName, roadLayer);
    var me = this;
    var eventListener = _.extend({running: false}, eventbus);
    var zoom = 7;
    this.minZoomForContent = zoomlevels.minZoomForRoadLinks;
    var indicatorVector = new ol.source.Vector({});
    var floatingMarkerVector = new ol.source.Vector({});
    var anomalousMarkerVector = new ol.source.Vector({});
    var calibrationPointVector = new ol.source.Vector({});

    var indicatorLayer = new ol.layer.Vector({
      source: indicatorVector
    });

    var floatingMarkerLayer = new ol.layer.Vector({
      source: floatingMarkerVector
    });

    var anomalousMarkerLayer = new ol.layer.Vector({
      source: anomalousMarkerVector
    });

    var calibrationPointLayer = new ol.layer.Vector({
      source: calibrationPointVector
    });

    map.addLayer(floatingMarkerLayer);
    map.addLayer(anomalousMarkerLayer);
    map.addLayer(calibrationPointLayer);
    map.addLayer(indicatorLayer);
    floatingMarkerLayer.setVisible(true);
    anomalousMarkerLayer.setVisible(true);
    calibrationPointLayer.setVisible(true);
    indicatorLayer.setVisible(true);

    var isAnomalousById = function(featureId){
      var anomalousMarkers = anomalousMarkerLayer.getSource().getFeatures();
      return !_.isUndefined(_.find(anomalousMarkers, function(am){
        return am.id === featureId;
      }));
    };

    var isFloatingById = function(featureId){
      var floatingMarkers = floatingMarkerLayer.getSource().getFeatures();
      return !_.isUndefined(_.find(floatingMarkers, function(fm){
        return fm.id === featureId;
      }));
    };

    /**
     * We declare the type of interaction we want the map to be able to respond.
     * A selected feature is moved to a new/temporary layer out of the default roadLayer.
     * This interaction is restricted to a double click.
     * @type {ol.interaction.Select}
     */
    var selectDoubleClick = new ol.interaction.Select({
      //Multi is the one en charge of defining if we select just the feature we clicked or all the overlaping
      //multi: true,
      //This will limit the interaction to the specific layer, in this case the layer where the roadAddressLinks are drawn
      layer: roadLayer.layer,
      //Limit this interaction to the doubleClick
      condition: ol.events.condition.doubleClick,
      //The new/temporary layer needs to have a style function as well, we define it here.
      style: function(feature) {
          return styler.generateStyleByFeature(feature.roadLinkData,map.getView().getZoom());
      }
    });

    //We add the defined interaction to the map.
    map.addInteraction(selectDoubleClick);

    /**
     * We now declare what kind of custom actions we want when the interaction happens.
     * Note that 'select' is triggered when a feature is either selected or deselected.
     * The event holds the selected features in the events.selected and the deselected in event.deselected.
     */

    /*var selectRoadLink = function(feature) {
     if(typeof feature.attributes.linkId !== 'undefined' && !applicationModel.isActiveButtons()) {
     if (selectedLinkProperty.getFeaturesToKeep().length === 0) {
     selectedLinkProperty.open(feature.attributes.linkId, feature.attributes.id, feature.singleLinkSelect);
     } else {
     selectedLinkProperty.open(feature.attributes.linkId, feature.attributes.id, true);
     }
     unhighlightFeatures();
     currentRenderIntent = 'select';
     roadLayer.redraw();
     highlightFeatures();
     if(selectedLinkProperty.getFeaturesToKeep().length > 1){
     var floatingMinusLast = _.initial(selectedLinkProperty.getFeaturesToKeep());
     floatingMinusLast.forEach(function (fml){
     highlightFeatureByLinkId(fml.linkId);
     });
     var floatingMinusFirst = _.rest(selectedLinkProperty.getFeaturesToKeep());
     floatingMinusFirst.forEach(function (fmf){
     editFeatureDataForGreen(fmf.linkId);
     });
     }
     }
     };

     var unselectRoadLink = function() {
     currentRenderIntent = 'default';
     selectedLinkProperty.close();
     _.map(roadLayer.layer.features,function (feature){
     if(feature.data.gapTransfering) {
     feature.data.gapTransfering = false;
     feature.attributes.gapTransfering = false;
     feature.data.anomaly = feature.data.prevAnomaly;
     feature.attributes.anomaly = feature.attributes.prevAnomaly;
     }
     });
     roadLayer.redraw();
     indicatorLayer.clearMarkers();
     unhighlightFeatures();
     };

     var unselectAllRoadLinks = function(options) {
     // we'll want an option to supress notification here
     var layers = this.layers || [this.layer],
     layer, feature, l, numExcept;
     for(l=0; l<layers.length; ++l) {
     layer = layers[l];
     numExcept = 0;
     //layer.selectedFeatures is null when layer is destroyed and
     //one of it's preremovelayer listener calls setLayer
     //with another layer on this control
     if(layer.selectedFeatures !== null) {
     if(applicationModel.isActiveButtons() && layer.selectedFeatures.length > numExcept)
     {
     return Confirm();
     }else {
     while (layer.selectedFeatures.length > numExcept) {
     feature = layer.selectedFeatures[numExcept];
     if (!options || options.except != feature) {
     this.unselect(feature);
     } else {
     ++numExcept;
     }
     }
     }
     }
     }
     };


     */
    selectDoubleClick.on('select',function(event) {
      //var visibleFeatures = getVisibleFeatures(true, true, false);
      var visibleFeatures = getVisibleFeatures(true, true, true);
      if(selectSingleClick.getFeatures().getLength() !== 0){
        selectSingleClick.getFeatures().clear();
      }
      //Since the selected features are moved to a new/temporary layer we just need to reduce the roadlayer's opacity levels.
      if (event.selected.length !== 0) {
        if (roadLayer.layer.getOpacity() === 1) {
          roadLayer.layer.setOpacity(0.2);
          floatingMarkerLayer.setOpacity(0.2);
          anomalousMarkerLayer.setOpacity(0.2);

        }
        selectedLinkProperty.close();
        var selection = _.find(event.selected, function(selectionTarget){
          return !_.isUndefined(selectionTarget.roadLinkData);
        });
        selectedLinkProperty.open(selection.roadLinkData.linkId, selection.roadLinkData.id, true, visibleFeatures);
      } else if (event.selected.length === 0 && event.deselected.length !== 0){
        selectedLinkProperty.close();
        roadLayer.layer.setOpacity(1);
        floatingMarkerLayer.setOpacity(1);
        anomalousMarkerLayer.setOpacity(1);
        indicatorLayer.getSource().clear();
      }
    });

    //This will control the double click zoom when there is no selection
    map.on('dblclick', function(event) {
      _.defer(function(){
        if(selectDoubleClick.getFeatures().getLength() < 1 && map.getView().getZoom() <= 13){
          map.getView().setZoom(map.getView().getZoom()+1);
        }
      });
    });

    /**
     * We declare the type of interaction we want the map to be able to respond.
     * A selected feature is moved to a new/temporary layer out of the default roadLayer.
     * This interaction is restricted to a single click (there is a 250 ms enforced
     * delay between single clicks in order to diferentiate from double click).
     * @type {ol.interaction.Select}
     */
    var selectSingleClick = new ol.interaction.Select({
      //Multi is the one en charge of defining if we select just the feature we clicked or all the overlaping
      //multi: true,
      //This will limit the interaction to the specific layer, in this case the layer where the roadAddressLinks are drawn
      layer: [roadLayer.layer, floatingMarkerLayer, anomalousMarkerLayer],
      //Limit this interaction to the singleClick
      condition: ol.events.condition.singleClick,
      //The new/temporary layer needs to have a style function as well, we define it here.
      style: function(feature, resolution) {
        return styler.generateStyleByFeature(feature.roadLinkData,map.getView().getZoom());
      }
    });

    //We add the defined interaction to the map.
    map.addInteraction(selectSingleClick);

    /**
     * We now declare what kind of custom actions we want when the interaction happens.
     * Note that 'select' is triggered when a feature is either selected or deselected.
     * The event holds the selected features in the events.selected and the deselected in event.deselected.
     *
     * In this particular case we are fetching every roadLinkAddress and anomaly marker in view and
     * sending them to the selectedLinkProperty.open for further processing.
     */
    selectSingleClick.on('select',function(event) {
      //var visibleFeatures = getVisibleFeatures(true,true,false);
      var visibleFeatures = getVisibleFeatures(true,true,true);
      if (selectDoubleClick.getFeatures().getLength() !== 0) {
        selectDoubleClick.getFeatures().clear();
      }
      var selection = _.find(event.selected, function (selectionTarget) {
        return !_.isUndefined(selectionTarget.roadLinkData);
      });
      //Since the selected features are moved to a new/temporary layer we just need to reduce the roadlayer's opacity levels.
      if (!_.isUndefined(selection)) {
        if (event.selected.length !== 0) {
          if (roadLayer.layer.getOpacity() === 1) {
            roadLayer.layer.setOpacity(0.2);
            floatingMarkerLayer.setOpacity(0.2);
            anomalousMarkerLayer.setOpacity(0.2);
          }
          selectedLinkProperty.close();
          if(isAnomalousById(selection.id) || isFloatingById(selection.id)){
            selectedLinkProperty.open(selection.roadLinkData.linkId, selection.roadLinkData.id, true, visibleFeatures);
          } else {
            selectedLinkProperty.open(selection.roadLinkData.linkId, selection.roadLinkData.id, false, visibleFeatures);
          }
        }
      } else if (event.selected.length === 0 && event.deselected.length !== 0) {
        selectedLinkProperty.close();
        roadLayer.layer.setOpacity(1);
        floatingMarkerLayer.setOpacity(1);
        anomalousMarkerLayer.setOpacity(1);
        calibrationPointLayer.setOpacity(1);
        indicatorLayer.getSource().clear();
      }
    });

    /**
     * Simple method that will add various open layers 3 features to a selection.
     * @param ol3Features
     */
    var addFeaturesToSelection = function (ol3Features) {
      _.each(ol3Features, function(feature){
        selectSingleClick.getFeatures().push(feature);
      });
    };

    /**
     * Event triggred by the selectedLinkProperty.open() returning all the open layers 3 features
     * that need to be included in the selection.
     */
    eventbus.on('linkProperties:ol3Selected',function(ol3Features){
      selectSingleClick.getFeatures().clear();
      addFeaturesToSelection(ol3Features);
    });

    var getVisibleFeatures = function(withRoads, withAnomalyMarkers, withFloatingMarkers){
      var extent = map.getView().calculateExtent(map.getSize());
      var visibleRoads = withRoads ? roadLayer.layer.getSource().getFeaturesInExtent(extent) : [];
      var visibleAnomalyMarkers =  withAnomalyMarkers ? anomalousMarkerLayer.getSource().getFeaturesInExtent(extent) : [];
      var visibleFloatingMarkers =  withFloatingMarkers ? floatingMarkerLayer.getSource().getFeaturesInExtent(extent) : [];
      return visibleRoads.concat(visibleAnomalyMarkers).concat(visibleFloatingMarkers);
    };

    var highlightFeatureByLinkId = function (linkId) {
      _.each(roadLayer.layer.features, function(x) {
        if(x.attributes.linkId == linkId){
          selectControl.highlight(x);
        }
      });
    };

    /*var unhighlightFeatures = function() {
      _.each(roadLayer.layer.features, function(x) {
        selectControl.unhighlight(x);
      });
    };*/

    /**
     * This is remove all the features from all the selections.
     */
    var clearHighlights = function(){
      if(selectDoubleClick.getFeatures().getLength() !== 0){
        selectDoubleClick.getFeatures().clear();
      }
      if(selectSingleClick.getFeatures().getLength() !== 0){
        selectSingleClick.getFeatures().clear();
      }
    };

    var clearLayers = function(){
      floatingMarkerLayer.getSource().clear();
      anomalousMarkerLayer.getSource().clear();
      calibrationPointLayer.getSource().clear();
      indicatorLayer.getSource().clear();
    };

    /**
     * This will remove all the following interactions from the map:
     * -selectDoubleClick
     * -selectSingleClick
     */
    var deactivateSelection = function() {
      map.removeInteraction(selectDoubleClick);
      map.removeInteraction(selectSingleClick);
    };

    /**
     * This will add all the following interactions from the map:
     * -selectDoubleClick
     * -selectSingleClick
     */
    var activateSelection = function () {
      map.addInteraction(selectDoubleClick);
      map.addInteraction(selectSingleClick);
    };

	var unselectRoadLink = function() {
      selectedLinkProperty.close();
      clearHighlights();
      indicatorLayer.getSource().clear();
    };

	
    var highlightFeatures = function() {
      clearHighlights();
      var featuresToHighlight = [];
      _.each(roadLayer.layer.features, function(x) {
        var gapTransfering = x.data.gapTransfering;
        var canIHighlight = !_.isUndefined(x.attributes.linkId) ? selectedLinkProperty.isSelectedByLinkId(x.attributes.linkId) : selectedLinkProperty.isSelectedById(x.attributes.id);
        if(gapTransfering || canIHighlight){
          featuresToHighlight.push(x);
        }
      });
      if(featuresToHighlight.length !== 0)
        addFeaturesToSelection(featuresToHighlight);
    };


    /*var draw = function(action, changedTargetIds) {
     cachedLinkPropertyMarker = new LinkPropertyMarker(selectedLinkProperty);
     cachedMarker = new LinkPropertyMarker(selectedLinkProperty);
     var roadLinks = [];
     if(!applicationModel.isActiveButtons() && window.eventbus.on('map:moved')) {
     prepareRoadLinkDraw();
     }
     if(!_.isUndefined(action) && _.isEqual(action, applicationModel.actionCalculated)){
     roadLinks = roadCollection.getAllTmp();
     } else {
     roadLinks = roadCollection.getAll();
     }
     if(!_.isUndefined(action) && _.isEqual(action, applicationModel.actionCalculating))
     _.each(roadLinks, function(roadlink){
     if(!_.isUndefined(roadlink.gapTransfering) && roadlink.gapTransfering === true){
     roadlink.gapTransfering = null;
     }
     });*/
    var draw = function() {
      cachedLinkPropertyMarker = new LinkPropertyMarker(selectedLinkProperty);
      cachedMarker = new LinkPropertyMarker(selectedLinkProperty);
      deactivateSelection();
      var roadLinks = roadCollection.getAll();

      if(floatingMarkerLayer.getSource() !== null)
        floatingMarkerLayer.getSource().clear();
      if(anomalousMarkerLayer.getSource() !== null)
        anomalousMarkerLayer.getSource().clear();

      if(zoom > zoomlevels.minZoomForAssets) {
        var floatingRoadMarkers = _.filter(roadLinks, function(roadlink) {
          return roadlink.roadLinkType === -1;
        });

        var anomalousRoadMarkers = _.filter(roadLinks, function(roadlink) {
          return roadlink.anomaly === 1;
        });

        _.each(floatingRoadMarkers, function(floatlink) {
          var marker = cachedLinkPropertyMarker.createMarker(floatlink);
          floatingMarkerLayer.getSource().addFeature(marker);
        });
        /*_.each(floatingRoadMarkers, function(floatlink) {
         var sources = !_.isEmpty(selectedLinkProperty.getSources()) ? selectedLinkProperty.getSources() : selectedLinkProperty.get();
         var source = sources.find(function(s){
         return s.linkId === floatlink.linkId ;
         });
         var tempFlag = roadCollection.getAllTmp().find(function(road){
         return road.linkId === floatlink.linkId;
         });

         if((_.isUndefined(tempFlag) || _.isUndefined(source))){
         var mouseClickHandler = createMouseClickHandler(floatlink);
         var marker = cachedLinkPropertyMarker.createMarker(floatlink);
         marker.events.register('click',marker, mouseClickHandler);
         marker.events.registerPriority('dblclick',marker, mouseClickHandler);
         floatingMarkerLayer.addMarker(marker);
         }
         });*/

        _.each(anomalousRoadMarkers, function(anomalouslink) {
          var marker = cachedMarker.createMarker(anomalouslink);
          anomalousMarkerLayer.getSource().addFeature(marker);
          /*
          * _.each(anomalousRoadMarkers, function(anomalouslink) {
           var targets =selectedLinkProperty.getTargets();
           var target = targets.find(function(s){
           return s.linkId === anomalouslink.linkId ;
           });
           if((_.isUndefined(target))){
           var mouseClickHandler = createMouseClickHandler(anomalouslink);
           var marker = cachedMarker.createMarker(anomalouslink);
           marker.events.register('click',marker, mouseClickHandler);
           marker.events.registerPriority('dblclick',marker, mouseClickHandler);
           anomalousMarkerLayer.addMarker(marker);
           }
           });
          * */
        });
      }

      if (zoom > zoomlevels.minZoomForAssets) {
        var actualPoints =  me.drawCalibrationMarkers(calibrationPointLayer.source, roadLinks);
        _.each(actualPoints, function(actualPoint) {
          var calMarker = new CalibrationPoint(actualPoint.point);
          calibrationPointLayer.getSource().addFeature(calMarker.getMarker(true));
        });
      }
      activateSelection();
      eventbus.trigger('linkProperties:available');
    };

    /*
    * var createMouseClickHandler = function(floatlink) {
     return function(event){
     selectControl.unselectAll();
     var feature = _.find(roadLayer.layer.features, function (feat) {
     return feat.attributes.linkId === floatlink.linkId;
     });
     if(event.type === 'click' || event.type === 'dblclick'){
     selectControl.select(_.assign({singleLinkSelect: true}, feature));
     } else {
     selectControl.unselectAll();
     }
     };
     };*/
    this.refreshView = function() {
      roadCollection.fetch(map.getExtent(), 11);
      roadLayer.layer.changed();
    };

    this.isDirty = function() {
      return selectedLinkProperty.isDirty();
    };

    var vectorLayer = new ol.layer.Vector();
    vectorLayer.setOpacity(1);
    vectorLayer.setVisible(true);

    var getSelectedFeatures = function() {
      return _.filter(roadLayer.layer.features, function (feature) {
        return selectedLinkProperty.isSelectedByLinkId(feature.attributes.linkId);
      });
    };

    var reselectRoadLink = function() {
      me.activateSelection();
      var originalOnSelectHandler = selectControl.onSelect;
      selectControl.onSelect = function() {};
      var features = getSelectedFeatures();
      var indicators = jQuery.extend(true, [], indicatorLayer.markers);
      indicatorLayer.getSource().clear();
      if(indicators.length !== 0){
        _.forEach(indicators, function(indicator){
          indicatorLayer.addMarker(createIndicator(indicator.bounds, indicator.div.innerText));
        });
      }
      if (!_.isEmpty(features)) {
        selectControl.select(_.first(features));
        highlightFeatures();
      }
      selectControl.onSelect = originalOnSelectHandler;
      if (selectedLinkProperty.isDirty()) {
        me.deactivateSelection();
      }
    };

    var handleLinkPropertyChanged = function(eventListener) {
      deactivateSelection();
      eventListener.stopListening(eventbus, 'map:clicked', me.displayConfirmMessage);
      eventListener.listenTo(eventbus, 'map:clicked', me.displayConfirmMessage);
    };

    var concludeLinkPropertyEdit = function(eventListener) {
      activateSelection();
      eventListener.stopListening(eventbus, 'map:clicked', me.displayConfirmMessage);
      roadLayer.layer.setOpacity(1);
      floatingMarkerLayer.setOpacity(1);
      anomalousMarkerLayer.setOpacity(1);
      //deactivateSelection();
      if(selectDoubleClick.getFeatures().getLength() !== 0){
         selectDoubleClick.getFeatures().clear();
      }
    };

    this.refreshView = function() {
      // Generalize the zoom levels as the resolutions and zoom levels differ between map tile sources
      roadCollection.fetch(map.getExtent(), 11);
      roadLayer.layer.changed();
    };

    var refreshViewAfterSaving = function() {
	    unselectRoadLink();
      me.refreshView();
    };

    this.layerStarted = function(eventListener) {
      indicatorLayer.setZIndex(1000);
      var linkPropertyChangeHandler = _.partial(handleLinkPropertyChanged, eventListener);
      var linkPropertyEditConclusion = _.partial(concludeLinkPropertyEdit, eventListener);
      eventListener.listenTo(eventbus, 'linkProperties:changed', linkPropertyChangeHandler);
      eventListener.listenTo(eventbus, 'linkProperties:cancelled linkProperties:saved', linkPropertyEditConclusion);
      eventListener.listenTo(eventbus, 'linkProperties:saved', refreshViewAfterSaving);
      eventListener.listenTo(eventbus, 'linkProperties:selected linkProperties:multiSelected', function(link) {
        var feature = _.find(roadLayer.layer.features, function(feature) {
          return link.linkId !== 0 && feature.attributes.linkId === link.linkId;
        });
        if (feature) {
          _.each(selectControl.layer.selectedFeatures, function (selectedFeature){
            if(selectedFeature.attributes.linkId !== feature.attributes.linkId) {
              selectControl.select(feature);
            }
          });
        }
      });
      eventListener.listenTo(eventbus, 'linkProperties:reselect', reselectRoadLink);
      eventListener.listenTo(eventbus, 'roadLinks:fetched', draw);
      eventListener.listenTo(eventbus, 'linkProperties:dataset:changed', draw);
      eventListener.listenTo(eventbus, 'linkProperties:updateFailed', cancelSelection);
      eventListener.listenTo(eventbus, 'adjacents:nextSelected', function(sources, adjacents, targets) {
        redrawNextSelectedTarget(targets, adjacents);
        if(applicationModel.getCurrentAction()!==applicationModel.actionCalculated) {
          drawIndicators(adjacents);
          selectedLinkProperty.addTargets(targets, adjacents);
        }
      });

      //eventListener.listenTo(eventbus, 'adjacents:added adjacents:aditionalSourceFound', function(sources,targets){
      //  drawIndicators(targets);
      //});
      eventListener.listenTo(eventbus, 'adjacents:added adjacents:aditionalSourceFound', function(sources,targets, aditionalLinkId){
        drawIndicators(targets);
        _.map(_.rest(selectedLinkProperty.getFeaturesToKeep()), function (roads){
          editFeatureDataForGreen(roads);
          highlightFeatureByLinkId(roads.linkId);
        });
        highlightFeatureByLinkId(aditionalLinkId);
      });
      eventListener.listenTo(eventListener, 'map:clearLayers', clearLayers);
    };

    eventListener.listenTo(eventbus, 'adjacents:roadTransfer', function(newRoads,changedIds){
      var roadLinks = roadCollection.getAll();
      var afterTransferLinks=  _.filter(roadLinks, function(roadlink){
        return !_.contains(changedIds, roadlink.linkId.toString());
      });
      _.map(newRoads, function(road){
        afterTransferLinks.push(road);
      });
      roadCollection.setTmpRoadAddresses(afterTransferLinks);
      applicationModel.setCurrentAction(applicationModel.actionCalculated);
      selectedLinkProperty.cancel(applicationModel.actionCalculated, changedIds);
      roadCollection.setChangedIds(changedIds);
    });

    eventListener.listenTo(eventbus, 'roadLink:editModeAdjacents', function() {
      if (applicationModel.isReadOnly() && !applicationModel.isActiveButtons()) {
        indicatorLayer.getSource().clear();
        var floatingsLinkIds = _.map(_.filter(selectedLinkProperty.getFeaturesToKeep(), function (feature) {
          return feature.roadLinkType == -1;
        }), function (floating) {
          return floating.linkId;
        });
        unselectRoadLink();
        _.defer(function(){
          _.map(roadLayer.layer.features, function (feature) {
            if (_.contains(floatingsLinkIds, feature.attributes.linkId)) {
              selectControl.select(feature);
            }
          });
        });
      } else {
        var selectedFloatings = _.filter(selectedLinkProperty.get(), function(features){
          return features.roadLinkType == -1;
        });
        _.each(selectedFloatings, function(sf){
          selectedLinkProperty.getFeaturesToKeep().push(sf);
        });
      }
    });
    eventListener.listenTo(eventbus, 'roadLinks:deleteSelection', function () {
      prepareRoadLinkDraw();
    });
    eventListener.listenTo(eventbus, 'linkProperties:cancelled', unselectRoadLink);

    var drawIndicators= function(links){
       indicatorLayer.getSource().clear();
       var indicators = me.mapOverLinkMiddlePoints(links, function(link, middlePoint) {
         var IndicatorMarker = createIndicator(middlePoint, link.marker);
         return indicatorLayer.getSource().addFeature(IndicatorMarker);
       });
    };

    var createIndicator = function(middlePoint, marker) {
        var markerIndicator = new ol.Feature({
          geometry: new ol.geom.Point([middlePoint.x, middlePoint.y])
        });

        var style = new ol.style.Style({
          image : new ol.style.Icon({
            src: 'images/center-marker2.svg'
          }),
          text : new ol.style.Text({
            text : marker,
            fill: new ol.style.Fill({
              color: "#ffffff"
            })
          })
        });
        markerIndicator.setStyle(style);
      return markerIndicator;
    };

    var redrawNextSelectedTarget= function(targets, adjacents) {
      _.find(roadLayer.layer.getSource().getFeatures(), function(feature) {
        return targets !== 0 && feature.roadLinkData.linkId === targets;
      }).attributes().gapTransfering = true;
        _.find(roadLayer.layer.getSource().getFeatures(), function(feature) {
        return targets !== 0 && feature.roadLinkData.linkId === targets;
      }).attributes.gapTransfering = true;
      _.find(roadLayer.layer.getSource().getFeatures(), function(feature) {
        return targets !== 0 && feature.roadLinkData.linkId === targets;
      }).data.anomaly = 0;
      _.find(roadLayer.layer.getSource().getFeatures(), function(feature) {
        return targets !== 0 && feature.roadLinkData.linkId === targets;
      }).attributes.anomaly = 0;
      reselectRoadLink();
      draw();
    };

    var editFeatureDataForGreen = function (targets) {
      var features =[];
      if(targets !== 0){
        _.map(roadLayer.layer.getSource(), function(feature){
        if(feature.roadLinkData.linkId == targets){
          feature.attributes.prevAnomaly = feature.attributes.anomaly;
          feature.data.prevAnomaly = feature.data.anomaly;
          feature.attributes.gapTransfering = true;
          feature.data.gapTransfering = true;
          selectedLinkProperty.getFeaturesToKeep().push(feature.data);
          features.push(feature);
         }
      });
    }
     if(features.length === 0)
       return undefined;
      else return _.first(features);
    };

    this.removeLayerFeatures = function() {
      roadLayer.layer.removeFeatures(roadLayer.layer.getFeaturesByAttribute('type', 'overlay'));
      indicatorLayer.clearMarkers();
    };

    var show = function(map) {
      vectorLayer.setVisible(true);
      //eventListener.listenTo(eventbus, 'map:clicked', cancelSelection);
    };

    var cancelSelection = function() {
      selectedLinkProperty.cancel();
      selectedLinkProperty.close();
	    unselectRoadLink();
    };

    var hideLayer = function() {
	    unselectRoadLink();
      me.stop();
      me.hide();
    };

    me.layerStarted(eventListener);

    return {
      show: show,
      hide: hideLayer,
      deactivateSelection: deactivateSelection,
      activateSelection: activateSelection,
      minZoomForContent: me.minZoomForContent
    };
  };
})(this);

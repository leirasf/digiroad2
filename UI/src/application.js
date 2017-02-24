(function(application) {
  application.start = function(customBackend, withTileMaps, isExperimental) {
    var backend = customBackend || new Backend();
    var tileMaps = _.isUndefined(withTileMaps) ?  true : withTileMaps;
    var roadCollection = new RoadCollection(backend);
    var speedLimitsCollection = new SpeedLimitsCollection(backend);
    var selectedSpeedLimit = new SelectedSpeedLimit(backend, speedLimitsCollection);
    var selectedLinkProperty = new SelectedLinkProperty(backend, roadCollection);
    var linkPropertiesModel = new LinkPropertiesModel();
    var manoeuvresCollection = new ManoeuvresCollection(backend, roadCollection);
    var selectedManoeuvreSource = new SelectedManoeuvreSource(manoeuvresCollection);
    var instructionsPopup = new InstructionsPopup($('.digiroad2'));
    var enabledExperimentalAssets = isExperimental ? experimentalLinearAssetSpecs : [];
    var enabledLinearAssetSpecs = linearAssetSpecs.concat(enabledExperimentalAssets);
    var linearAssets = _.map(enabledLinearAssetSpecs, function(spec) {
      var collection = new LinearAssetsCollection(backend, spec.typeId, spec.singleElementEventCategory, spec.multiElementEventCategory);
      var selectedLinearAsset = SelectedLinearAssetFactory.construct(backend, collection, spec);
      return _.merge({}, spec, {
        collection: collection,
        selectedLinearAsset: selectedLinearAsset
      });
    });

    var pointAssets = _.map(pointAssetSpecs, function(spec) {
      var collection = new PointAssetsCollection(backend, spec.layerName);
      var selectedPointAsset = new SelectedPointAsset(backend, spec.layerName);
      return _.merge({}, spec, {
        collection: collection,
        selectedPointAsset: selectedPointAsset
      });
    });

    var selectedMassTransitStopModel = SelectedMassTransitStop.initialize(backend, roadCollection);
    var models = {
      roadCollection: roadCollection,
      speedLimitsCollection: speedLimitsCollection,
      selectedSpeedLimit: selectedSpeedLimit,
      selectedLinkProperty: selectedLinkProperty,
      selectedManoeuvreSource: selectedManoeuvreSource,
      selectedMassTransitStopModel: selectedMassTransitStopModel,
      linkPropertiesModel: linkPropertiesModel,
      manoeuvresCollection: manoeuvresCollection
    };

    bindEvents(enabledLinearAssetSpecs, pointAssetSpecs);
    window.massTransitStopsCollection = new MassTransitStopsCollection(backend);
    window.selectedMassTransitStopModel = selectedMassTransitStopModel;
    var selectedLinearAssetModels = _.pluck(linearAssets, "selectedLinearAsset");
    var selectedPointAssetModels = _.pluck(pointAssets, "selectedPointAsset");
    window.applicationModel = new ApplicationModel([
      selectedMassTransitStopModel,
      selectedSpeedLimit,
      selectedLinkProperty,
      selectedManoeuvreSource]
        .concat(selectedLinearAssetModels)
        .concat(selectedPointAssetModels));

    EditModeDisclaimer.initialize(instructionsPopup);

    var assetGroups = groupAssets(linearAssets,
        pointAssets,
        linkPropertiesModel,
        selectedSpeedLimit,
        selectedMassTransitStopModel);

    var assetSelectionMenu = AssetSelectionMenu(assetGroups, {
      onSelect: function(layerName) {
        window.location.hash = layerName;
      }
    });

    eventbus.on('layer:selected', function(layer) {
      assetSelectionMenu.select(layer);
    });

    NavigationPanel.initialize(
        $('#map-tools'),
        new SearchBox(
            instructionsPopup,
            new LocationSearch(backend, window.applicationModel)
        ),
        new LayerSelectBox(assetSelectionMenu),
        assetGroups
    );

    MassTransitStopForm.initialize(backend);
    SpeedLimitForm.initialize(selectedSpeedLimit);
    WorkListView.initialize(backend);
    backend.getUserRoles();
    backend.getStartupParametersWithCallback(function(startupParameters) {
      backend.getAssetPropertyNamesWithCallback(function(assetPropertyNames) {
        localizedStrings = assetPropertyNames;
        window.localizedStrings = assetPropertyNames;
        startApplication(backend, models, linearAssets, pointAssets, tileMaps, startupParameters);
      });
    });
  };

  var startApplication = function(backend, models, linearAssets, pointAssets, withTileMaps, startupParameters) {
    if (localizedStrings) {
      setupProjections();
      var map = setupMap(backend, models, linearAssets, pointAssets, withTileMaps, startupParameters);
      var selectedPedestrianCrossing = getSelectedPointAsset(pointAssets, 'pedestrianCrossings');
      var selectedTrafficLight = getSelectedPointAsset(pointAssets, 'trafficLights');
      var selectedObstacle = getSelectedPointAsset(pointAssets, 'obstacles');
      var selectedRailwayCrossing =  getSelectedPointAsset(pointAssets, 'railwayCrossings');
      var selectedDirectionalTrafficSign = getSelectedPointAsset(pointAssets, 'directionalTrafficSigns');
      new URLRouter(map, backend, _.merge({}, models,
          { selectedPedestrianCrossing: selectedPedestrianCrossing },
          { selectedTrafficLight: selectedTrafficLight },
          { selectedObstacle: selectedObstacle },
          { selectedRailwayCrossing: selectedRailwayCrossing },
          { selectedDirectionalTrafficSign: selectedDirectionalTrafficSign  }
      ));
      eventbus.trigger('application:initialized');
    }
  };

  var localizedStrings;

  var assetUpdateFailedMessage = 'Tallennus epäonnistui. Yritä hetken kuluttua uudestaan.';
  var tierekisteriFailedMessage = 'Tietojen tallentaminen/muokkaminen Tierekisterissa epäonnistui. Tehtyjä muutoksia ei tallennettu OTH:ssa';
  var tierekisteriFailedMessageDelete = 'Tietojen poisto Tierekisterissä epäonnistui. Pysäkkiä ei poistettu OTH:ssa';
  var vkmNotFoundMessage = 'Sovellus ei pysty tunnistamaan annetulle pysäkin sijainnille tieosoitetta. Pysäkin tallennus Tierekisterissä ja OTH:ssa epäonnistui';
  var notFoundInTierekisteriMessage = 'Huom! Tämän pysäkin tallennus ei onnistu, koska vastaavaa pysäkkiä ei löydy Tierekisteristä tai Tierekisteriin ei ole yhteyttä tällä hetkellä.';

  var indicatorOverlay = function() {
    jQuery('.container').append('<div class="spinner-overlay modal-overlay"><div class="spinner"></div></div>');
  };

  var bindEvents = function(linearAssetSpecs, pointAssetSpecs) {
    var singleElementEventNames = _.pluck(linearAssetSpecs, 'singleElementEventCategory');
    var multiElementEventNames = _.pluck(linearAssetSpecs, 'multiElementEventCategory');
    var linearAssetSavingEvents = _.map(singleElementEventNames, function(name) { return name + ':saving'; }).join(' ');
    var pointAssetSavingEvents = _.map(pointAssetSpecs, function (spec) { return spec.layerName + ':saving'; }).join(' ');
    eventbus.on('asset:saving asset:creating speedLimit:saving linkProperties:saving manoeuvres:saving ' + linearAssetSavingEvents + ' ' + pointAssetSavingEvents, function() {
      indicatorOverlay();
    });

    var fetchedEventNames = _.map(multiElementEventNames, function(name) { return name + ':fetched'; }).join(' ');
    eventbus.on('asset:saved asset:fetched asset:created speedLimits:fetched linkProperties:available manoeuvres:fetched pointAssets:fetched ' + fetchedEventNames, function() {
      jQuery('.spinner-overlay').remove();
    });

    var massUpdateFailedEventNames = _.map(multiElementEventNames, function(name) { return name + ':massUpdateFailed'; }).join(' ');
    eventbus.on('asset:updateFailed asset:creationFailed linkProperties:updateFailed speedLimits:massUpdateFailed ' + massUpdateFailedEventNames, function() {
      jQuery('.spinner-overlay').remove();
      alert(assetUpdateFailedMessage);
    });

    eventbus.on('asset:notFoundInTierekisteri', function() {
      jQuery('.spinner-overlay').remove();
      alert(notFoundInTierekisteriMessage);
    });

    eventbus.on('asset:creationTierekisteriFailed asset:updateTierekisteriFailed', function() {
      jQuery('.spinner-overlay').remove();
      alert(tierekisteriFailedMessage);
    });

    eventbus.on('asset:deleteTierekisteriFailed', function() {
      jQuery('.spinner-overlay').remove();
      alert(tierekisteriFailedMessageDelete);
    });

    eventbus.on('asset:creationNotFoundRoadAddressVKM asset:updateNotFoundRoadAddressVKM', function() {
      jQuery('.spinner-overlay').remove();
      alert(vkmNotFoundMessage);
    });

    eventbus.on('confirm:show', function() { new Confirm(); });
  };

  var createOpenLayersMap = function(startupParameters, layers) {
    var map = new ol.Map({
      target: 'mapdiv',
      layers: layers,
      view: new ol.View({
        center: [startupParameters.lon, startupParameters.lat],
        projection: 'EPSG:3067',
        zoom: startupParameters.zoom,
        resolutions: [2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25, 0.125, 0.0625]
      })
    });
    return map;
  };

  var setupMap = function(backend, models, linearAssets, pointAssets, withTileMaps, startupParameters) {
    var tileMaps = new TileMapCollection(map, "");

    var map = createOpenLayersMap(startupParameters, tileMaps.layers);

    // TODO
    // var NavigationControl = OpenLayers.Class(OpenLayers.Control.Navigation, {
    //   wheelDown: function(evt, delta) {
    //     if (applicationModel.canZoomOut()) {
    //       return OpenLayers.Control.Navigation.prototype.wheelDown.apply(this,arguments);
    //     } else {
    //       new Confirm();
    //     }
    //   }
    // });
    //
    //map.addControl(new NavigationControl());

    var mapOverlay = new MapOverlay($('.container'));

    if (withTileMaps) { new TileMapCollection(map); }
    // var roadLayer = new RoadLayer(map, models.roadCollection);
    var roadLayer = new RoadLayer3(map, models.roadCollection);

    new LinkPropertyForm(models.selectedLinkProperty);
    new ManoeuvreForm(models.selectedManoeuvreSource);
    _.forEach(linearAssets, function(linearAsset) {
     LinearAssetForm.initialize(
       linearAsset.selectedLinearAsset,
       linearAsset.singleElementEventCategory,
       AssetFormElementsFactory.construct(linearAsset),
       linearAsset.newTitle,
       linearAsset.title);
    });

    _.forEach(pointAssets, function(pointAsset) {
     PointAssetForm.initialize(pointAsset.selectedPointAsset, pointAsset.layerName, pointAsset.formLabels);
    });

    var linearAssetLayers = _.reduce(linearAssets, function(acc, asset) {
     acc[asset.layerName] = new LinearAssetLayer({
       map: map,
       application: applicationModel,
       collection: asset.collection,
       selectedLinearAsset: asset.selectedLinearAsset,
       roadCollection: models.roadCollection,
       roadLayer: roadLayer,
       layerName: asset.layerName,
       multiElementEventCategory: asset.multiElementEventCategory,
       singleElementEventCategory: asset.singleElementEventCategory,
       style: PiecewiseLinearAssetStyle(applicationModel),
       formElements: AssetFormElementsFactory.construct(asset)
     });
     return acc;
    }, {});

    var pointAssetLayers = _.reduce(pointAssets, function(acc, asset) {
     acc[asset.layerName] = new PointAssetLayer({
       roadLayer: roadLayer,
       roadCollection: models.roadCollection,
       collection: asset.collection,
       map: map,
       selectedAsset: asset.selectedPointAsset,
       style: PointAssetStyle(asset.layerName),
       mapOverlay: mapOverlay,
       layerName: asset.layerName,
       newAsset: asset.newAsset
     });
     return acc;
    }, {});

    var layers = _.merge({
      road: roadLayer,
      linkProperty: new LinkPropertyLayer(map, roadLayer, models.selectedLinkProperty, models.roadCollection, models.linkPropertiesModel, applicationModel),
       //massTransitStop: new MassTransitStopLayer(map, models.roadCollection, mapOverlay, new AssetGrouping(applicationModel), roadLayer),
       speedLimit: new SpeedLimitLayer({
       map: map,
       application: applicationModel,
       collection: models.speedLimitsCollection,
       selectedSpeedLimit: models.selectedSpeedLimit,
       backend: backend,
       style: SpeedLimitStyle(applicationModel),
       roadLayer: roadLayer
       }),
       manoeuvre: new ManoeuvreLayer(applicationModel, map, roadLayer, models.selectedManoeuvreSource, models.manoeuvresCollection, models.roadCollection)

    }, linearAssetLayers, pointAssetLayers);

    var mapPluginsContainer = $('#map-plugins');
    new ScaleBar(map, mapPluginsContainer);
    new TileMapSelector(mapPluginsContainer);
    new ZoomBox(map, mapPluginsContainer);
    new CoordinatesDisplay(map, mapPluginsContainer);

    // Show environment name next to Digiroad logo
    $('#notification').append(Environment.localizedName());

    // Show information modal in integration environment (remove when not needed any more)
    if (Environment.name() === 'integration') {
      showInformationModal('Huom!<br>Tämä sivu ei ole enää käytössä.<br>Digiroad-sovellus on siirtynyt osoitteeseen <a href="https://extranet.liikennevirasto.fi/digiroad/" style="color:#FFFFFF;text-decoration: underline">https://extranet.liikennevirasto.fi/digiroad/</a>');
    }

    new MapView(map, layers, new InstructionsPopup($('.digiroad2')));

    applicationModel.moveMap(map.getView().getZoom(), map.getLayers().getArray()[0].getExtent());

    return map;
  };

  var setupProjections = function() {
    proj4.defs('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs');
  };

  function getSelectedPointAsset(pointAssets, layerName) {
    return _(pointAssets).find({ layerName: layerName }).selectedPointAsset;
  }

  function groupAssets(linearAssets,
                       pointAssets,
                       linkPropertiesModel,
                       selectedSpeedLimit,
                       selectedMassTransitStopModel) {
    var roadLinkBox = new RoadLinkBox(linkPropertiesModel);
    var massTransitBox = new ActionPanelBoxes.AssetBox(selectedMassTransitStopModel);
    var speedLimitBox = new ActionPanelBoxes.SpeedLimitBox(selectedSpeedLimit);
    var manoeuvreBox = new ManoeuvreBox();

    return [
      [roadLinkBox],
      [].concat(getLinearAsset(assetType.litRoad))
          .concat(getLinearAsset(assetType.pavedRoad))
          .concat(getLinearAsset(assetType.width))
          .concat(getLinearAsset(assetType.numberOfLanes))
          .concat(getLinearAsset(assetType.massTransitLane))
          .concat(getLinearAsset(assetType.europeanRoads))
          .concat(getLinearAsset(assetType.exitNumbers)),
      [speedLimitBox]
          .concat(getLinearAsset(assetType.winterSpeedLimit)),
      [massTransitBox]
          .concat(getPointAsset(assetType.obstacles))
          .concat(getPointAsset(assetType.railwayCrossings))
          .concat(getPointAsset(assetType.directionalTrafficSigns))
          .concat(getPointAsset(assetType.pedestrianCrossings))
          .concat(getPointAsset(assetType.trafficLights))
          .concat(getPointAsset(assetType.servicePoints)),
      [].concat(getLinearAsset(assetType.trafficVolume))
          .concat(getLinearAsset(assetType.congestionTendency))
          .concat(getLinearAsset(assetType.damagedByThaw)),
      [manoeuvreBox]
        .concat(getLinearAsset(assetType.prohibition))
        .concat(getLinearAsset(assetType.hazardousMaterialTransportProhibition))
        .concat(getLinearAsset(assetType.totalWeightLimit))
        .concat(getLinearAsset(assetType.trailerTruckWeightLimit))
        .concat(getLinearAsset(assetType.axleWeightLimit))
        .concat(getLinearAsset(assetType.bogieWeightLimit))
        .concat(getLinearAsset(assetType.heightLimit))
        .concat(getLinearAsset(assetType.lengthLimit))
        .concat(getLinearAsset(assetType.widthLimit)),
      [].concat(getLinearAsset(assetType.maintenanceRoad))
    ];

    function getLinearAsset(typeId) {
      var asset = _.find(linearAssets, {typeId: typeId});
      if (asset) {
        var legendValues = [asset.editControlLabels.disabled, asset.editControlLabels.enabled];
        return [new LinearAssetBox(asset.selectedLinearAsset, asset.layerName, asset.title, asset.className, legendValues)];
      }
      return [];
    }

    function getPointAsset(typeId) {
      var asset = _.find(pointAssets, {typeId: typeId});
      if (asset) {
        return [PointAssetBox(asset.selectedPointAsset, asset.title, asset.layerName, asset.legendValues)];
      }
      return [];
    }
  }

  // Shows modal with message and close button
  function showInformationModal(message) {
    $('.container').append('<div class="modal-overlay confirm-modal" style="z-index: 2000"><div class="modal-dialog"><div class="content">' + message + '</div><div class="actions"><button class="btn btn-secondary close">Sulje</button></div></div></div></div>');
    $('.confirm-modal .close').on('click', function() {
      $('.confirm-modal').remove();
    });
  }

  application.restart = function(backend, withTileMaps) {
    localizedStrings = undefined;
    this.start(backend, withTileMaps);
  };

}(window.Application = window.Application || {}));

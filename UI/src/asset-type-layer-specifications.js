(function(root) {
  root.assetType = {
    totalWeightLimit: 30,
    trailerTruckWeightLimit: 40,
    axleWeightLimit: 50,
    bogieWeightLimit: 60,
    heightLimit: 70,
    lengthLimit: 80,
    widthLimit: 90,
    litRoad: 100,
    pavedRoad: 110,
    width: 120,
    damagedByThaw: 130,
    numberOfLanes: 140,
    congestionTendency: 150,
    massTransitLane: 160,
    trafficVolume: 170,
    winterSpeedLimit: 180,
    prohibition: 190,
    pedestrianCrossings: 200,
    hazardousMaterialTransportProhibition: 210,
    obstacles: 220,
    railwayCrossings: 230,
    directionalTrafficSigns: 240,
    servicePoints: 250,
    europeanRoads: 260,
    exitNumbers: 270,
    trafficLights: 280,
    maintenanceRoad: 290
  };

  root.linearAssetSpecs = [
    {
      typeId: assetType.totalWeightLimit,
      singleElementEventCategory: 'totalWeightLimit',
      multiElementEventCategory: 'totalWeightLimits',
      layerName: 'totalWeightLimit',
      title: 'Suurin sallittu massa',
      newTitle: 'Uusi suurin sallittu massa',
      className: 'total-weight-limit',
      unit: 'kg',
      isSeparable: false,
      editControlLabels: { title: 'Rajoitus',
        enabled: 'Rajoitus',
        disabled: 'Ei rajoitusta' }
    },
    {
      typeId: assetType.trailerTruckWeightLimit,
      singleElementEventCategory: 'trailerTruckWeightLimit',
      multiElementEventCategory: 'trailerTruckWeightLimits',
      layerName: 'trailerTruckWeightLimit',
      title: 'Yhdistelmän suurin sallittu massa',
      newTitle: 'Uusi yhdistelmän suurin sallittu massa',
      className: 'trailer-truck-weight-limit',
      unit: 'kg',
      isSeparable: false,
      editControlLabels: { title: 'Rajoitus',
        enabled: 'Rajoitus',
        disabled: 'Ei rajoitusta' }
    },
    {
      typeId: assetType.axleWeightLimit,
      singleElementEventCategory: 'axleWeightLimit',
      multiElementEventCategory: 'axleWeightLimits',
      layerName: 'axleWeightLimit',
      title: 'Suurin sallittu akselimassa',
      newTitle: 'Uusi suurin sallittu akselimassa',
      className: 'axle-weight-limit',
      unit: 'kg',
      isSeparable: false,
      editControlLabels: { title: 'Rajoitus',
        enabled: 'Rajoitus',
        disabled: 'Ei rajoitusta' }
    },
    {
      typeId: assetType.bogieWeightLimit,
      singleElementEventCategory: 'bogieWeightLimit',
      multiElementEventCategory: 'bogieWeightlLimits',
      layerName: 'bogieWeightLimit',
      title: 'Suurin sallittu telimassa',
      newTitle: 'Uusi suurin sallittu telimassa',
      className: 'bogie-weight-limit',
      unit: 'kg',
      isSeparable: false,
      editControlLabels: { title: 'Rajoitus',
        enabled: 'Rajoitus',
        disabled: 'Ei rajoitusta' }
    },
    {
      typeId: assetType.heightLimit,
      singleElementEventCategory: 'heightLimit',
      multiElementEventCategory: 'heightLimits',
      layerName: 'heightLimit',
      title: 'Suurin sallittu korkeus',
      newTitle: 'Uusi suurin sallittu korkeus',
      className: 'height-limit',
      unit: 'cm',
      isSeparable: false,
      editControlLabels: { title: 'Rajoitus',
        enabled: 'Rajoitus',
        disabled: 'Ei rajoitusta' }
    },
    {
      typeId: assetType.lengthLimit,
      singleElementEventCategory: 'lengthLimit',
      multiElementEventCategory: 'lengthLimits',
      layerName: 'lengthLimit',
      title: 'Suurin sallittu pituus',
      newTitle: 'Uusi pituusrajoitus',
      className: 'length-limit',
      unit: 'cm',
      isSeparable: false,
      editControlLabels: { title: 'Rajoitus',
        enabled: 'Rajoitus',
        disabled: 'Ei rajoitusta' }
    },
    {
      typeId: assetType.widthLimit,
      singleElementEventCategory: 'widthLimit',
      multiElementEventCategory: 'widthLimits',
      layerName: 'widthLimit',
      title: 'Suurin sallittu leveys',
      newTitle: 'Uusi suurin sallittu leveys',
      className: 'width-limit',
      unit: 'cm',
      isSeparable: false,
      editControlLabels: { title: 'Rajoitus',
        enabled: 'Rajoitus',
        disabled: 'Ei rajoitusta' }
    },
    {
      typeId: assetType.litRoad,
      defaultValue: 1,
      singleElementEventCategory: 'litRoad',
      multiElementEventCategory: 'litRoads',
      layerName: 'litRoad',
      title: 'Valaistus',
      newTitle: 'Uusi valaistus',
      className: 'lit-road',
      isSeparable: false,
      editControlLabels: {
        title: 'Valaistus',
        enabled: 'Valaistus',
        disabled: 'Ei valaistusta'
      }
    },
    {
      typeId: assetType.damagedByThaw,
      defaultValue: 1,
      singleElementEventCategory: 'roadDamagedByThaw',
      multiElementEventCategory: 'roadsDamagedByThaw',
      layerName: 'roadDamagedByThaw',
      title: 'Kelirikko',
      newTitle: 'Uusi kelirikko',
      className: 'road-damaged-by-thaw',
      isSeparable: false,
      editControlLabels: {
        title: 'Kelirikko',
        enabled: 'Kelirikko',
        disabled: 'Ei kelirikkoa'
      }
    },
    {
      typeId: assetType.width,
      singleElementEventCategory: 'roadWidth',
      multiElementEventCategory: 'roadWidth',
      layerName: 'roadWidth',
      title: 'Leveys',
      newTitle: 'Uusi leveys',
      className: 'road-width',
      unit: 'cm',
      isSeparable: false,
      editControlLabels: {
        title: 'Leveys',
        enabled: 'Leveys tiedossa',
        disabled: 'Leveys ei tiedossa'
      }
    },
    {
      typeId: assetType.congestionTendency,
      defaultValue: 1,
      singleElementEventCategory: 'congestionTendency',
      multiElementEventCategory: 'congestionTendencies',
      layerName: 'congestionTendency',
      title: 'Ruuhkaantumisherkkyys',
      newTitle: 'Uusi ruuhkautumisherkkä tie',
      className: 'congestion-tendency',
      isSeparable: false,
      editControlLabels: {
        title: 'Herkkyys',
        enabled: 'Ruuhkaantumisherkkä',
        disabled: 'Ei ruuhkaantumisherkkä'
      }
    },
    {
      typeId: assetType.pavedRoad,
      defaultValue: 1,
      singleElementEventCategory: 'pavedRoad',
      multiElementEventCategory: 'pavedRoads',
      layerName: 'pavedRoad',
      title: 'Päällyste',
      newTitle: 'Uusi päällyste',
      className: 'paved-road',
      isSeparable: false,
      editControlLabels: {
        title: 'Päällyste',
        enabled: 'Päällyste',
        disabled: 'Ei päällystettä'
      }
    },
    {
      typeId: assetType.trafficVolume,
      singleElementEventCategory: 'trafficVolume',
      multiElementEventCategory: 'trafficVolumes',
      layerName: 'trafficVolume',
      title: 'Liikennemäärä',
      newTitle: 'Uusi liikennemäärä',
      className: 'traffic-volume',
      unit: 'ajoneuvoa/vuorokausi',
      isSeparable: false,
      editControlLabels: {
        title: '',
        enabled: 'Liikennemäärä',
        disabled: 'Ei tiedossa'
      }
    },
    {
      typeId: assetType.massTransitLane,
      defaultValue: 1,
      singleElementEventCategory: 'massTransitLane',
      multiElementEventCategory: 'massTransitLanes',
      layerName: 'massTransitLanes',
      title: 'Joukkoliikennekaista',
      newTitle: 'Uusi joukkoliikennekaista',
      className: 'mass-transit-lane',
      isSeparable: true,
      editControlLabels: {
        title: 'Kaista',
        enabled: 'Joukkoliikennekaista',
        disabled: 'Ei joukkoliikennekaistaa'
      }
    },
    {
      typeId: assetType.winterSpeedLimit,
      singleElementEventCategory: 'winterSpeedLimit',
      multiElementEventCategory: 'winterSpeedLimits',
      layerName: 'winterSpeedLimits',
      title: 'Talvinopeusrajoitus',
      newTitle: 'Uusi talvinopeusrajoitus',
      className: 'winter-speed-limits',
      unit: 'km/h',
      isSeparable: true,
      editControlLabels: {
        title: 'Rajoitus',
        enabled: 'Talvinopeusrajoitus',
        disabled: 'Ei talvinopeusrajoitusta'
      },
      possibleValues: [100, 80, 70, 60]
    },
    {
      typeId: assetType.prohibition,
      singleElementEventCategory: 'prohibition',
      multiElementEventCategory: 'prohibitions',
      layerName: 'prohibition',
      title: 'Ajoneuvokohtaiset rajoitukset',
      newTitle: 'Uusi ajoneuvokohtainen rajoitus',
      className: 'prohibition',
      isSeparable: true,
      editControlLabels: {
        title: 'Rajoitus',
        enabled: 'Rajoitus',
        disabled: 'Ei rajoitusta'
      }
    },
    {
      typeId: assetType.hazardousMaterialTransportProhibition,
      singleElementEventCategory: 'hazardousMaterialTransportProhibition',
      multiElementEventCategory: 'hazardousMaterialTransportProhibitions',
      layerName: 'hazardousMaterialTransportProhibition',
      title: 'VAK-rajoitus',
      newTitle: 'Uusi VAK-rajoitus',
      className: 'hazardousMaterialTransportProhibition',
      isSeparable: true,
      editControlLabels: {
        title: 'VAK-rajoitus',
        enabled: 'Rajoitus',
        disabled: 'Ei rajoitusta'
      }
    },
    {
      typeId: assetType.europeanRoads,
      singleElementEventCategory: 'europeanRoad',
      multiElementEventCategory: 'europeanRoads',
      layerName: 'europeanRoads',
      title: 'Eurooppatienumero',
      newTitle: 'Uusi eurooppatienumero',
      className: 'european-road',
      unit: '',
      isSeparable: false,
      editControlLabels: {
        title: '',
        enabled: 'Eurooppatienumero(t)',
        disabled: 'Ei eurooppatienumeroa'
      }
    },
    {
      typeId: assetType.exitNumbers,
      singleElementEventCategory: 'exitNumber',
      multiElementEventCategory: 'exitNumbers',
      layerName: 'exitNumbers',
      title: 'Liittymänumero',
      newTitle: 'Uusi liittymänumero',
      className: 'exit-number',
      unit: '',
      isSeparable: false,
      editControlLabels: {
        title: '',
        enabled: 'Liittymänumero(t)',
        disabled: 'Ei liittymänumeroa'
      }
    },
    {
      typeId: assetType.maintenanceRoad,
      singleElementEventCategory: 'maintenanceRoad',
      multiElementEventCategory: 'maintenanceRoads',
      layerName: 'maintenanceRoad',
      title: 'Rautateiden huoltotie',
      newTitle: 'Uusi rautateiden huoltotie',
      className: 'maintenanceRoad',
      isSeparable: false,
      editControlLabels: {
        title: '',
        enabled: 'Huoltotie',
        disabled: 'Ei huoltotietä'
      },
      possibleValues: [
        {'name': 'Käyttöoikeus', 'propType': 'single_choice', 'id': "huoltotie_kayttooikeus", value: [{typeId: 1, title: 'Tieoikeus'},{typeId: 2, title: 'Tiekunnan osakkuus'},{typeId: 3, title: 'LiVin hallinnoimalla maa-alueella'},{typeId: 4, title: 'Huoltoreittikäytössä olevat kevyen liikenteen väylät (ei rautatieliikennealuetta) väylä'},{typeId: 5, title: 'Tuntematon'}]},
        {'name': 'Huoltovastuu', 'propType': 'single_choice', 'id': "huoltotie_huoltovastuu", value: [{typeId: 1, title: 'LiVi'}, {typeId: 2, title: 'Muu'}, {typeId: 0, title: 'Ei tietoa'}]},
        {'name': "Tiehoitokunta", 'propType': 'text', 'id': "huoltotie_tiehoitokunta" },
        {'name': "Nimi", 'propType': 'text', 'id': "huoltotie_nimi" },
        {'name': "Osoite", 'propType': 'text', 'id': "huoltotie_osoite"},
        {'name': "Postinumero", 'propType': 'text', 'id': "huoltotie_postinumero"},
        {'name': "Postitoimipaikka", 'propType': 'text', 'id': "huoltotie_postitoimipaikka"},
        {'name': "Puhelin 1", 'propType': 'text', 'id': "huoltotie_puh1"},
        {'name': "Puhelin 2", 'propType': 'text', 'id': "huoltotie_puh2"},
        {'name': "Lisätietoa", 'propType': 'text', 'id': "huoltotie_lisatieto"}]
    },
    {
      typeId: assetType.numberOfLanes,
      singleElementEventCategory: 'laneCount',
      multiElementEventCategory: 'laneCounts',
      layerName: 'numberOfLanes',
      title: 'Kaistojen lukumäärä',
      newTitle: 'Uusi kaistojen lukumäärä',
      className: 'lane-count',
      unit: 'kpl / suunta',
      isSeparable: true,
      editControlLabels: {
        title: 'Lukumäärä',
        enabled: 'Kaistojen lukumäärä / suunta',
        disabled: 'Ei tietoa'
      }
    }
  ];

  root.experimentalLinearAssetSpecs = [
  // In future this array could be use to include another experimental Linear
  ];

  root.pointAssetSpecs = [
    {
      typeId: assetType.pedestrianCrossings,
      layerName: 'pedestrianCrossings',
      title: 'Suojatie',
      newAsset: {  },
      legendValues: [
        {symbolUrl: 'images/point-assets/point_blue.svg', label: 'Suojatie'},
        {symbolUrl: 'images/point-assets/point_red.svg', label: 'Geometrian ulkopuolella'}
      ],
      formLabels: {
        singleFloatingAssetLabel: 'suojatien',
        manyFloatingAssetsLabel: 'suojatiet',
        newAssetLabel: 'suojatie'
      }
    },
    {
      typeId: assetType.obstacles,
      layerName: 'obstacles',
      title: 'Esterakennelma',
      newAsset: { obstacleType: 1 },
      legendValues: [
        {symbolUrl: 'images/point-assets/point_blue.svg', label: 'Suljettu yhteys'},
        {symbolUrl: 'images/point-assets/point_green.svg', label: 'Avattava puomi'},
        {symbolUrl: 'images/point-assets/point_red.svg', label: 'Geometrian ulkopuolella'}
      ],
      formLabels: {
        singleFloatingAssetLabel: 'esterakennelman',
        manyFloatingAssetsLabel: 'esterakennelmat',
        newAssetLabel: 'esterakennelma'
      }
    },
    {
      typeId: assetType.railwayCrossings,
      layerName: 'railwayCrossings',
      title: 'Rautatien tasoristeys',
      newAsset: { safetyEquipment: 1 },
      legendValues: [
        {symbolUrl: 'images/point-assets/point_blue.svg', label: 'Rautatien tasoristeys'},
        {symbolUrl: 'images/point-assets/point_red.svg', label: 'Geometrian ulkopuolella'}
      ],
      formLabels: {
        singleFloatingAssetLabel: 'tasoristeyksen',
        manyFloatingAssetsLabel: 'tasoristeykset',
        newAssetLabel: 'tasoristeys'
      }
    },
    {
      typeId: assetType.directionalTrafficSigns,
      layerName: 'directionalTrafficSigns',
      title: 'Opastustaulu',
      newAsset: { validityDirection: 2 },
      legendValues: [
        {symbolUrl: 'src/resources/digiroad2/bundle/assetlayer/images/direction-arrow-directional-traffic-sign.svg', label: 'Opastustaulu'},
        {symbolUrl: 'src/resources/digiroad2/bundle/assetlayer/images/direction-arrow-warning-directional-traffic-sign.svg', label: 'Geometrian ulkopuolella'}
      ],
      formLabels: {
        singleFloatingAssetLabel: 'opastustaulun',
        manyFloatingAssetsLabel: 'opastustaulut',
        newAssetLabel: 'opastustaulu'
      }
    },
    {
      typeId: assetType.servicePoints,
      layerName: 'servicePoints',
      title: 'Palvelupiste',
      newAsset: { services: [] },
      legendValues: [
        {symbolUrl: 'images/point-assets/point_blue.svg', label: 'Palvelupiste'}
      ],
      formLabels: {
        singleFloatingAssetLabel: 'palvelupisteen',
        manyFloatingAssetsLabel: 'palvelupisteet',
        newAssetLabel: 'palvelupiste'
      }
    },
    {
      typeId: assetType.trafficLights,
      layerName: 'trafficLights',
      title: 'Liikennevalo',
      newAsset: {  },
      legendValues: [
        {symbolUrl: 'images/point-assets/point_blue.svg', label: 'Liikennevalo'},
        {symbolUrl: 'images/point-assets/point_red.svg', label: 'Geometrian ulkopuolella'}
      ],
      formLabels: {
        singleFloatingAssetLabel: 'liikennevalojen',
        manyFloatingAssetsLabel: 'liikennevalot',
        newAssetLabel: 'liikennevalo'
      }
    }
  ];
})(this);
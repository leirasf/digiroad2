Oskari.clazz.define('Oskari.digiroad2.bundle.linearassetlayer.LinearAssetLayer',
    function (config) {
        this.mapModule = null;
        this.pluginName = null;
        this._sandbox = null;
        this._map = null;
        this._layers = defineDependency('layers', {});
        this._selectedControl = 'Select';
        this.backend = defineDependency('backend', window.Backend);
        this._oskari = defineDependency('oskari', window.Oskari);
        this.readOnly = true;

        function defineDependency(dependencyName, defaultImplementation) {
            var dependency = _.isObject(config) ? config[dependencyName] : null;
            return dependency || defaultImplementation;
        }
    }, {
        __name: 'LineAssetLayer',
        layerType: 'linearassetlayer',
        getName: function () {
            return this.pluginName;
        },
        getMapModule: function () {
            return this.mapModule;
        },
        setMapModule: function (mapModule) {
            this.mapModule = mapModule;
            this.pluginName = mapModule.getName() + this.__name;
        },
        hasUI: function () {
            return false;
        },
        register: function () {
            this.getMapModule().setLayerPlugin('linearassetlayer', this);
        },
        unregister: function () {
            this.getMapModule().setLayerPlugin('linearassetlayer', null);
        },
        init: function (sandbox) {
            var mapLayerService = sandbox.getService('Oskari.mapframework.service.MapLayerService');
            if (mapLayerService) {
                mapLayerService.registerLayerModel('linearassetlayer', 'Oskari.digiroad2.bundle.linearassetlayer.domain.LineAsset');
            }
            this.initializeLayer();
        },
        onEvent: function (event) {
            return this.eventHandlers[event.getName()].apply(this, [event]);
        },
        startPlugin: function (sandbox) {
            this._map = this.getMapModule().getMap();
            sandbox.register(this);
        },
        start: function (sandbox) {},

        initializeLayer: function() {
            var vectorLayer = new OpenLayers.Layer.Vector("Simple Geometry", {
                styleMap: new OpenLayers.StyleMap({
                    "default": new OpenLayers.Style(OpenLayers.Util.applyDefaults({
                        strokeColor: "#333399",
                        strokeWidth: 8
                    }, OpenLayers.Feature.Vector.style["default"])),
                    "select": new OpenLayers.Style(OpenLayers.Util.applyDefaults({
                        strokeColor: "#3333ff",
                        strokeWidth: 12
                    }, OpenLayers.Feature.Vector.style["select"]))
                })
            });
            vectorLayer.setOpacity(0.5);
            // TODO: Instead of a success callback fire an event
            jQuery.get('/data/SpeedLimits.json', function(lineAssets) {
                var features = _.map(lineAssets, function(lineAsset) {
                    var points = _.map(lineAsset.coordinates, function(coordinate) {
                        return new OpenLayers.Geometry.Point(coordinate[0], coordinate[1]);
                    });
                    return new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString(points), null);
                });
                vectorLayer.addFeatures(features);
            });
            this._map.addLayer(vectorLayer);

            this.modifyControls = {
                modify : new OpenLayers.Control.ModifyFeature(vectorLayer, {
                    standalone: true
                })
            };
            // this.modifyControls.activate();

            this.selectControl = new OpenLayers.Control.SelectFeature(
                [vectorLayer],
                {
                    geometryTypes: this.modifyControls.modify.geometryTypes,
                    clickout: this.modifyControls.modify.clickout,
                    toggle: this.modifyControls.modify.toggle,
                    onBeforeSelect: this.modifyControls.modify.beforeSelectFeature,
                    onSelect: this.modifyControls.modify.selectFeature,
                    onUnselect: this.modifyControls.modify.unselectFeature,
                    scope: this.modifyControls.modify
                }
            );
            this._map.addControl(this.selectControl);
            this.selectControl.activate();

            for(var key in this.modifyControls) {
                this._map.addControl(this.modifyControls[key]);
            }
            // no harm in activating straight away
            this.modifyControls.modify.activate();



        },
        getOLMapLayers: function (layer) {
            if (!layer.isLayerOfType(this._layerType)) {
                return null;
            }
            return _.values(this._layers);
        }
    }, {
        'protocol': ["Oskari.mapframework.module.Module", "Oskari.mapframework.ui.module.common.mapmodule.Plugin"]
    });

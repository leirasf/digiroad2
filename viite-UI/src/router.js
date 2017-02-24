(function (root) {
  root.URLRouter = function(map, backend, models) {
    var Router = Backbone.Router.extend({
      initialize: function () {
        // Support legacy format for opening mass transit stop via ...#300289
        this.route(/^(\d+)$/, function (nationalId) {
          this.massTransitStop(nationalId);
        });

        this.route(/^([A-Za-z]+)$/, function (layer) {
          applicationModel.selectLayer(layer);
        });

        this.route(/^$/, function () {
          applicationModel.selectLayer('linkProperty');
        });
      },

      routes: {
        'linkProperty/:linkId': 'linkProperty',
        'linkProperty/mml/:mmlId': 'linkPropertyByMml'
      },

      linkProperty: function (linkId) {
        applicationModel.selectLayer('linkProperty');
        backend.getRoadLinkByLinkId(linkId, function (response) {
          eventbus.once('roadLinks:afterDraw', function () {
            models.selectedLinkProperty.open(response.linkId, response.id, true);
            eventbus.trigger('linkProperties:reselect');
          });
          map.getView().setCenter([response.middlePoint.x, response.middlePoint.y]);
          map.getView().setZoom(12);
        });
      },

      linkPropertyByMml: function (mmlId) {
        applicationModel.selectLayer('linkProperty');
        backend.getRoadLinkByMmlId(mmlId, function (response) {
          eventbus.once('linkProperties:available', function () {
            models.selectedLinkProperty.open(response.id);
          });
          map.getView().setCenter([response.middlePoint.x, response.middlePoint.y]);
          map.getView().setZoom(12);
        });
      }
    });

    var router = new Router();

    // We need to restart the router history so that tests can reset
    // the application before each test.
    Backbone.history.stop();
    Backbone.history.start();

    eventbus.on('linkProperties:unselected', function () {
      router.navigate('linkProperty');
    });

    eventbus.on('linkProperties:selected', function (linkProperty) {
      if(!_.isEmpty(models.selectedLinkProperty.get())){
      router.navigate('linkProperty/' + linkProperty.linkId);
      }
    });

    eventbus.on('layer:selected', function (layer) {
      router.navigate(layer);
    });
  };
})(this);
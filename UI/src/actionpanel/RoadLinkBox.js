(function(root) {
  root.RoadLinkBox = function() {
    var className = 'road-link';
    var title = 'Tielinkit';
    var layerName = 'linkProperties';

    var collapsedTemplate = _.template('' +
      '<div class="panel <%= className %>">' +
        '<header class="panel-header"><%- title %></header>' +
      '</div>');

    var expandedTemplate = _.template('' +
      '<div class="panel <%= className %>">' +
        '<header class="panel-header expanded"><%- title %></header>' +
      '</div>');

    var templateAttributes = {
      className: className,
      title: title
    };

    var elements = {
      collapsed: $(collapsedTemplate(templateAttributes)),
      expanded: $(expandedTemplate(templateAttributes)).hide()
    };

    var bindDOMEventHandlers = function() {
      elements.collapsed.click(function() {
        executeOrShowConfirmDialog(function() {
          elements.collapsed.hide();
          elements.expanded.show();
          applicationModel.selectLayer(layerName);
        });
      });
    };

    var bindExternalEventHandlers = function() {
      eventbus.on('layer:selected', function(selectedLayer) {
        if (selectedLayer !== layerName) {
          elements.expanded.hide();
          elements.collapsed.show();
        }
      }, this);
    };

    bindDOMEventHandlers();

    bindExternalEventHandlers();

    this.element = $('<div class="panel-group ' + className + 's"/>')
      .append(elements.collapsed)
      .append(elements.expanded);
  };

  var executeOrShowConfirmDialog = function(f) {
    if (applicationModel.isDirty()) {
      new Confirm();
    } else {
      f();
    }
  };

})(this);
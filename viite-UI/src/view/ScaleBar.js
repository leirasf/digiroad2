(function (root) {
  root.ScaleBar = function(map, container) {
    var element = '<div class="scalebar"/>';
    container.append(element);
    map.addControl(new ol.control.ScaleLine({
      className: 'scalebar'
    }));
  };
})(this);
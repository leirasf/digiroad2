{
  "exports": [
  "ol.Map",
  "ol.View",
  "ol.control.defaults",
  "ol.layer.Tile",
  "ol.source.OSM",
  "ol.source.XYZ"
],
  "compile": {
  "externs": [
    "externs/bingmaps.js",
    "externs/closure-compiler.js",
    "externs/geojson.js",
    "externs/oli.js",
    "externs/olx.js",
    "externs/proj4js.js",
    "externs/tilejson.js",
    "externs/topojson.js"
  ],
    "define": [
    "goog.array.ASSUME_NATIVE_FUNCTIONS=true",
    "goog.dom.ASSUME_STANDARDS_MODE=true",
    "goog.json.USE_NATIVE_JSON=true",
    "goog.DEBUG=false"
  ],
    "jscomp_off": [
    "unknownDefines"
  ],
    "extra_annotation_name": [
    "api", "observable"
  ],
    "compilation_level": "ADVANCED_OPTIMIZATIONS",
    "manage_closure_dependencies": true
}
}
/*
 * Visualization source
 */

define([
  'jquery',
  'underscore',
  'Leaflet.vector-markers',
  'leaflet',
  'leaflet-kml',
  'api/SplunkVisualizationBase',
  'api/SplunkVisualizationUtils'
  // Add required assets to this list
],
function(
  $,
  _,
  LeafletVM,
  L,
  leafletKML,
  SplunkVisualizationBase,
  vizUtils
) {
  
  // Extend from SplunkVisualizationBase
  return SplunkVisualizationBase.extend({
    isInitialized: false,
    map: null,
    markers: [],
    polylines: [],

    initialize: function() {
      SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
      this.$el = $(this.el);

      this.$el.append('<div id="map" class="location_map"></div>');
      
      // Initialization logic goes here
    },

    // Optionally implement to format data returned from search. 
    // The returned object will be passed to updateView as 'data'
    formatData: function(data) {

      // Format data 

      return data;
    },

    initLoad: function(tileUrl, tileAttr, kmlUrl, maxZoom, minZoom, initialZoom){
      if(this.map) return;

      maxZoom = maxZoom || 18;
      minZoom = minZoom || 0;
      initialZoom = initialZoom || 15;

      this.map = L.map('map')
      L.tileLayer(
        tileUrl, {
          attribution: tileAttr,
          maxZoom: maxZoom,
          minZoom: minZoom,
        }).addTo(this.map);
      this.map.setZoom(initialZoom)

      let self = this
      //var kml = '/en-US/static/app/viz_location_map/tokyo.kml';
      if(kmlUrl){
        fetch(kmlUrl)
	        .then(res => res.text())
	        .then(kmltext => {
	          const parser = new DOMParser();
	          const kml = parser.parseFromString(kmltext, 'text/xml');
	          const track = new L.KML(kml);
	          self.map.addLayer(track);
	        });
      }
    },

    _getProperty(config, key, def){
      return config[this.getPropertyNamespaceInfo().propertyNamespace + key] || def
    },

    // Implement updateView to render a visualization.
    //  'data' will be the data object returned from formatData or from the search
    //  'config' will be the configuration property object
    updateView: function(data, config) {
      let rows = data.rows;
      let fields = data.fields;

      if(!rows.length) return

      let tileUrl = this._getProperty(config, 'tileLayerUrl')
      let tileAttribution = this._getProperty(config, 'tileLayerAttribution')
      let overlayKmlUrl = this._getProperty(config, 'overlayKmlUrl')
      let maxZoom = this._getProperty(config, 'maxZoom')
      let minZoom = this._getProperty(config, 'minZoom')
      let initialZoom = this._getProperty(config, 'initialZoom')
      let moveLastLocation = this._getProperty(config, 'moveLastLocation') == "yes"

      this.initLoad(tileUrl, tileAttribution, overlayKmlUrl,
                    maxZoom, minZoom, initialZoom);

      let obj = {};
      let lastLocation = null;
      rows.forEach(function(v){
	      let _time = v[0];
	      let latlng = new L.LatLng(parseFloat(v[1]), parseFloat(v[2]), 0);
	      let name = v[3];
	      let icon = v[4];
	      let color = v[5];
	      if(obj.hasOwnProperty(name)){
	        obj[name].push({
	          'time': _time,
	          'latlng': latlng,
	          'icon': icon,
	          'color': color
	        });
	      } else {
	        obj[name] = [{
	          'time': _time,
	          'latlng': latlng,
	          'icon': icon,
	          'color': color
	        }];
	      }
      });

      let self = this;

      self.markers.forEach(function(v){
        self.map.removeLayer(v)
      });
      self.markers = []

      self.polylines.forEach(function(v){
        self.map.removeLayer(v)
      });
      self.polylines = [];

      Object.keys(obj).forEach(function(key){
      //for(let key of Object.keys(obj)){
        let c = _.pluck(obj[key], 'latlng');
        let cl = obj[key][0]['color'];
        let ic = obj[key][0]['icon'];
        let opt = {
          'color': cl
        };
        if(self.polyline){
          self.map.removeLayer(self.polyline);
        }
        polyline = new L.Polyline(c, opt);
        polyline.addTo(self.map);
        self.polylines.push(polyline);

        let icopt = {
          'markerColor': cl,
          'icon': ic
        };

        //let vmarker = LeafletVM.icon(icopt)
        let vmarker = LeafletVM.VectorMarkers.icon(icopt);
        lastLocation = c.slice(-1)[0];
        marker = new L.marker(lastLocation, {'icon': vmarker});
        marker.addTo(self.map);
        self.markers.push(marker);
      });

      if(!self.isInitialized){
        setTimeout(function(){
          self.map.panTo(lastLocation);
        }, 0);
        self.isInitialized = true;
      } else if(moveLastLocation){
        self.map.panTo(lastLocation);
      }
    },

    // Search data params
    getInitialDataParams: function() {
      return ({
        outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
        count: 10000
      });
    },

    // Override to respond to re-sizing events
    reflow: function() {}
  });
});

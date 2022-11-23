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

    map: null,

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

    initLoad: function(tileUrl, tileAttr, kmlUrl){
      if(this.map) return;

      this.map = L.map('map').setView([35.65809922, 139.74135747], 8);
      let mapLink = '<a href="https://openstreetmap.org">OpenStreetMap</a>';
      L.tileLayer(
        tileUrl, {
          attribution: tileAttr,
          maxZoom: 18
        }).addTo(this.map);

      let self = this
      //var kml = '/en-US/static/app/viz_location_map/tokyo.kml';

      fetch(kmlUrl)
	.then(res => res.text())
	.then(kmltext => {
	  const parser = new DOMParser();
	  const kml = parser.parseFromString(kmltext, 'text/xml');
	  const track = new L.KML(kml);
	  self.map.addLayer(track);
	  const bounds = track.getBounds();
	  self.map.fitBounds(bounds);
	});

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

      // Draw something here
      console.log(config)
      console.log(data)
      console.log(L)

      let tileUrl = this._getProperty(config, 'tileLayerUrl')
      let tileAttribution = this._getProperty(config, 'tileLayerAttribution')
      let overlayKmlUrl = this._getProperty(config, 'overlayKmlUrl')


      this.initLoad(tileUrl, tileAttribution, overlayKmlUrl);

      let obj = {}
      rows.forEach(function(v){
      //for(let n1 = 0; n1 < rows.length; ++n1){
        // _time, lat, lng, name, icon, color
        console.log(v)
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
	  })
	} else {
	  obj[name] = [{
	    'time': _time,
	    'latlng': latlng,
	    'icon': icon,
	    'color': color
	  }]
	}
      })
      console.log(obj)

      let self = this

      Object.keys(obj).forEach(function(key){
      //for(let key of Object.keys(obj)){
        let c = _.pluck(obj[key], 'latlng')
        let cl = obj[key][0]['color']
        let ic = obj[key][0]['icon']
        let opt = {
          'color': cl
        }
        let pl = new L.Polyline(c, opt);
        pl.addTo(self.map)

        let icopt = {
          'markerColor': cl,
          'icon': ic
        }
        //let vmk = LeafletVM.icon(icopt)
        let vmk = LeafletVM.VectorMarkers.icon(icopt)
        let mk = new L.marker(c.slice(-1)[0], {'icon': vmk})
        mk.addTo(self.map)
        
      })
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

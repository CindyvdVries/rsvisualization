import Vue from "vue";
import VMapbox from "./components/VMapbox";
import VMapboxLayer from "./components/VMapboxLayer";
import VMapboxSlider from "./components/VMapboxSlider";
import VMapboxSource from "./components/VMapboxSource";
import VMapboxGeocoder from "./components/VMapboxGeocoder";
import VMapboxNavigationControl from "./components/VMapboxNavigationControl";
import Vuetify from "vuetify";

Vue.use(Vuetify);

import "normalize.css";
import "sanitize.css";
import "vuetify/dist/vuetify.min.css";
import "material-design-icons/iconfont/material-icons.css";
import "./main.scss";
/* eslint-disable no-new */
import mapboxgl from 'mapbox-gl';

Vue.component('modal', {
  template: '#modal-template'
})

const vm = new Vue({
  el: "#app",
  data() {
    return {
      timeStep: 0,
      layers: [
        //  {
        //   "id": "3d-buildings",
        //   "active": false,
        //   "metadata": {
        //     "name": "3D buildings",
        //     "subtitle": "3D buildings from OSM",
        //     "avatar": "city-icon.png"
        //   },
        //   // "source": "composite",
        //   "source-layer": "building",
        //   "filter": ["==", "extrude", "true"],
        //   "type": "fill-extrusion",
        //   "minzoom": 8,
        //   "paint": {
        //     "fill-extrusion-color": "#88a",
        //     "fill-extrusion-height": {
        //       "type": "identity",
        //       "property": "height"
        //     },
        //     "fill-extrusion-base": {
        //       "type": "identity",
        //       "property": "min_height"
        //     },
        //     "fill-extrusion-opacity": .6
        //   }
        // },
        {
          "id": "grid",
          "active": true,
          "metadata": {
            "name": "Numerical Grid",
            "subtitle": "Curvilinear grid of ZUNO-DD",
            "avatar": "grid.png"
          },
          "type": "fill",
          "source": {
            "data": "./static/RSdata_10steps.geojson",
            "type": "geojson"
          },
          "minzoom": 0,
          "maxzoom": 22,
          "layout": {},
          "paint": {
            "fill-color": {
              "type": "exponential",
              "property": "IM10",
              "stops": [[0,  "hsl(205, 100%, 50%)"],
                        [25, "hsl(211, 96%, 37%)"],
                        [50, "hsl(243, 50%, 19%)"],
                        [75, "hsl(90, 72%, 39%)"],
                        [100, "hsl(27, 96%, 19%)"]
                      ]
              // "stops": [[0,  "hsl(248, 100%, 50%)"],
              //           [25, "hsl(179, 100%, 50%)"],
              //           [50, "hsl(55, 96%, 51%)"],
              //           [75, "hsl(29, 100%, 50%)"],
              //           [100, "hsl(0, 100%, 48%)"]
              //         ]
            }
          }
        }
      ],
      sources: [
      ]
    };
  },
components: {
  "v-mapbox": VMapbox,
  "v-mapbox-layer": VMapboxLayer,
  "v-mapbox-slider": VMapboxSlider,
  "v-mapbox-source": VMapboxSource,
  "v-mapbox-geocoder": VMapboxGeocoder,
  "v-mapbox-navigation-control": VMapboxNavigationControl,
},
  mounted() {
    this.$nextTick(() => {
      this.$refs.map.map.on(
        "load",
        () => {
        this.syncLayerVisibility();

        document.getElementById('slider').addEventListener('input', function(e) {
                var t = parseInt(e.target.value, 10);
                // document.getElementById('timestep').textContent = 'Timestep: ' + t.toString();
                let filters = ['==', 'paint.fill-color.property', 'IM1' + t.toString()];
        });
      }
    ),

    this.$refs.map.map.on('mouseenter', 'grid', () => {
        this.$refs.map.map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    this.$refs.map.map.on('mouseleave', 'grid', () => {
        this.$refs.map.map.getCanvas().style.cursor = '';
    });

    var popup = new mapboxgl.Popup({})

    this.$refs.map.map.on(
      "click", "grid",
      (e) => {
        popup.remove()
        var data = e.features[0].properties
        var plt = Bokeh.Plotting;
        var tools = "pan,crosshair,wheel_zoom,box_zoom,reset,save";
        var end_time = Object.keys(data).length
        var x = Bokeh.LinAlg.linspace(0, end_time-1, end_time);
        var y = [], range = end_time;
        _.each(x, function(time){
          y[time] = data['IM1' + time.toString()]
        });
        var source = new Bokeh.ColumnDataSource({ data: { x: x, y: y } });
        var plot = new plt.figure({
            title: "Timeseries",
            tools: tools,
            width: 400,
            height: 200,
            background_fill_color: "#F2F2F7"
        });

        var line = new Bokeh.Line({
            x: { field: "x" },
            y: { field: "y" },
            line_color: "#666699",
            line_width: 2
        });
        plot.add_glyph(line, source);
        var doc = new Bokeh.Document();
        doc.add_root(plot);

        popup.setLngLat(e.lngLat)
            .setHTML("<div id='popup'></div>")
            .addTo(this.$refs.map.map);

        var pop = document.getElementById("popup");
        Bokeh.embed.add_document_standalone(doc, pop);
    }
  );
  });

  },
  watch: {
    timeStep(newScenario, oldScenario) {
      this.timeStepMethod(newScenario);
      console.log(newScenario)

    }
  },
  methods: {
    timeStepMethod(t) {
        this.$refs.map.map.setPaintProperty("grid", "fill-color", {
          "type": "exponential",
          "property": "IM1" + t.toString(),
          "stops": [[0,  "hsl(205, 100%, 50%)"],
                    [25, "hsl(211, 96%, 37%)"],
                    [50, "hsl(243, 50%, 19%)"],
                    [75, "hsl(90, 72%, 39%)"],
                    [100, "hsl(27, 96%, 19%)"]
                  ]
        });
      },
    syncLayerVisibility() {
      _.each(this.layers, (layer) => {
        if (layer.active) {
          this.$refs.map.map.setLayoutProperty(layer.id, "visibility", "visible");
        } else {
          this.$refs.map.map.setLayoutProperty(layer.id, "visibility", "none");
        }
      });

    },
    initialview() {
      this.$refs.map.map.setZoom("6")
      this.$refs.map.map.setPitch("38.50")
      this.$refs.map.map.setCenter([4.527,53.009])
      this.$refs.map.map.setBearing("1.43")
      // this.initialview = null
    }
  }
});
// add watchers that are deep
vm.$watch(
  "layers",
  function(layers) {
    vm.syncLayerVisibility();
  },
  {deep: true}
);

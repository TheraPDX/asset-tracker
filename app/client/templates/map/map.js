import turf from 'turf';
import { Mapbox } from '../../../imports/mapbox.js';


Template.map.onRendered(function() {
  const margin = [-0.002, -0.002, 0.002, 0.002];

  let tracker;

  mapboxgl.accessToken = Mapbox.accessToken;

  let map = new mapboxgl.Map({
    container: 'mapbox',
    style: Mapbox.styleUrl,
    center: [0, 0],
    zoom: 0.01
  });

  map.addControl(new mapboxgl.Navigation());

  const point = {
    type: 'Point',
    coordinates: [0, 0]
  };

  const history = {
    type: 'LineString',
    coordinates: []
  };

  const pointSource = new mapboxgl.GeoJSONSource({
    data: point
  });

  const historySource = new mapboxgl.GeoJSONSource({
    data: history
  });

  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  });

  map.on('mousemove', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['tracker']
    });

    if (! features.length) {
      popup.remove();
    } else {
      popup
        .setLngLat(point.coordinates)
        .setHTML(tracker.name)
        .addTo(map);
    }
  });

  function showTracker(show) {
    if (show) {
      if (map.getLayer('tracker')) {
        return;
      }

      map.addSource('tracker', pointSource);    

      map.addLayer({
        id: 'tracker',
        type: 'circle',
        paint: {
          'circle-radius': 10,
          'circle-color': '#990808'
        },
        source: 'tracker'
      });
    } else {
      if (! map.getLayer('tracker')) {
        return;
      }

      map.removeLayer('tracker');
      map.removeSource('tracker');
    }
  }

  function showHistory(show) {
    if (show) {
      if (map.getLayer('history') || history.coordinates.length < 2) {
        return;
      }

      map.addSource('history', historySource);

      map.addLayer({
        id: 'history',
        type: 'line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#990808',
          'line-width': 3
        },
        source: 'history'
      });
    } else {
      if (! map.getLayer('history')) {
        return;
      }

      map.removeLayer('history');
      map.removeSource('history');
    }
  }

  this.autorun(function(computation) {
    const data = Template.currentData();

    if (computation.firstRun) {
      return;
    }

    // Update map size (required when header becomes visible)
    Tracker.afterFlush(function() {
      map.resize();
    });

    // Update tracker layer
    if (data.tracker && data.tracker.lat && data.tracker.lon) {
      point.coordinates = [
        data.tracker.lon,
        data.tracker.lat
      ];

      pointSource.setData(point);

      showTracker(true);

      // Ease or jump to target
      const isOld = tracker && tracker._id == data.tracker._id;

      const easeOptions = {
        center: point.coordinates,
        duration: isOld ? 750 : 0
      };

      if (! isOld) {
        easeOptions.zoom = 14;
      }

      map.easeTo(easeOptions);
    } else {
      showTracker(false);
    }

    // Update history layer
    if (data.history) {
      history.coordinates = data.history.points;
      historySource.setData(history);

      if (! data.tracker) {
        const extent = turf.extent({
          type: 'Feature',
          geometry: history
        });

        map.fitBounds(margin.map(function(offset, index) {
          return extent[index] + offset;
        }), {
          linear: true,
          duration: 0
        });
      }

      showHistory(true);
    } else {
      showHistory(false);
      history.coordinates = [];
    }

    tracker = data.tracker;
  });
});

Template.map.helpers({
  headerVisible() {
    return !! (this.tracker || this.history);
  },

  title() {
    if (this.tracker) {
      return this.tracker.name;
    }

    if (this.history) {
      return this.history.name;
    }
  }
});

Template.map.events({
  'click .back': function() {
    Template.instance().data.back();
  }
});

#!/bin/env node

'use strict';

const async = require('async');
const fs = require('fs');

const serialport = require('serialport');
const MongoClient = require('mongodb').MongoClient;

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));


const port = new serialport.SerialPort(config.port, {
  baudrate: 9600,
  parser: serialport.parsers.readline('\n')
});

async.parallel({
  mongo: function(callback) {
    MongoClient.connect(config.url, function(err, db) {
      if (! err) {
        callback(null, {
          trackers: db.collection('trackers'),
          recordings: db.collection('recordings')
        });
      } else {
        console.error(err);
      }
    });
  },

  port: function(callback) {
    port.on('open', () => callback(null, port));
  }
},
function(err, results) {
  function updateRecording(lat, lon) {
    results.mongo.recordings.update({
      trackerId: config.tracker,
      inProgress: true
    }, {
      $push: { points: [lon, lat] }
    });
  }

  results.port.on('data', function(data) {
    console.log(data);

    const m = data.split(':');
    let trackerValues;

    if (m[0] == 'loc') {
      const lat = parseFloat(m[1]);
      const lon = parseFloat(m[2]);

      trackerValues = {
        lat, lon
      };

      updateRecording(lat, lon);
    } else if (m[0] == 'bat') {
      trackerValues = {
        battery: parseInt(m[1])
      };
    }

    results.mongo.trackers.update({ particleId: config.device }, {
      $set: trackerValues
    });
  });
});

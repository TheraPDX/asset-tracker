import twilio from 'twilio';
import { Secrets } from '../imports/secrets.js';
import { Particle } from '../imports/particle.js';


const twilioData = Secrets.Twilio;
let smsClient;

if (twilioData) {
  smsClient = twilio(twilioData.accountSid, twilioData.authToken);
}


function updateLocation(event) {
  const tracker = Trackers.findOne({ particleId: event.coreid });

  const latLon = event.data.split(':');

  const lat = parseFloat(latLon[0])
  const lon = parseFloat(latLon[1]);

  Trackers.update({
    particleId: event.coreid
  }, {
    $set: {
      lon: lon,
      lat: lat,
      updated: new Date()
    }
  });

  if (tracker.recording) {
    Recordings.update({
      trackerId: tracker._id,
      inProgress: true
    }, {
      $push: { points: [lon, lat] }
    });
  }
}

function updateBattery(event) {
  Trackers.update({
    particleId: event.coreid
  }, {
    $set: {
      battery: parseFloat(event.data)
    }
  });
}

function sendAlarm(event) {
  const tracker = Trackers.findOne({ particleId: event.coreid });

  if (! tracker) {
    return;
  }

  const owner = Meteor.users.findOne({ _id: tracker.ownerId });

  if (! (owner && owner.profile && owner.profile.phone)) {
    return;
  }

  smsClient.messages.create({
    to: owner.profile.phone,
    from: twilioData.from,
    body: `Alarm: ${tracker.name} was moved!`
  }, function(err, res) {
    if (err) {
      console.error(err);
    }
  });
}

function updateStatus(event) {
  Trackers.update({
    particleId: event.coreid
  }, {
    $set: { status: event.data }
  });
}

const handlers = {
  L: updateLocation,
  B: updateBattery,
  A: sendAlarm,
  'spark/status': updateStatus
};

function listenForEvents(particleId) {
  Particle.listen(particleId, function(event) {
    const handler = handlers[event.name];

    if (typeof handler == 'function') {
      handler(event);
    }
  });
}

Meteor.startup(function() {
  Trackers.find().forEach(function(tracker) {
    listenForEvents(tracker.particleId);
  });
});

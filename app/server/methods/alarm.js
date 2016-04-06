import { Particle } from '../../imports/particle.js';

function updateDeviceAlarm(trackerId, alarm) {
  const tracker = Trackers.findOne({
    _id: trackerId,
    ownerId: Meteor.userId()
  });

  try {
    Particle.call(tracker.particleId, 'setAlarm', alarm ? '1' : '0');
  } catch (err) {
    throw new Meteor.Error(404, 'Tracker not reachable');
  }
}

Meteor.methods({
  enableAlarm(trackerId) {
    check(trackerId, String);

    updateDeviceAlarm(trackerId, true);

    Trackers.update({
      _id: trackerId,
      ownerId: this.userId
    }, {
      $set: { alarm: true }
    });
  },

  disableAlarm(trackerId) {
    check(trackerId, String);

    updateDeviceAlarm(trackerId, false);

    Trackers.update({
      _id: trackerId,
      ownerId: this.userId
    }, {
      $unset: { alarm: null }
    });
  }
});

import moment from 'moment';

Meteor.methods({
  startRecording(trackerId) {
    check(trackerId, String);

    const tracker = Trackers.findOne({
      _id: trackerId,
      ownerId: this.userId
    });

    if (! tracker) {
      throw new Meteor.Error(404, 'Tracker not found');
    }

    Trackers.update(trackerId, {
      $set: { recording: true }
    });

    const newRecording = {
      name: moment().format('D MMMM YYYY (h:mm a)'),
      trackerId: trackerId,
      ownerId: this.userId,
      inProgress: true,
    };

    if (tracker.lat && tracker.lon) {
      newRecording.points = [[tracker.lon, tracker.lat]];
    }

    Recordings.insert(newRecording);
  },

  stopRecording(trackerId) {
    check(trackerId, String);

    const success = Trackers.update({
      _id: trackerId,
      ownerId: this.userId
    }, {
      $unset: { recording: null }
    });

    if (! success) {
      throw new Meteor.Error(404, 'Tracker not found');
    }

    Recordings.update({
      trackerId,
      ownerId: this.userId
    }, {
      $unset: { inProgress: null }
    }, {
      multi: true
    });
  },

  getActivePoints(trackerId) {
    const recording = Recordings.findOne({
      trackerId,
      inProgress: true
    }, {
      fields: { points: 1 }
    });

    if (recording) {
      return recording.points || [];
    } else {
      return [];
    }
  },

  getRecording(recordingId) {
    check(recordingId, String);

    const recording = Recordings.findOne({
      _id: recordingId,
      ownerId: this.userId
    }, {
      fields: { name: 1, points: 1 }
    });

    return recording;
  },

  deleteRecording(recordingId) {
    Recordings.remove({
      _id: recordingId,
      ownerId: this.userId
    });
  }
});

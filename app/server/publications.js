Meteor.publish('trackers', function() {
  return Trackers.find({
    ownerId: this.userId
  }, {
    fields: { ownerId: 0, particleId: 0 }
  });
});

Meteor.publish('recordings', function() {
  return Recordings.find({
    ownerId: this.userId,
    inProgress: { $ne: true }
  }, {
    fields: { name: 1 }
  });
});

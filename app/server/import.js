Meteor.startup(function() {
  const userInfo = JSON.parse(Assets.getText('users.json'));

  for (user in userInfo) {
    const info = userInfo[user];

    const existing = Accounts.findUserByEmail(user);

    if (! existing) {
      Accounts.createUser({
        name: '',
        email: user,
        password: info.password,
        profile: {
          phone: info.phone
        }
      });
    } else {
      Accounts.setPassword(existing._id, info.password);
    }
  }

  // Import trackers
  const trackerInfo = JSON.parse(Assets.getText('trackers.json'));
  const usedTrackers = [];

  // Insert or update tracker from configuration
  for (user in trackerInfo) {
    const trackers = trackerInfo[user];

    const owner = Accounts.findUserByEmail(user);

    trackers.forEach(function(tracker) {
      Trackers.upsert({
        particleId: tracker.particleId
      }, {
        $set: {
          ownerId: owner._id,
          particleId: tracker.particleId,
          name: tracker.name
        }
      });

      usedTrackers.push(tracker.particleId);
    });
  }

  // Remove unused trackers
  Trackers.remove({
    particleId: { $nin: usedTrackers }
  });
});

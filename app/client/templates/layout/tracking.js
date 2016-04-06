Template.tracking.onCreated(function() {
  this.subscribe('trackers');
  this.subscribe('recordings');

  this.showMap = new ReactiveVar;

  this.trackerId = new ReactiveVar(null, () => false);
  const historyVar = this.history = new ReactiveVar;

  // Record history if a new (and recording) tracker is selected
  this.autorun(() => {
    const id = this.trackerId.get();

    if (! id) {
      return;
    }

    let history = [];

    const cursor = Trackers.find(id);
    let ready = false, tracker;

    function updateHistory(fields) {
      Tracker.nonreactive(function() {
        tracker = cursor.fetch()[0];
      });

      if (! tracker.recording) {
        historyVar.set(null);
        return;
      };

      if (fields && 'recording' in fields) {
        if (tracker.recording) {
          history = [[tracker.lon, tracker.lat]];
        }
      }

      if (fields && 'lat' in fields && 'lon' in fields) {
        history.push([tracker.lon, tracker.lat]);

        if (ready) {
          historyVar.set({ points: history });
        }
      }
    }

    updateHistory();

    cursor.observeChanges({
      changed(id, fields) {
        updateHistory(fields);
      }
    });

    if (tracker.recording) {
      Meteor.call('getActivePoints', id, function(err, res) {
        history = res.concat(history);
        historyVar.set({ points: history });

        ready = true;
      });
    } else {
      ready = true;
    }
  });
});

Template.tracking.helpers({
  mainContext() {
    const instance = Template.instance();

    const context = {
      trackers: Trackers.find(),
      recordings: Recordings.find(),

      show(trackerId) {
        instance.showMap.set(true);
        instance.trackerId.set(trackerId);
      },

      showRecording(recordingId) {
        Meteor.call('getRecording', recordingId, function(err, res) {
          if (err) {
            console.error(err);
            return;
          }

          instance.showMap.set(true);

          instance.trackerId.set(null);
          instance.history.set(res);
        });
      }
    };

    return context;
  },

  mapContext() {
    const instance = Template.instance();

    return {
      tracker: Trackers.findOne(instance.trackerId.get()),
      history: instance.history.get(),

      back() {
        instance.showMap.set(false);
        instance.trackerId.set(null);
      }
    };
  },

  mainHidden() {
    if (Template.instance().showMap.get()) {
      return 'mobile-hidden';
    }
  }
});

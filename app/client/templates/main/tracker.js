import moment from 'moment';

function className(property, icon) {
  let name = `icon-${icon}`;

  if (property) {
    name += '-active';
  }

  return name;
}

Template.tracker.onCreated(function() {
  this.updatedVar = new ReactiveVar(null, () => false);
  let updated;

  this.autorun(() => {
    updated = Template.currentData().tracker.updated;
    this.updatedVar.set(updated);
  });

  this.updatedInterval = Meteor.setInterval(() => {
    this.updatedVar.set(updated);
  }, 5000);
});

Template.tracker.onDestroyed(function() {
  Meteor.clearInterval(this.updatedInterval);
})

Template.tracker.helpers({
  status() {
    if (this.tracker.battery > 60) {
      return 'high';
    }

    if (this.tracker.battery > 20) {
      return 'medium';
    }
    
    return 'low';
  },

  updated() {
    const timestamp = Template.instance().updatedVar.get();

    if (timestamp) {
      return 'Moved ' + moment(timestamp).fromNow();
    } else {
      return 'Never moved';
    }
  },

  coord(value) {
    return value ? value : 'n/a';
  },

  recordClass() {
    return className(this.tracker.recording, 'record');
  },

  alarmClass() {
    return className(this.tracker.alarm, 'alarm');
  }
});

Template.tracker.events({
  'click .actions .record': function() {
    const tracker = Template.currentData().tracker;
    let method;

    if (tracker.recording) {
      method = 'stopRecording';
    } else {
      method = 'startRecording';
    }

    Meteor.call(method, tracker._id);

    return false;
  },

  'click .actions .alarm': function(e) {
    const data = Template.currentData();
    const target = $(e.currentTarget);

    let method;

    if (data.tracker.alarm) {
      method = 'disableAlarm';
    } else {
      method = 'enableAlarm';
    }

    target.prop('disabled', true);

    Meteor.call(method, data.tracker._id, function(err) {
      target.prop('disabled', false);

      if (err) {
        data.error(err.reason);
      }
    });

    return false;
  }
});

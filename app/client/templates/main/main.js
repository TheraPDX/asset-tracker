Template.main.onCreated(function() {
  this.error = new ReactiveVar(null, () => false);
});

Template.main.helpers({
  error() {
    return Template.instance().error;
  },

  trackerContext(tracker) {
    const instance = Template.instance();

    const context = {
      tracker: tracker,

      error: function(error) {
        instance.error.set(error);
      }
    };

    return context;
  }
});

Template.main.events({
  'click .logout': function() {
    Meteor.logout();
  },

  'click .trackers .item': function(e, instance) {
    instance.data.show(this._id);
  },

  'click .recordings .item': function(e, instance) {
    instance.data.showRecording(this._id);
  }
});

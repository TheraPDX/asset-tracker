Template.recording.events({
  'click .delete': function() {
    Meteor.call('deleteRecording', this._id);

    return false;
  }
});

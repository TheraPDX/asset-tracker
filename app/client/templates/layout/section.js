Template.section.onCreated(function() {
  this.error = new ReactiveVar(null);

  this.autorun(() => {
    const data = Template.instance().data;

    if (! (data && data.error)) {
      return;
    }

    if (data.error.get()) {
      Meteor.clearTimeout(this.timeout);

      this.timeout = Meteor.setTimeout(() => {
        this.error.set(null);
      }, 3500);
    }

    this.error.set(data.error.get());
  });
});

Template.section.onDestroyed(function() {
  Meteor.clearTimeout(this.timeout);
});

Template.section.helpers({
  errorVisible() {
    if (Template.instance().error.get()) {
      return 'visible';
    }
  },

  errorMessage() {
    return Template.instance().error.get();
  }
});

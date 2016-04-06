Template.login.onCreated(function() {
  this.error = new ReactiveVar(null, () => false);
});

Template.login.helpers({
  disabled() {
    if (Meteor.loggingIn()) return 'disabled';
  },

  error() {
    return Template.instance().error;
  }
});

Template.login.events({
  'submit .form': function(e, tmpl) {
    function val(name) {
      return tmpl.$(`input[name=${name}]`).val();
    }

    // Cancel if login is in progress
    if (Meteor.loggingIn()) {
      return false;
    }

    Meteor.loginWithPassword(val('email'), val('password'), function(err) {
      tmpl.error.set('Wrong credentials');
    });

    return false;
  }
});

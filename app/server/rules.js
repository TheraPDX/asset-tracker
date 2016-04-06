Accounts.config({
  forbidClientAccountCreation: true
});

Meteor.users.deny({
  update() {
    return true;
  }
});

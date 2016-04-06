import ParticleApi from 'particle-api-js';
import { Promise } from 'meteor/promise';
import { Secrets } from './secrets.js';


const particle = new ParticleApi();
const particleAuth = Promise.await(particle.login(Secrets.Particle));


export const Particle = {
  listen(particleId, callback) {
    let stream;

    try {
      stream = Promise.await(particle.getEventStream({
        deviceId: particleId,
        auth: particleAuth.body.access_token
      }));
    } catch (err) {
      console.error(err.body.error);
      return;
    }

    stream.on('event', Meteor.bindEnvironment(callback));
  },

  call(particleId, functionName, argument) {
    Promise.await(particle.callFunction({
      deviceId: particleId,
      name: functionName,
      argument,
      auth: particleAuth.body.access_token
    }));
  }
};

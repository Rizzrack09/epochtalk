var Joi = require('@hapi/joi');
var Boom = require('boom');
var Promise = require('bluebird');

module.exports = {
  validateRoles: function(validations, payload) {
   var schema = Joi.object({
     priorityRestrictions: Joi.array().items(Joi.number()),
     adminAccess: Joi.object({
       settings: Joi.object({
         general: Joi.boolean(),
         advanced: Joi.boolean(),
         legal: Joi.boolean(),
         theme: Joi.boolean()
       }),
       management: Joi.object({
         boards: Joi.boolean(),
         users: Joi.boolean(),
         roles: Joi.boolean(),
         bannedAddresses: Joi.boolean(),
         invitations: Joi.boolean()
       })
     }),
     modAccess: Joi.object({
       users: Joi.boolean(),
       posts: Joi.boolean(),
       messages: Joi.boolean(),
       boardBans: Joi.boolean(),
       logs: Joi.boolean()
     }),
     invitations: validations.invitations,
     userNotes: validations.userNotes,
     bans: validations.bans,
     blacklist: validations.blacklist,
     legal: validations.legal,
     themes: validations.themes,
     configurations: validations.configurations,
     roles: validations.roles,
     boards: validations.boards,
     categories: validations.categories,
     conversations: validations.conversations,
     notifications: validations.notifications,
     messages: validations.messages,
     threads: validations.threads,
     posts: validations.posts,
     users: validations.users,
     reports: validations.reports,
     watchlist: validations.watchlist,
     mentions: validations.mentions,
     moderationLogs: validations.moderationLogs,
     moderators: validations.moderators,
     motd: validations.motd,
     rank: validations.rank,
     autoModeration: validations.autoModeration,
     ads: validations.ads,
     userTrust: validations.userTrust,
     portal: validations.portal,
     limits: Joi.array().items({
       path: Joi.string().required(),
       method: Joi.string().valid('GET', 'PUT', 'POST', 'DELETE').required(),
       interval: Joi.number().min(-1).required(),
       maxInInterval: Joi.number().min(1).required(),
       minDifference: Joi.number().min(1).optional()
     }).sparse()
   }).required();

    var promise = new Promise(function(resolve, reject) {
     if (payload.permissions) {
       const { error, value } = schema.validate(payload.permissions, { stripUnknown: true })
       if (error) { return reject(Boom.badRequest(error)); }
       else {
         payload.permissions = value;
         return resolve();
       }
     }
     else { return resolve(); }
   });

    return promise;
 }
};

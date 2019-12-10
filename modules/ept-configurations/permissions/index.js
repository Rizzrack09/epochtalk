var Joi = require('@hapi/joi');

var allPermissions = {
  get: { allow: true },
  update: { allow: true }
};

var noPermissions = {};

module.exports = [{
  name: 'configurations',
  data: {
    validation: Joi.object({
      get: Joi.object({
        allow: Joi.boolean()
      }),
      update: Joi.object({
        allow: Joi.boolean()
      })
    }),

    layout: {
      get: { title: 'Allow User to fetch all forum configurations (Admin only)' },
      update: { title: 'Allow User to update all forum configurations (Admin only)' }
    },

    defaults: {
      superAdministrator: allPermissions,
      administrator: noPermissions,
      globalModerator: noPermissions,
      moderator: noPermissions,
      patroller: noPermissions,
      user: noPermissions,
      newbie: noPermissions,
      banned: noPermissions,
      anonymous: noPermissions,
      private: noPermissions
    }
  }
}];

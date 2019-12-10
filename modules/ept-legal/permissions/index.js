var Joi = require('@hapi/joi');

var allPermissions = {
  reset: { allow: true },
  text: { allow: true },
  update: { allow: true }
};

var noPermissions = {};

module.exports = [{
  name: 'legal',
  data: {
    validation: Joi.object({
      reset: Joi.object({
        allow: Joi.boolean()
      }),
      text: Joi.object({
        allow: Joi.boolean()
      }),
      update: Joi.object({
        allow: Joi.boolean()
      })
    }),

    layout: {
      reset: { title: 'Allow User to reset legal page text to default (Admin only)' },
      text: { title: 'Allow User to fetch legal page html for updating (Admin only)' },
      update: { title: 'Allow User to update legal page html (Admin only)' }
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

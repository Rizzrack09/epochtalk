var Joi = require('@hapi/joi');

var allPermissions = {
  page: { allow: true },
  create: { allow: true },
  delete: { allow: true }
};

var noCreatePermissions = {
  page: { allow: true },
  delete: { allow: true }
};

var noPermissions = {};

var mentions = {
  validation: Joi.object({
    page: Joi.object({
      allow: Joi.boolean()
    }),
    create: Joi.object({
      allow: Joi.boolean()
    }),
    delete: Joi.object({
      allow: Joi.boolean()
    })
  }),

  layout: {
    page: { title: 'Allow User to View Mentions' },
    create: { title: 'Allow User to Create Mentions' },
    delete: { title: 'Allow User to Delete Mentions' }
  },

  defaults: {
    superAdministrator: allPermissions,
    administrator: allPermissions,
    globalModerator: allPermissions,
    moderator: allPermissions,
    patroller: allPermissions,
    user: allPermissions,
    newbie: allPermissions,
    banned: noCreatePermissions,
    anonymous: noPermissions,
    private: noPermissions
  }
};

module.exports = [{
  name: 'mentions',
  data: mentions
}];

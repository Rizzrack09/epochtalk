var Joi = require('@hapi/joi');

/**
  * @apiVersion 0.4.0
  * @apiGroup Notifications
  * @api {GET} /notifications/counts Get Notifications counts
  * @apiName CountNotifications
  * @apiPermission User
  * @apiDescription Get the notifications counts for this user.
  *
  * @apiSuccess {object} notificationsCounts Object containing notification count information
  * @apiSuccess {number} notificationsCounts.message Number of message notifications
  * @apiSuccess {number} notificationsCounts.mention Number of mention notifications
  * @apiSuccess {number} notificationsCounts.other Number of other notifications
  *
  * @apiError (Error 500) InternalServerError There was an issue getting the notifications counts
  */
module.exports = {
  method: 'GET',
  path: '/api/notifications/counts',
  options: {
    auth: { strategy: 'jwt' },
    validate: {
      query: Joi.object({
        max: Joi.number()
      })
    },
    pre: [ { method: (request) => request.server.methods.auth.notifications.counts(request.server, request.auth) } ]
  },
  handler: function(request) {
    // get notifications counts for userId
    var userId = request.auth.credentials.id;
    var opts =  { max: request.query.max };

    var promise = request.db.notifications.counts(userId, opts)
    .error(request.errorMap.toHttpError);

    return promise;
  }
};

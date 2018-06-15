var Joi = require('joi');

/**
  * @apiVersion 0.4.0
  * @apiGroup Merit
  * @api {PUT} /merit Send Merit
  * @apiName SendMerit
  * @apiPermission User
  * @apiDescription Used to send merit to another user
  *
  * @apiParam (Payload) {string} to_user_id The id user being sent merit
  * @apiParam (Payload) {string} from_user_id The id of the user sending the merit
  * @apiParam (Payload) {string} post_id The id of the post being merited
  * @apiParam (Payload) {number} amount The amount of merit to send
  *
  * @apiSuccess {string} to_user_id The id user being sent merit
  * @apiSuccess {string} from_user_id The id of the user sending the merit
  * @apiSuccess {string} post_id The id of the post being merited
  * @apiSuccess {number} amount The amount of merit to send
  *
  * @apiError (Error 500) InternalServerError There was an issue sending merit
  */
var send = {
  method: 'PUT',
  path: '/api/merit',
  config: {
    auth: { strategy: 'jwt' },
    validate: {
      payload: Joi.object().keys({
        to_user_id: Joi.string().max(255).required(),
        post_id: Joi.string().max(255).required(),
        amount: Joi.number().required()
      })
    },
    pre: [ { method: 'auth.merit.send(server, auth, payload.to_user_id, payload.post_id, payload.amount)' } ]
  },
  handler: function(request, reply) {
    var toUserId = request.payload.to_user_id;
    var fromUserId = request.auth.credentials.id;
    var postId = request.payload.post_id;
    var amount = request.payload.amount;

    var promise = request.db.merit.send(fromUserId, toUserId, postId, amount)
    .error(request.errorMap.toHttpError);
    return reply(promise);
  }
};

/**
  * @apiVersion 0.4.0
  * @apiGroup Merit
  * @api {GET} /merit/:userId Get User Merit Statistics
  * @apiName GetMeritStats
  * @apiPermission User
  * @apiDescription Used to retrieve a users merit stats
  *
  * @apiParam {string} userId The id of the user whose merits stats to retrieve
  *
  * @apiSuccess {object[]} recently_sent Recently sent merit by this user
  * @apiSuccess {timestamp} recently_sent.time The time the merit was sent
  * @apiSuccess {number} recently_sent.amount The amount of merit sent
  * @apiSuccess {string} recently_sent.title The title of the merited post
  * @apiSuccess {string} recently_sent.username The author of the merited post
  * @apiSuccess {number} recently_sent.position The position of the merited post within its thread
  * @apiSuccess {string} recently_sent.post_id The id of the merited post
  * @apiSuccess {string} recently_sent.thread_id The id of the thread the post is within
  * @apiSuccess {object[]} recently_received Recently received merit by this user
  * @apiSuccess {timestamp} recently_received.time The time the merit was received
  * @apiSuccess {number} recently_received.amount The amount of merit received
  * @apiSuccess {string} recently_received.title The title of the merited post
  * @apiSuccess {string} recently_received.username The username of the user who sent the merit
  * @apiSuccess {number} recently_received.position The position of the merited post within its thread
  * @apiSuccess {string} recently_received.post_id The id of the merited post
  * @apiSuccess {string} recently_received.thread_id The id of the thread the post is within
  *
  * @apiError (Error 500) InternalServerError There was an issue fetching the users metric statistics
  */
var getUserStatistics = {
  method: 'GET',
  path: '/api/merit/{userId}',
  config: {
    auth: { strategy: 'jwt' },
    validate: {
      params: { userId: Joi.string().required() }
    },
    pre: [ { method: 'auth.merit.getUserStatistics(server, auth)' } ]
  },
  handler: function(request, reply) {
    var userId = request.params.userId;
    var authedUserPriority = request.server.plugins.acls.getUserPriority(request.auth);
    var promise = request.db.merit.getUserStatistics(userId, authedUserPriority)
    .error(request.errorMap.toHttpError);
    return reply(promise);
  }
};

var getStatistics = {
  method: 'GET',
  path: '/api/merit',
  config: {
    auth: { strategy: 'jwt' },
    validate: {
      query: { type: Joi.string().required().valid('recent', 'top_threads', 'top_threads_all', 'top_replies', 'top_replies_all', 'top_users', 'top_users_all', 'top_senders', 'top_senders_all', 'sources') }
    },
    pre: [ { method: 'auth.merit.getStatistics(server, auth)' } ]
  },
  handler: function(request, reply) {
    var type = request.query.type;
    var authedUserPriority = request.server.plugins.acls.getUserPriority(request.auth);
    var promise = request.db.merit.getStatistics(type, authedUserPriority)
    .error(request.errorMap.toHttpError);
    return reply(promise);
  }
};

var getLatestSourceRecords = {
  method: 'GET',
  path: '/api/merit/sources',
  config: {
    auth: { strategy: 'jwt' },
    pre: [ { method: 'auth.merit.getLatestSourceRecords(server, auth)' } ]
  },
  handler: function(request, reply) {
    var type = request.query.type;
    var promise = request.db.merit.getLatestSourceRecords()
    .error(request.errorMap.toHttpError);
    return reply(promise);
  }
};

var insertSource = {
  method: 'POST',
  path: '/api/merit/sources',
  config: {
    auth: { strategy: 'jwt' },
    validate: {
      payload: Joi.object().keys({
        user_id: Joi.string().max(255).required(),
        amount: Joi.number().required()
      })
    },
    pre: [ { method: 'auth.merit.insertSource(server, auth)' } ]
  },
  handler: function(request, reply) {
    var userId = request.payload.user_id;
    var amount = request.payload.amount;

    var promise = request.db.merit.insertSource(userId, amount)
    .error(request.errorMap.toHttpError);
    return reply(promise);
  }
};

module.exports = [ send, getUserStatistics, getStatistics, getLatestSourceRecords, insertSource ];

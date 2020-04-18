var Joi = require('@hapi/joi');
var _ = require('lodash');

/**
  * @apiDefine MessageObjectSuccess
  * @apiSuccess {string} id The unique id of the message
  * @apiSuccess {string} conversation_id The unique id of the conversation this message belongs to
  * @apiSuccess {string} sender_id The unique id of the user that sent this message
  * @apiSuccess {string} receiver_ids The unique ids of the users that will receive this message
  * @apiSuccess {object} content The contents of this message
  * @apiSuccess {string} content.body The raw contents of this message
  * @apiSuccess {string} content.body_html The html contents of this message
  * @apiSuccess {string} content.subject The subject of this message
  * @apiSuccess {timestamp} created_at Timestamp of when the conversation was created
  */

/**
  * @apiVersion 0.4.0
  * @apiGroup Conversations
  * @api {POST} /conversations Create
  * @apiName CreateConversation
  * @apiPermission User
  * @apiDescription Used to create a new conversation and the first message of the conversation.
  *
  * @apiParam (Payload) {string} receiver_ids The id of the users receiving the message/conversation
  * @apiParam (Payload) {object} content The contents of this message
  * @apiParam (Payload) {string} content.body The raw contents of this message
  * @apiParam (Payload) {string} content.body_html The html contents of this message
  * @apiParam (Payload) {string} content.subject The subject of this message
  *
  * @apiUse MessageObjectSuccess
  *
  * @apiError (Error 500) InternalServerError There was an issue creating the conversation
  */
module.exports = {
  method: 'POST',
  path: '/api/conversations',
  options: {
    auth: { strategy: 'jwt' },
    plugins: { track_ip: true },
    validate: {
      payload: Joi.object({
        receiver_ids: Joi.array().items(Joi.string()).min(1).required(),
        content: Joi.object({
          body: Joi.string().min(1).max(5000).required(),
          body_html: Joi.string(),
          subject: Joi.string().min(1).max(255).required()
        })
      })
    },
    pre: [
      { method: (request) => request.server.methods.auth.conversations.create(request.server, request.auth, request.payload.receiver_ids) },
      { method: (request) => request.server.methods.common.posts.checkPostLength(request.server, request.payload.body) },
      { method: (request) => request.server.methods.common.posts.clean(request.sanitizer, request.payload) },
      { method: (request) => request.server.methods.common.posts.parse(request.parser, request.payload) },
      { method: (request) => request.server.methods.common.images.sub(request.payload) }
    ]
  },
  handler: function(request) {
    // create the conversation in db
    var promise = request.db.conversations.create(request.auth.credentials.id)
    .then(function(conversation) {
      var message = request.payload;
      message.conversation_id = conversation.id;
      message.sender_id = request.auth.credentials.id;
      return message;
    })
    .then(request.db.messages.create)
    .tap(function(dbMessage) {
      var messageClone = _.cloneDeep(dbMessage);
      request.payload.receiver_ids.forEach(function(receiverId) {
        var notification = {
          type: 'message',
          sender_id: request.auth.credentials.id,
          receiver_id: receiverId,
          channel: { type: 'user', id: receiverId },
          data: {
            action: 'newMessage',
            messageId: messageClone.id,
            conversationId: messageClone.conversation_id
          }
        };
        request.server.plugins.notifications.spawnNotification(notification);
      });
    })
    .error(request.errorMap.toHttpError);

    return promise;
  }
};

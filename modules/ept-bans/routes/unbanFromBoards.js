var Joi = require('@hapi/joi');

/**
  * @apiVersion 0.4.0
  * @apiGroup Bans
  * @api {PUT} /users/unban/board (Admin) Unban From Boards
  * @apiName UnbanFromBoardsAdmin
  * @apiPermission Super Administrator, Administrator, Global Moderator, Moderator
  * @apiDescription This allows Administrators and Moderators to unban users from boards.
  *
  * @apiParam (Payload) {string} user_id The unique id of the user to unban from boards
  * @apiParam (Payload) {string[]} board_ids Array of board ids to unban the user from
  *
  * @apiSuccess {string} user_id The unique id of the user being unbanned from boards
  * @apiSuccess {string[]} board_ids Array of board ids to unban the user from
  *
  * @apiError (Error 500) InternalServerError There was an error unbanning the user from Boards
  * @apiError (Error 403) Forbidden User tried to unban from a board they do not moderate, or tried
  * to unban a user with higher permissions than themselves
  */
module.exports = {
  method: 'PUT',
  path: '/api/users/unban/boards',
  options: {
    auth: { strategy: 'jwt' },
    plugins: {
      mod_log: {
        type: 'bans.unbanFromBoards',
        data: {
          user_id: 'payload.user_id',
          board_ids: 'payload.board_ids'
        }
      }
    },
    validate: {
      payload: Joi.object({
        user_id: Joi.string().required(),
        board_ids: Joi.array().items(Joi.string().required()).unique().min(1).required()
      })
    },
    pre: [ { method: (request) => request.server.methods.auth.bans.banFromBoards(request.server, request.auth, request.payload.user_id, request.payload.board_ids) } ]
  },
  handler: function(request) {
    var userId = request.payload.user_id;
    var boardIds = request.payload.board_ids;
    var promise = request.db.bans.unbanFromBoards(userId, boardIds)
    .tap(function(user) {
      var notification = {
        channel: { type: 'user', id: user.user_id },
        data: { action: 'reauthenticate' }
      };
      request.server.plugins.notifications.systemNotification(notification);
    })
    .error(request.errorMap.toHttpError);

    return promise;
  }
};

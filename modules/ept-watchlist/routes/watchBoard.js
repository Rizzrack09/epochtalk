var Joi = require('@hapi/joi');

/**
  * @apiVersion 0.4.0
  * @apiGroup Watchlist
  * @api {POST} /watchlist/boards/:id Watch Board
  * @apiName WatchBoard
  * @apiPermission User
  * @apiDescription Used to mark a user as watching a board.
  *
  * @apiParam {string} id The unique id of the board being watched
  *
  * @apiSuccess {object} status 200 OK
  *
  * @apiError (Error 500) InternalServerError There was an issue watching the board
  */
module.exports = {
  method: 'POST',
  path: '/api/watchlist/boards/{id}',
  options: {
    auth: { strategy: 'jwt' },
    validate: { params: Joi.object({ id: Joi.string().required() }) },
    pre: [ { method: (request) => request.server.methods.auth.watchlist.watchBoard(request.server, request.auth, request.params.id) }]
  },
  handler: function(request) {
    var userId = request.auth.credentials.id;
    var boardId = request.params.id;
    var promise = request.db.watchlist.watchBoard(userId, boardId)
    .error(request.errorMap.toHttpError);

    return promise;
  }
};

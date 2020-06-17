var Joi = require('@hapi/joi');
var Promise = require('bluebird');

/**
  * @apiVersion 0.4.0
  * @apiGroup Boards
  * @api {POST} /boards/:id Update
  * @apiName UpdateBoard
  * @apiPermission Super Administrator, Administrator
  * @apiDescription Used to update an existing information for boards
  *
  * @apiParam (Payload) {object[]} boards Array containing the boards to create
  * @apiParam (Payload) {string} id The board id
  * @apiParam (Payload) {string{1..255}} name The name for the board
  * @apiParam (Payload) {string{0..255}} description The description text for the board
  * @apiParam (Payload) {number} viewable_by The minimum priority required to view the board, null for no restriction
  * @apiParam (Payload) {number} postable_by The minimum priority required to post in the board, null for no restriction
  *
  * @apiUse BoardObjectSuccess
  *
  * @apiError (Error 500) InternalServerError There was an issue updating the boards
  */
module.exports = {
  method: 'PUT',
  path: '/api/boards',
  options: {
    auth: { strategy: 'jwt' },
    plugins: {
      mod_log: {
        type: 'boards.update',
        data: { boards: 'payload' }
      }
    },
    validate: {
      payload: Joi.array().items(Joi.object({
        id: Joi.string().required(),
        name: Joi.string().min(1).max(255),
        description: Joi.string().max(255).allow(''),
        viewable_by: Joi.number().allow(null),
        postable_by: Joi.number().allow(null),
        right_to_left: Joi.boolean().default(false),
        disable_post_edit: Joi.number().min(0).max(99999)
      })).unique().min(1)
    },
    pre: [
      { method: (request) => request.server.methods.auth.boards.update(request.server, request.auth) },
      { method: (request) => request.server.methods.common.boards.clean(request.sanitizer, request.payload) },
    ]
  },
  handler: function(request) {
    var boards = request.payload.map(function(board) {
      // create each board
      board.meta = { disable_post_edit: board.disable_post_edit };
      delete board.disable_post_edit;
      return board;
    });

    // update each board
    var promise = Promise.map(boards, function(board) {
      return request.db.boards.update(board);
    })
    .error(request.errorMap.toHttpError);

    return promise;
  }
};

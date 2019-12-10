var Joi = require('@hapi/joi');

/**
  * @apiVersion 0.4.0
  * @apiGroup Threads
  * @api {POST} /threads/:id Mark Thread Viewed
  * @apiName ViewThread
  * @apiDescription Used to mark a thread as viewed
  *
  * @apiParam {string} id The unique id of the thread to mark as viewed
  *
  * @apiSuccess {object} success 200 OK
  *
  * @apiError (Error 500) InternalServerError There was an issue marking the thread viewed
  */
module.exports = {
  method: 'POST',
  path: '/api/threads/{id}/viewed',
  options: {
    auth: { mode: 'try', strategy: 'jwt' },
    validate: { params: Joi.object({ id: Joi.string().required() }) },
    pre: [
      [ { method: (request) => request.server.methods.auth.threads.viewed(request.server, request.auth, request.params.id) } ],
      [
        { method: (request) => request.server.methods.common.threads.checkView(request.server, request.headers, request.info, request.params.id), assign: 'newViewId' },
        { method: (request) => request.server.methods.common.threads.updateView(request.server, request.auth, request.params.id) }
      ]
    ]
  },
  handler: function(request, h) {
    var newViewerId = request.pre.newViewId;
    const response = h.response('200 OK');
    response.code(200);
    if (newViewerId) { response.header('Epoch-Viewer', newViewerId); }
    return response;
  }
};

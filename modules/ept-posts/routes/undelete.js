var Joi = require('@hapi/joi');

/**
  * @apiVersion 0.4.0
  * @apiGroup Posts
  * @api {POST} /posts/:id Undelete
  * @apiName UndeletePost
  * @apiPermission User (Post's Author) or Admin
  * @apiDescription Used to undo a deleted post.
  *
  * @apiParam {string} id The Id of the post to undo deletion on
  *
  * @apiUse PostObjectSuccess
  * @apiSuccess {number} position The position of the post within the thread
  * @apiSuccess {timestamp} updated_at The updated at timestamp of the post
  * @apiSuccess {timestamp} imported_at The imported at timestamp of the post
  *
  * @apiError (Error 500) InternalServerError There was an issue undeleting the post
  */
module.exports = {
  method: 'POST',
  path: '/api/posts/{id}/undelete',
  options: {
    auth: { strategy: 'jwt' },
    plugins: {
      mod_log: {
        type: 'posts.undelete',
        data: { id: 'params.id' }
      }
    },
    validate: { params: Joi.object({ id: Joi.string().required() }) },
    pre: [ { method: (request) => request.server.methods.auth.posts.delete(request.server, request.auth, request.params.id)} ],
    handler: function(request) {
      var promise = request.db.posts.undelete(request.params.id)
      .tap(function(post) {
        var email;
        if (post.user_id !== request.auth.credentials.id) {
          request.db.users.find(post.user_id)
          .then(function(user) {
            email = user.email;
            return request.db.threads.find(post.thread_id);
          })
          .then(function(thread) {
            var config = request.server.app.config;
            var emailParams = {
              email: email,
              mod_username: request.auth.credentials.username,
              thread_name: thread.title,
              site_name: config.website.title,
              thread_url: config.publicUrl + '/threads/' + thread.slug + '/posts?start=' + post.position + '#' + post.id,
              action: 'unhidden'
            };
            request.server.log('debug', emailParams);
            request.emailer.send('postUpdated', emailParams)
            .catch(console.log);
            return;
          });
        }
        return;
      })
      .error(request.errorMap.toHttpError);
      return promise;
    }
  }
};

var Joi = require('joi');
var path = require('path');
var Boom = require('boom');
var common = require(path.normalize(__dirname + '/../common'));

module.exports = {
  method: 'GET',
  path: '/api/posts/patrol',
  options: {
    auth: { strategy: 'jwt' },
    validate: {
      query: Joi.object().keys({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100).default(25)
      }).without('start', 'page')
    },
    pre: [
      { method: (request) => request.server.methods.auth.posts.patrol(request.auth), assign: 'viewables' },
      { method: (request) => request.server.methods.hooks.preProcessing(request) },
      [
        { method: (request) => request.server.methods.hooks.parallelProcessing(request), assign: 'parallelProcessed' },
        { method: processing, assign: 'processed' },
      ],
      { method: (request) => request.server.methods.hooks.merge(request) },
      { method: (request) => request.server.methods.common.posts.parseOut(request.parser, request.pre.processed.posts) },
      { method: (request) => request.server.methods.hooks.postProcessing(request) }
    ],
    handler: function(request) {
      return request.pre.processed;
    }
  }
};

function processing(request) {
  // ready parameters
  var userId = request.auth.credentials.id;
  var opts = {
    page: request.query.page,
    limit: request.query.limit + 1 // check if there are more posts
  };

  // retrieve posts for this thread
  var promise = request.db.posts.patrol(opts)
  .then(function(posts) {
    // hasMoreCheck
    var hasMorePosts = false;
    if (posts.length > request.query.limit) {
      hasMorePosts = true;
      posts.pop();
    }

    return {
      limit: request.query.limit,
      page: request.query.page,
      hasMorePosts: hasMorePosts,
      posts: common.cleanPosts(posts, userId, true, request, false, true)
    };
  })
  // handle page or start out of range
  .then(function(ret) {
    var retVal = Boom.notFound();
    if (ret.posts.length > 0) { retVal = ret; }
    return retVal;
  })
  .error(request.errorMap.toHttpError);

  return promise;
}


var Boom = require('boom');
var Promise = require('bluebird');

module.exports = function postsByThread(server, auth, slug) {
  // check base permission
  var allowed = server.authorization.build({
    error: Boom.forbidden(),
    type: 'hasPermission',
    server: server,
    auth: auth,
    permission: 'posts.byThread.allow'
  });

  // read board
  var read = server.authorization.build({
    error: Boom.notFound('Board Not Found'),
    type: 'dbValue',
    method: server.db.threads.getThreadsBoardInBoardMapping,
    args: [null, server.plugins.acls.getUserPriority(auth), slug]
  });

  return Promise.all([allowed, read])
  .then(() => { return true; })
  .catch(() => { return false; });
};

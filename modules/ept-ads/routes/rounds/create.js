var Boom = require('boom');
var path = require('path');
var db = require(path.normalize(__dirname + '/../../db'));

function auth(request) {
  var promise = request.server.authorization.build({
    error: Boom.forbidden(),
    type: 'hasPermission',
    server: request.server,
    auth: request.auth,
    permission: 'ads.roundCreate.allow'
  });

  return promise;
}

/**
  * @apiVersion 0.4.0
  * @apiGroup Ads
  * @api {POST} /ads/rounds Create Ad Round
  * @apiName CreateRoundAds
  * @apiPermission Super Administrator, Administrator
  * @apiDescription Used to create a new ad round
  *
  * @apiSuccess {number} round The number of the round which was created
  *
  * @apiError (Error 500) InternalServerError There was an error creating the ad round
  */
module.exports = {
  method: 'POST',
  path: '/api/ads/rounds',
  options: {
    auth: { strategy: 'jwt' },
    pre: [ { method: auth } ]
  },
  handler: function(request) {
    var promise = db.rounds.create()
    .error(request.errorMap.toHttpError);

    return promise;
  }
};

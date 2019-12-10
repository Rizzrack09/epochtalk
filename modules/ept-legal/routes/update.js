var Joi = require('@hapi/joi');
var path = require('path');
var fse = require('fs-extra');
var Promise = require('bluebird');
var baseCustomPath = __dirname + '/../../../content/legal/';

/**
  * @apiVersion 0.4.0
  * @apiGroup Legal
  * @api {PUT} /api/legal (Admin) Update
  * @apiName UpdateLegal
  * @apiDescription Used to update all legal text: ToS, privacy policy, disclaimers.
  *
  * @apiParam (Payload) {string} [tos] The updated Terms of Service.
  * @apiParam (Payload) {string} [privacy] The updated privacy policy.
  * @apiParam (Payload) {string} [disclaimer] The updated disclaimer.
  *
  * @apiSuccess {object} success 200 OK
  *
  * @apiError (Error 500) InternalServerError There was an issue retrieving the ToS, privacy policy and disclaimer.
  *
  */
module.exports = {
  method: 'PUT',
  path: '/api/legal',
  options: {
    auth: { strategy: 'jwt' },
    validate: {
      payload: Joi.object({
        tos: Joi.string().allow(''),
        privacy: Joi.string().allow(''),
        disclaimer: Joi.string().allow('')
      })
    },
    pre: [ { method: (request) => request.server.methods.auth.legal.update(request.server, request.auth) } ]
  },
  handler: function(request) {
    var writeFile = function(path, text) {
      return new Promise(function(resolve, reject) {
        fse.outputFile(path, text, function(err) {
          if (err) { return reject(err); }
          else { return resolve(); }
        });
      });
    };

    var tosCustomPath = path.normalize(baseCustomPath + 'tos.txt');
    var writeTos = writeFile(tosCustomPath, request.payload.tos);

    var privacyCustomPath = path.normalize(baseCustomPath + 'privacy.txt');
    var writePrivacy = writeFile(privacyCustomPath, request.payload.privacy);

    var disclaimerCustomPath = path.normalize(baseCustomPath + 'disclaimer.txt');
    var writeDisclaimer = writeFile(disclaimerCustomPath, request.payload.disclaimer);

    var promise = Promise.join(writeTos, writePrivacy, writeDisclaimer, function() { return 'Success 200'; })
    .error(request.errorMap.toHttpError);

    return promise;
  }
};

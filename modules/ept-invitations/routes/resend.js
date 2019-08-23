var Joi = require('joi');

/**
  * @api {POST} /invites/resend Resend
  * @apiName ResendInvitation
  * @apiGroup Users
  * @apiVersion 0.4.0
  * @apiDescription Used to resend an invitation to a user
  *
  * @apiParam (Payload) {string} email User's email address
  *
  * @apiSuccess {string} message Invitation sent success message
  * @apiSuccess {string} confirm_token Invitation confirmation token
  *
  * @apiError BadRequest There was an error resending the invitation
  */
module.exports = {
  method: 'POST',
  path: '/api/invites/resend',
  options: {
    auth: { strategy: 'jwt' },
    validate: {
      payload: { email: Joi.string().email().required() }
    },
    pre: [ { method: (request) => request.server.methods.auth.invitations.resend(request.server, request.auth, request.payload.email) } ]
  },
  handler: function(request) {
    // save invitation
    var promise = request.db.invitations.find(request.payload.email)
    // send invitation email
    .then(function(invitation) {
      var config = request.server.app.config;
      var inviteUrl = `${config.publicUrl}/join?token=${invitation.hash}&email=${invitation.email}`;
      var emailParams = {
        email: invitation.email,
        site_name: config.website.title,
        invite_url: inviteUrl
      };
      request.server.log('debug', emailParams);
      request.emailer.send('invite', emailParams);
      return {
        message: 'Successfully Resent Invitation',
        confirm_token: invitation.hash
      };
    })
    .error(request.errorMap.toHttpError);

    return promise;
  }
};

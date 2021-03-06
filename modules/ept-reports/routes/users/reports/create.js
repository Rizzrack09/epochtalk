var Joi = require('@hapi/joi');

/**
  * @apiVersion 0.4.0
  * @apiGroup Reports
  * @api {POST} /reports/users Create User Report
  * @apiName CreateUserReport
  * @apiPermission User
  * @apiDescription Used to report a user for moderators/administrators to review.
  *
  * @apiParam (Payload) {string} reporter_reason The reporter's reason for reporting the offending user
  * @apiParam (Payload) {string} offender_user_id The unique id of the user being reported
  *
  * @apiSuccess {string} id The unique id of the user report which was created
  * @apiSuccess {string} status The status of the report
  * @apiSuccess {string} reporter_user_id The unique id of the user initiating the report
  * @apiSuccess {string} reporter_reason The reporter's reason for reporting the offending user
  * @apiSuccess {string} reviewer_user_id The unique id of the user reviewing the report
  * @apiSuccess {string} offender_user_id The unique id of the user being reported
  * @apiSuccess {timestamp} created_at Timestamp of when the user report was created
  * @apiSuccess {timestamp} updated_at Timestamp of when the user report was updated
  *
  * @apiError (Error 500) InternalServerError There was an issue reporting the user
  */
module.exports = {
  method: 'POST',
  path: '/api/reports/users',
  options: {
    auth: { strategy: 'jwt' },
    validate: {
      payload: Joi.object({
        reporter_reason: Joi.string().max(255).required(),
        offender_user_id: Joi.string().required()
      })
    },
    pre: [ { method: (request) => request.server.methods.auth.reports.users.reports.create(request.server, request.auth) } ],
  },
  handler: function(request) {
    var report = request.payload;
    report.reporter_user_id = request.auth.credentials.id;
    var promise = request.db.reports.createUserReport(report)
    .error(request.errorMap.toHttpError);

    return promise;
  }
};

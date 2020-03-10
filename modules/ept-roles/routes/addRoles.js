var Joi = require('@hapi/joi');

/**
  * @apiVersion 0.4.0
  * @apiGroup Roles
  * @api {POST} /admin/roles/add Add Roles
  * @apiName AddRoles
  * @apiPermission Super Administrator, Administrator
  * @apiDescription Add a new role.
  *
  * @apiParam (Payload) {string} [id] The id of the role to add, for hardcoded ids.
  * @apiParam (Payload) {string} name The name of the role to add.
  * @apiParam (Payload) {string} description The description of the role to add.
  * @apiParam (Payload) {string} priority The priorty of the role to add.
  * @apiParam (Payload) {string} [highlight_color] The highlight color of the role to add.
  * @apiParam (Payload) {Object} permissions The permission set for this role.
  *
  * @apiSuccess {string} id The unique id of the added role.
  *
  * @apiError (Error 400) BadRequest There name of the role must be unique.
  * @apiError (Error 500) InternalServerError There was an issue adding the role.
  */
module.exports = {
  method: 'POST',
  path: '/api/admin/roles/add',
  options: {
    auth: { strategy: 'jwt' },
    plugins: {
      mod_log: {
        type: 'adminRoles.add',
        data: {
          id: 'payload.id',
          name: 'payload.name',
          description: 'payload.description'
        }
      }
    },
    validate: {
      payload: Joi.object({
        id: Joi.string(),
        name: Joi.string().min(1).max(255).required(),
        description: Joi.string().min(1).max(1000).required(),
        priority: Joi.number().min(0).max(Number.MAX_VALUE).required(),
        highlight_color: Joi.string(),
        permissions: Joi.object().required()
      })
    },
    pre: [ { method: (request) => request.server.methods.auth.roles.addRoles(request.server, request.auth, request.roleValidations, request.payload) } ],
  },
  handler: function(request) {
    var role = request.payload;
    role.custom_permissions = role.permissions;
    delete role.permissions;
    var promise = request.db.roles.create(role)
      .then(function(result) {
        role.id = result.id;
        role.lookup = result.id;
        // Swap back custom permissions for auth
        role.permissions = role.custom_permissions;
        // Add role to the in memory role object
        request.rolesAPI.addRole(role);
        return result;
      })
      .error(request.errorMap.toHttpError);

    return promise;
  }
};

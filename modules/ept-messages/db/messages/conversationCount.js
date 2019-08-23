var path = require('path');
var dbc = require(path.normalize(__dirname + '/../db'));
var helper = dbc.helper;
var db = dbc.db;

module.exports = function(userId) {
  userId = helper.deslugify(userId);

  // count conversations by this user
  var q = 'SELECT DISTINCT ON (conversation_id) conversation_id FROM messages.private_messages WHERE $1 != ALL(deleted_by_user_ids) AND (sender_id = $1 OR $1 = ANY(receiver_ids))';
  return db.sqlQuery(q, [userId])
  .then(function(rows) { return rows.length; });
};

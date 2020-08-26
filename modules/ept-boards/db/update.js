var path = require('path');
var Promise = require('bluebird');
var dbc = require(path.normalize(__dirname + '/db'));
var db = dbc.db;
var helper = dbc.helper;
var using = Promise.using;
var errors = dbc.errors;
var NotFoundError = errors.NotFoundError;

module.exports = function(board) {
  return using(db.createTransaction(), function(client) { return updateBoard(board, client) })
  .then(function() { return helper.slugify(board); })
  .catch(function(err) {
    if (err && err.constraint === 'boards_slug_index') {
      return handleSlugConflict(board);
    }
    else { throw err; }
  })
};

function handleSlugConflict(board) {
  return using(db.createTransaction(), function(client) {
    var hash = Math.random().toString(36).substring(9);
    board.slug = board.slug + '-' + hash;
    helper.slugify(board);
    return updateBoard(board, client);
  })
  .then(function() { return helper.slugify(board); });
}

function updateBoard(board, client) {
  board = helper.deslugify(board);
  var q = 'SELECT * FROM boards WHERE id = $1 FOR UPDATE';
  return client.query(q, [board.id])
  .then(function(results) {
    if (results.rows.length > 0) { return results.rows[0]; }
    else { throw new NotFoundError('Board Not Found'); }
  })
  .then(function(oldBoard) {
    board.name = board.name || oldBoard.name;
    board.slug = board.slug || oldBoard.slug;
    helper.updateAssign(board, oldBoard, board, 'description');
    helper.updateAssign(board, oldBoard, board, 'viewable_by');
    helper.updateAssign(board, oldBoard, board, 'postable_by');
    helper.updateAssign(board, oldBoard, board, 'right_to_left');
    helper.updateAssign(board, oldBoard, board, 'meta');
  })
  .then(function() {
    q = 'UPDATE boards SET name = $1, description = $2, viewable_by = $3, postable_by = $4, right_to_left = $5, meta = $6, slug = $7, updated_at = now() WHERE id = $8';
    params = [board.name, board.description || '', board.viewable_by, board.postable_by, board.right_to_left, board.meta, board.slug, board.id];
    return client.query(q, params);
  });
}

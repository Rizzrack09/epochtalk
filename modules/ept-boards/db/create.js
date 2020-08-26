var path = require('path');
var Promise = require('bluebird');
var dbc = require(path.normalize(__dirname + '/db'));
var db = dbc.db;
var helper = dbc.helper;
var using = Promise.using;

module.exports = function(board) {
  return using(db.createTransaction(), function(client) { return createBoard(board, client) })
  .then(function() { return helper.slugify(board); })
  .catch(function(err) {
    if (err && err.constraint === 'boards_slug_index') {
      return handleSlugConflict(board);
    }
    else { throw err; }
  });
};

function handleSlugConflict(board) {
  return using(db.createTransaction(), function(client) {
    var hash = Math.random().toString(36).substring(9);
    board.slug = board.slug + '-' + hash;
    helper.slugify(board);
    return createBoard(board, client);
  })
  .then(function() { return helper.slugify(board); });
}

function createBoard(board, client) {
  board = helper.deslugify(board);
  var q = 'INSERT INTO boards(name, slug, description, viewable_by, postable_by, right_to_left, meta, created_at) VALUES($1, $2, $3, $4, $5, $6, $7, now()) RETURNING id';
  var params = [board.name, board.slug, board.description, board.viewable_by, board.postable_by, board.right_to_left, board.meta];
  return client.query(q, params)
  .then(function(results) { board.id = results.rows[0].id; })
  // insert new board metadata
  .then(function() {
    q = 'INSERT INTO metadata.boards (board_id) VALUES ($1)';
    return client.query(q, [board.id]);
  });
}

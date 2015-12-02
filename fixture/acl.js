var _ = require('lodash');

module.exports = function(db) {
  var toKnex = require('../logic/knex')(db);

  function locks(entity, done) {
    var locks = [];

    // every user with 'view_content' role
    locks.push({ lock: 'role', key: 'role=view_content', read: true });

    // only owner can write
    locks.push({ lock: 'owner', key: 'user='+entity.owner, read: true, write: true });

    done(null, locks);
  }

  function keychain(user, done) {
    var keys = [];
    keys.push('user='+user.id);

    if (_.include(user.roles, 'view_content')) {
      keys.push('role=view_content');
    }

    done(null, keys);
  }

  function list(xpr) {
    return xpr.or('owner', 'role');
  }

  function query(opts, done) {
    done(null, toKnex(opts, list)());
  }

  return {
    locks: locks,
    keychain: keychain,
    list: list,
    query:query
  }
};

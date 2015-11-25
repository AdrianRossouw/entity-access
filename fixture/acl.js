var _ = require('lodash');

module.exports = function(db) {
  var eaKnex = require('entity-access-knex')(db);

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

  function list(acl) {
    acl.locks(['owner', 'role']);
    return acl.or('owner', 'role');
  },

  function query(opts, done) {
    done(null, eaKnex(list, opts));
  }

  return {
    locks: locks,
    keychain: keychain,
    list: list,
    query:query
  }
};

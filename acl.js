var _ = require('lodash');
var assert = require('assert');
var Promise = require('bluebird');

module.exports = function (db) {
  var q = require('./queries')(db);

  return function (queries, acl, entity, key) {
    assert.ok(entity, 'entity required');
    key = key || 'id';

    var _acl = _.extend({}, acl, {
      locks: function(ent, done) {
        var defaults = {
          entityId: ent.id,
          entity: entity,
          read: false,
          write: false,
          remove: false
        };

        acl.locks(ent, function(err, locks) {
          var _locks = _(locks)
            .map(_.partial(_.defaults, _, defaults))
            .filter(_filterAllowed)
            .value();

          done(null, _locks);
        });
      }
    });

    // convert async functions to promises
    var promised = {
      locks: Promise.promisify(_acl.locks),
      keychain: Promise.promisify(_acl.keychain),
      query: Promise.promisify(_acl.query)
    };

    function setPermissionWhere(knex, access, opts) {
      // checking context here to determine if we need to add ACLs
      if (!opts || !opts.user$) { return knex; }
      opts.q = opts.q || {};

      // query functions are node-style callbacks, but this
      // needs to return a promise.
      return promised.keychain(opts.user$)
        .then(function (keychain) {
          return _.extend({}, opts, {
            keychain: keychain,
            access: access,
            entity: entity,
            key: key
          });
        })
        .then(promised.query)
        .then(function (subselect) {
          return knex.whereIn(key, subselect);
        });
    }

    function regenerateLocks(opts) {
      var entityId = _.get(opts, 'ent.id');

      // remove all current ace entries
      return function (rows) {
        if (key !== 'id') { return rows; }

        return promised.locks(opts.ent)
          .then(_removeLocks)
          .each(q.insert)
          .thenReturn(rows);
      };


      function _removeLocks(locks) {
        var args = { entityId: entityId, entity: entity  };
        return q.remove(args).thenReturn(locks);
      }
    }

    return _.extend({}, queries, {
      list: function (opts) {
        var knex = queries.list(opts);
        return setPermissionWhere(knex, 'read', opts);
      },
      load: function (opts) {
        var knex = queries.load(opts);
        return setPermissionWhere(knex, 'read', opts);
      },
      insert: function (opts) {
        return queries.insert(opts).then(regenerateLocks(opts));
      },
      update: function (opts) {
        return queries.update(opts).then(regenerateLocks(opts));
      },
      acl: _acl
    });
  };
};

function _filterAllowed(lock) {
  return (lock.key && lock.lock && (lock.read || lock.write || lock.remove));
}

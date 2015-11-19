var _ = require('lodash');

module.exports = function(db) {
  return {
    locks: function(entity, done) {
      var locks = [];

      // every user with 'view_content' role
      locks.push({
        lock: 'role',
        key: 'role=view_content',
        read: true
      });

      // only owner can write
      locks.push({
        lock: 'owner',
        key: 'user='+entity.owner,
        read: true,
        write: true
      });

      done(null, locks);
    },

    keychain: function(user, done) {
      var keys = [];
      keys.push('user='+user.id);

      if (_.include(user.roles, 'view_content')) {
        keys.push('role=view_content');
      }

      done(null, keys);
    },
    query: function(opts, done) {
      var knex = db('acl as owner')
        .select('owner.entity_id');

      knex.where('owner.entity', opts.entity)
        .where('owner.lock', 'owner')
        .where('owner.'+ opts.access, true);

      knex.leftJoin('acl as role', 'role.entity_id', 'owner.entity_id')
        .where('role.entity', opts.entity)
        .where('role.lock', 'role')
        .where('role.'+ opts.access, true);

      knex.where(function() {
        var knex = this;

        knex.whereIn('owner.key', opts.keychain);
        knex.orWhereIn('role.key', opts.keychain);
      });

      done(null, knex);
    }
  };
};

var _ = require('lodash');

module.exports = function(db) {
  return function(opts, fn) {
    var locks = [];

    return function() {
      locks = [];
      var matchQuery = fn({ and: and,  or: or, not: not });

      // The first table needs to be selected, not joined.
      var firstLock = _.first(locks);

      var knex = db('acl as ' + firstLock).select(firstLock + '.entity_id');

      // join all the needed tables
      _.each(locks, addJoins(knex));

      function addJoins(knex) {
        return function(lock, k) {
          // first table is already selected from
          k && knex.leftJoin(
            'acl as ' + lock,
            lock + '.entity_id',
            firstLock+'.entity_id'
          );

          var join = {};
          join[lock + '.entity'] = opts.entity;
          join[lock + '.lock'] = lock;
          join[lock + '.'+ opts.access] = true;

          knex.where(join);
        };
      }

      knex.where(function() {
        matchQuery.call(this);
      });

      return knex;
    }

    function and() {
      var args = arguments;

      _trackLocks(args);

      return function() {
        var knex = this;
        _.each(args, function(cnd) {
          if (_.isString(cnd)) {
            knex.whereIn(cnd + '.key', opts.keychain);
          } else {
            knex.where(cnd);
          }
        })
      }
    }

    function or() {
      var args = arguments;

      _trackLocks(args);

      return function() {
        var knex = this;

        _.each(args, function(cnd) {
          if (_.isString(cnd)) {
            knex.orWhereIn(cnd + '.key', opts.keychain);
          } else {
            knex.orWhere(cnd);
          }
        })
      }

    }

    function not() {
      var args = arguments;

      _trackLocks(args);

      return function() {
        var knex = this;

        _.each(args, function(cnd) {
          if (_.isString(cnd)) {
            knex.whereNotIn(cnd + '.key', opts.keychain);
          } else {
            knex.where(cnd);
          }
        })
      }
    }

    function _trackLocks(args) {
      _.each(args, function(cnd) {
        if (_.isString(cnd) && !~locks.indexOf(cnd)) {
          locks.push(cnd);
        }
      });
    }
  }
};

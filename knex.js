var _ = require('lodash');
module.exports = function(db) {
  return function(logic, locks, opts) {
    var firstLock = locks.shift();

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
    var callback = _.identity;

    knex.where(function() {
      callback.call(this);
    });


    logic({ and: and,  or: or, not: not });

    return function() {
      return knex;
    }
    

    function processCondition(onCondition, onNest) {
      return function() {
        var conditions = arguments;

        callback = _.wrap(callback, function(fn) {
          var knex = this;

          _.each(conditions, function(cnd) {
            if (_.isString(cnd)) {
              onCondition.call(knex, cnd);
            } else {
              onNest.call(knex, cnd);
            }
          });

          fn.call(this);
        });
      }
    }

    function and() {
      return processCondition(
        function(cnd) {  this.whereIn(cnd + '.key', opts.keychain); },
        function(cnd) { console.log(cnd);  this.where(function() { cnd.apply(this, arguments) }); }
      ).apply(this, arguments);
    }

    function or() {
      return processCondition(
          function(cnd) {  this.orWhereIn(cnd + '.key', opts.keychain); },
          function(cnd) {  console.log(cnd); this.orWhere(function() { cnd.apply(this, arguments); }) }
      ).apply(this, arguments);
    }

    function not() {
      return processCondition(
          function(cnd) {  this.whereNotIn(cnd + '.key', opts.keychain); },
          function(cnd) {  console.log(cnd); this.whereNot(function() { cnd.apply(this, arguments); }); }
      ).apply(knex, arguments);
    }

  }
}

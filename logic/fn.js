var _ = require('lodash');

module.exports = function(opts, fn) {
  var acl = opts.acl;

  return function access(user, ent, access, done) {
    acl.locks(ent, function(err, locks) {
      acl.keychain(user, function(err, keys) {

        if (fn(logic(locks, keys, access))()) {
          return done();
        } else {
          done("validation failed");
        }
      });
    });
  }

  function logic(locks, keys, access) {

    function and() {
      return _.partial(_.every, arguments, _matchFn);
    }

    function or() {
      return _.partial(_.some, arguments, _matchFn);
    }

    function not() {
      var args = arguments;
      return function() {
        return !_.every(args, _matchFn);
      };
    }

    return { and: and,  or: or, not: not };

    function _matchFn(cnd) {
      if (!_.isString(cnd)) { return cnd(); }

      var match = { entity: opts.entity, lock: cnd };
      match[access] = true;

      var _locks = _(locks).filter(match).map('key').value();

      return !!_.intersection(_locks, keys).length;
    }
  }
};

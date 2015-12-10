var _ = require('lodash');
module.exports = function(opts, fn) {

  return function toJSON() {
    return fn({ and: and,  or: or, not: not });
  }

  function and() {
    return ['AND'].concat(_.toArray(arguments));
  }

  function or() {
    return ['OR'].concat(_.toArray(arguments));
  }

  function not() {
    return ['NOT'].concat(_.toArray(arguments));
  }

};

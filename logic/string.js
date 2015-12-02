var _ = require('lodash');

module.exports = function(opts, fn) {

  return function toString() {
    return fn({ and: and,  or: or, not: not });
  }

  function and() {
    return '(' + _(arguments).join(' and ') + ')';
  }
  function or() {
    return '(' + _(arguments).join(' or ') + ')';
  }

  function not() {
    return '(not ' + _(arguments).join(' and not ') + ')';
  }

};

module.exports = function(opts, fn) {

  return function toJSON() {
    return fn({ and: and,  or: or, not: not });
  }

  function and() {
    return ['AND'].concat(arguments);
  }

  function or() {
    return ['OR'].concat(arguments);
  }

  function not() {
    return ['NOT'].concat(arguments);
  }

};

var assert = require('assert');
var toString = require('./string');

var opts = {
  access: 'read',
  entity: 'blog',
  keychain: ['user=test-user']
}

describe('simple conditionals', function() {
  it('and locks', function() {
    var result = toString(opts, function(xpr) {
      return xpr.and('user', 'role');
    })();

    assert.equal(result, '(user and role)');
  });

  it('or locks', function() {
    var result = toString(opts, function(xpr) {
      return xpr.or('user', 'role');
    })();

    assert.equal(result, '(user or role)');
  });

  it('not locks', function() {
    var result = toString(opts, function(xpr) {
      return xpr.not('user', 'role');
    })();

    assert.equal(result, '(not user and not role)');
  });
});

describe('nested conditions', function() {

  it('and nested in or', function() {
    var result = toString(opts, function(xpr) {
      return xpr.or('draft', xpr.and('user', 'role'));
    })();

    assert.equal(result, '(draft or (user and role))');
  });

});

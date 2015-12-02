var _ = require('lodash');
var assert = require('assert');
var toFn = require('./fn');


var ent = {
    id: 'show-entity',
    name: 'test fixture',
    owner: '2'
};

var opts = {
  entity: 'test',
  access: 'read',
  acl: {
    keychain: function(user, done) {
      done(null, ['id='+user.id, 'role='+user.role]);
    },
    locks: function(ent, done) {
      done(null, [
        { entity: 'test', lock: 'draft', key: 'id=2', read: true },
        { entity: 'test', lock: 'user', key: 'id=1', read: true },
        { entity: 'test', lock: 'role', key: 'role=editor', read: true }
      ]);
    }
  }
};

describe('simple conditionals', function() {
  describe('and locks', function() {
    var testFn = toFn(opts, function(xpr) {
      return xpr.and('user', 'role');
    });

    it('succeeds when all match', function(done) {
      var user = { id: 1, role: 'editor' };

      testFn(user, ent, 'read', function(err, result) {
        assert.ok(result);
        done();
      });
    });

    it('fails when any do not match', function(done) {
      var user = { id: 1, role: 'not-editor' };

      testFn(user, ent, 'read', function(err, result) {
        assert.ok(!result);
        done();
      });
    });

    it('fails when all do not match', function(done) {
      var user = { id: 2, role: 'not-editor' };

      testFn(user, ent, 'read', function(err, result) {
        assert.ok(!result);
        done();
      });
    });
  });

  it('or locks', function(done) {
    var testFn = toFn(opts, function(xpr) {
      return xpr.or('user', 'role');
    });

    var user = { id: 1, role: 'not-editor' };

    testFn(user, ent, 'read', function(err, result) {
      assert.ok(result);
      done();
    });
  });

  it('not locks', function(done) {
    var testFn = toFn(opts, function(xpr) {
      return xpr.not('user', 'role');
    });

    var user = { id: 2, role: 'not-editor' };

    testFn(user, ent, 'read', function(err, result) {
      assert.ok(result);
      done();
    });
  });
});

describe('nested conditions', function() {

  it('and nested in or', function(done) {
    var testFn = toFn(opts, function(xpr) {
      return xpr.or('draft', xpr.and('user', 'role'));
    });

    var user = { id: 2, role: 'not-editor' };

    testFn(user, ent, 'read', function(err, result) {
      assert.ok(result);
      done();
    });
  });

});

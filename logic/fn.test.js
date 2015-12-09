var Lab = require('lab')

var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var before = lab.before;
var after = lab.after;

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
  acl: {
    keychain: function(user, done) {
      done(null, ['id='+user.id, 'role='+user.role, 'blocked='+(user.blocked || 0)]);
    },
    locks: function(ent, done) {
      done(null, [
        { entity: 'test', lock: 'draft', key: 'id=2', read: true },
        { entity: 'test', lock: 'blocked', key: 'blocked=1', read: true },
        { entity: 'test', lock: 'user', key: 'id=1', read: true },
        { entity: 'test', lock: 'role', key: 'role=editor', read: true }
      ]);
    }
  }
};

describe('acl.toFn logic implementation', function() {
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

    describe('or locks', function() {
      var testFn = toFn(opts, function(xpr) {
        return xpr.or('user', 'role');
      });

      it('succeeds when all match', function(done) {
        var user = { id: 1, role: 'editor' };

        testFn(user, ent, 'read', function(err, result) {
          assert.ok(result);
          done();
        });
      });

      it('succeeds when any match', function(done) {
        var user = { id: 1, role: 'not-editor' };

        testFn(user, ent, 'read', function(err, result) {
          assert.ok(result);
          done();
        });
      });

      it('fails when any do not match', function(done) {
        var user = { id: 2, role: 'not-editor' };

        testFn(user, ent, 'read', function(err, result) {
          assert.ok(!result);
          done();
        });
      });
    });

    describe('not locks', function() {
      var testFn = toFn(opts, function(xpr) {
        return xpr.not('user');
      });

      it('fails when match', function(done) {
        var user = { id: 1, role: 'editor' };

        testFn(user, ent, 'read', function(err, result) {
          assert.ok(!result);
          done();
        });
      });

      it('succeeds when not match', function(done) {
        var user = { id: 2, role: 'not-editor' };

        testFn(user, ent, 'read', function(err, result) {
          assert.ok(result);
          done();
        });
      });
    });

  });

  describe('nested conditions', function() {

    var testFn = toFn(opts, function(xpr) {
      return xpr.or(
        'draft',
        xpr.and(
          xpr.not('blocked'),
          'user',
          'role'
        )
      );
    });

    it('and nested in or', function(done) {

      var user = { id: 2, role: 'not-editor' };

      testFn(user, ent, 'read', function(err, result) {
        assert.ok(result);
        done();
      });
    });

  });
});

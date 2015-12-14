var Lab = require('lab')

var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var before = lab.before;
var after = lab.after;

var _ = require('lodash');
var assert = require('assert');
var ACL = require('./acl');

var fixture = {
  locks: function(ent, done) {
    done(null, [
      { lock: 'user', key: 'user=1', read: true },
      { lock: 'role', key: 'role=admin', read: true }
    ]);
  },
  keychain: function(user, done) {
    done(null, ['user=1', 'role=admin']);
  },
  conditions: function(xpr) {
    return xpr.and('user', 'role');
  }
};

var acl = ACL(fixture, 'test', 'id');

describe('ACL api', function() {
  var include;
  var _keys;
  before(function(done) {
    acl.locks({ id: 1 }, function(err, keys) {
      _keys = keys;
      include = _.partial(_.find, keys);
      done();
    });
  });

  it('expands locks as needed', function(done) {
    assert.equal(_keys.length, 2);
    assert.ok(include({ entityId: 1 }), 'added entityId');
    assert.ok(include({ write: false }), 'default write to false');
    assert.ok(include({ remove: false }), 'default remove to false');
    assert.ok(include({ entity: 'test' }), 'default entity type');
    done();
  });

  it('supports toString', function(done) {
    assert.equal(acl.toString(), '(user and role)');
    done();
  });
  it('supports toJSON', function(done) {
    assert.deepEqual(acl.toJSON(), ['AND', 'user', 'role']);
    done();
  });
  it('has an access function', function(done) {
    acl.access({ id: 1 }, { id: 1 }, 'read', function(err) {
      if (err) { return done(err); }

      // the user can access this
      return done();
    });
  });
});

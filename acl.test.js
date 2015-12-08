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
    done(null, [{ lock: 'user', key: 'user=1', read: true }]);
  },
  keychain: function(user, done) {
    done(null, ['user=1']);
  },
  conditions: function(xpr) {
    return xpr.and('user');
  }
};

var acl = ACL(fixture, 'test', 'id');

describe('ACL api', function() {
  it('expands locks as needed', function(done) {
    acl.locks({ id: 1 }, function(err, keys) {
      console.log(keys);
      done();
    });
  });
});

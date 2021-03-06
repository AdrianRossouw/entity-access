var db = require('knex')({ client: 'postgresql' });

var assert = require('assert');
var toSql = require('./knex')(db);

var opts = {
  access: 'read',
  entity: 'blog',
  keychain: ['user=test-user']
}

describe('acl.toKnex logic implementation', function() {
  describe('simple conditionals', function() {
    it('and locks', function(done) {
      var result = toSql(opts, function(xpr) {
        return xpr.and('user', 'role');
      })();

      assert.equal(_clean(result), 'user and role');
      done();
    });

    it('or locks', function(done) {
      var result = toSql(opts, function(xpr) {
        return xpr.or('user', 'role');
      })();

      assert.equal(_clean(result), 'user or role');
      done();
    })

    it('not locks', function(done) {
      var result = toSql(opts, function(xpr) {
        return xpr.not('user', 'role');
      })();

      assert.equal(_clean(result), 'not user and not role');
      done();
    })
  });

  describe('nested conditions', function() {

    it('and nested in or', function(done) {
      var result = toSql(opts, function(xpr) {
        return xpr.or('draft', xpr.and('user', 'role'));
      })();

      assert.equal(_clean(result), 'draft or (user and role)');
      done();
    })

  });
});

function _clean(knex) {
  return knex.toString()
    .replace(/"(\w*)"."key" in \('user=test-user'\)/g, '$1')
    .replace(/"(\w*)"."key" not in \('user=test-user'\)/g, 'not $1')
    .replace(/.* and \((.*)\)$/g, '$1');
}

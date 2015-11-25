var db = require('knex')({ client: 'postgresql' });

var assert = require('assert');
var toSql = require('./knex')(db);

var opts = {
  access: 'read',
  entity: 'blog',
  keychain: ['user=test-user']
}
  
describe('simple conditionals', function() {
  it('and locks', function() {
    var logic = function(lgc) { return lgc.and('user', 'role'); }
    var result = _clean(toSql(logic, ['user', 'role'], opts));

    assert.equal(result, 'user and role');
  })

  it('or locks', function() {
    var logic = function(lgc) { return lgc.or('user', 'role'); }
    var result = _clean(toSql(logic, ['user', 'role'], opts));

    assert.equal(result, 'user or role');
  })

  it('not locks', function() {
    var logic = function(lgc) { return lgc.not('user', 'role'); }
    var result = _clean(toSql(logic, ['user', 'role'], opts));

    assert.equal(result, 'not user and not role');
  })
});

describe('nested conditions', function() {

  it('and nested in or', function() {
    var logic = function(lgc) {
      return lgc.or('draft', lgc.and('user', 'role'));
    }
    var result = _clean(toSql(logic, ['draft', 'user', 'role'], opts));
    console.log(result);

    assert.equal(result, 'draft or (user and role)');
  })

});

function _clean(knex) {
  return knex.toString()
    .replace(/"(\w*)"."key" in \('user=test-user'\)/g, '$1')
    .replace(/"(\w*)"."key" not in \('user=test-user'\)/g, 'not $1')
    .replace(/.* and \((.*)\)$/g, '$1');
}

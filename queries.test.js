var sqlfile = require('tmp').tmpNameSync();

var db = require('knex')({
  client: 'sqlite',
   connection: {
     filename: sqlfile
   }
});

var _ = require('lodash');
var assert = require('assert');
var queries = require('./queries')(db);
var uuid = require('uuid');
var _fixture;

var fixture = {
  'entity': 'case',
  'entityId': uuid.v4(),
  'lock': 'user', 
  'key': 'user='+uuid.v4(), 
  'read': true,
  'write': false,
  'remove': false
};

describe('ACL queries', function() {
  before(queries.setup);

  it('insert', function(done) {
    queries.insert(fixture, done)
    .then( function(result) {
      assert.equal(1, result[0]);
      done();
    })
    .catch(done);
  });

  it('list', function(done) {
    queries.list(fixture)
    .then( function(rows) {
      assert.equal(fixture.key, rows[0].key);
      done();
    })
    .catch(done);
  });

  it('update', function(done) {
    _fixture = _.extend({}, fixture);
    _fixture.read = false;

    queries.update(_fixture)
    .then( function(result) {
      assert.equal(1, result);
      done();
    })
    .catch(done);
  });

  it('remove', function(done) {
    queries.remove(_fixture)
    .then( function(result) {
      assert.equal(1, result);
      done();
    })
    .catch(done);
  });
});

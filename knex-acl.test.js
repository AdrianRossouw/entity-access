var Lab = require('lab')

var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var before = lab.before;
var after = lab.after;

var assert = require('assert');

var sqlfile = require('tmp').tmpNameSync();

var db = require('knex')({
  client: 'sqlite',
   connection: {
     filename: sqlfile
   }
});

var _ = require('lodash');
var fixture = require('./fixture')(db);
var queries = require('./queries')(db);

var libAcl = require('./knex-acl')(db);

var acl = libAcl(fixture.queries, fixture.acl, 'test_table', 'id');

var userData = {
  show: {  id: '1', roles: ['editor', 'view_content'] },
  hide: {  id: '1', roles: ['editor'] }
};

var entityData = {
  show: {
    id: 'show-entity',
    name: 'test fixture',
    owner: '1'
  },
  hide: {
    id: 'hide-entity',
    name: 'another test fixture',
    owner: '2'
  }
};

describe('acl query tests', function() {
  before(queries.setup);
  before(fixture.queries.setup);
  after(fixture.queries.breakdown);

  describe('ace generation', function() {
    after(function(done) { queries.remove().asCallback(done); });
    after(function(done) { fixture.queries.remove().asCallback(done); });

    var opts = {
      ent: entityData.show,
      user$: userData.show
    };

    it('insert a record', function(done) {
      acl.insert(opts)
        .then(function() { return queries.list(); })
        .then(function(rows) {
          var any = _.partial(_.any, rows);

          assert.equal(rows.length, 2);

          assert.ok(any({
            lock: 'role',
            key: 'role=view_content',
            read: 1 
          }));

          assert.ok(any({
            lock: 'owner',
            key: 'user=1',
            read: 1,
            write: 1
          }), 'has owner lock');

          done();
        });
    });

    it('update a record', function(done) {
      var ent = _.extend({}, opts.ent, {
        name: 'updated test fixture',
        owner: '2'
      });

      acl.update({ user$: userData.show, ent: ent })
        .then(function() { return queries.list(); })
        .then(function(rows) {
          var any = _.partial(_.any, rows);

          assert.equal(rows.length, 2);

          assert.ok(any({
            lock: 'owner',
            key: 'user=2',
            read: 1,
            write: 1
          }), 'has different owner lock');

          done();
        });

      });

  });

  describe('filters query output', function() {
    before(function(done) {
      acl.insert({ ent: entityData.show })
        .then(function() {
          return acl.insert({ ent: entityData.hide });
        })
        .asCallback(done);
    });

    after(function(done) { queries.remove().asCallback(done); });
    after(function(done) { fixture.queries.remove().asCallback(done); });

    it('should hide inaccessible records', function(done) {

      acl.list({ user$: userData.hide })
        .then(function(rows) {
          var any = _.partial(_.any, rows);

          assert.equal(rows.length, 1);

          // must show the show record
          assert.ok(any(entityData.show));

          // must not show the hide record
          assert.ok(!any(entityData.hide));

          done();
        });
    });

  });
});

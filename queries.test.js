/* global describe, it */
'use strict';

var _ = require('lodash');
var assert = require('assert');
var query = require('./queries');
var uuid = require('node-uuid');
var _fixture;

var fixture = {
	'entity': 'case',
	'entityId': uuid.v4(),
	'realm': 'user', 
	'grantId': uuid.v4(), 
	'grantRead': true,
	'grantWrite': false,
	'grantDelete': false
};

var entityId = '110eee38-c8b7-4caf-918d-c304bff74073';
var entityFixture = {
	id: entityId,
	key: 'some::key',
	locale: 'en_US',
	value: 'test',
	description: 'test',
	createdDate: '2015-08-24T17:58:03.538Z',
	lastUpdatedBy: null,
	lastUpdatedDate: '2015-08-24T17:58:03.538Z'
};

var userFixture = {
	id: uuid.v4(),
	roles: ['content-manager']
};

var opts = {
	q: {
		id: entityId
	},
	ent: entityFixture,
	user$: userFixture
};

describe('ACL queries', function() {

	it('insert', function(done) {
		query.insert(fixture, done)
		.then( function(result) {
			assert.equal(1, result.rowCount);
			done();
		})
		.catch(done);
	});

	it('list', function(done) {
		query.list(fixture)
		.then( function(rows) {
			assert.equal(fixture.grantId, rows[0].grantId);
			done();
		})
		.catch(done);
	});

	it('update', function(done) {
		_fixture = _.extend({}, fixture); 
		_fixture.grantRead = false;

		query.update(_fixture)
		.then( function(result) {
			assert.equal(1, result);
			done();
		})
		.catch(done);
	});

	it('remove', function(done) {
		query.remove(_fixture)
		.then( function(result) {
			assert.equal(1, result);
			done();
		})
		.catch(done);
	});

	it('setPermissions - no ACL check', function(done) {
		var _base = query.list(fixture);
		var _sql = _base.toString();

		_base = query.setPermissions(_base, 'fable', 'list', {});

		assert.equal(_sql, _base.toString());
		done();

	});

	it('setPermissions - ACL check', function(done) {
		var _base = query.list(fixture);
		var _sql = _base.toString();

		_base = query.setPermissions(_base, 'fable', 'list', opts);

		assert.notEqual(_sql, _base.toString());
		done();

	});
});

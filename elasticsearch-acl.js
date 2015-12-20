var _ = require('lodash');
var ACL = require('./acl');
var assert = require('assert');
var Promise = require('bluebird');

module.exports = function (db, esClient, esIndex) {
	var q = require('./queries')(db);
	var toElasticSearch = require('./logic/elasticsearch')();

	return function (queries, acl, entity, key) {
		assert.ok(entity, 'entity required');
		key = key || 'id';

		var _acl = ACL(acl, entity, key);

		_acl.search = function (opts, done) {
			done(null, toElasticSearch(opts, _acl.conditions)());
		};

		var promised = {
			locks: Promise.promisfy(_acl.locks),
			keychain: Promise.promisfy(_acl.keychain),
			search: Promise.promisfy(_acl.search)
		};

		function setPermissions (opts) {
			var query = opts.search.query;
			// checking context here to determine if we need to add ACLs
			if (!opts || !opts.user$) { return query; }

			return promised.keychain(opts.user$)
				.then(function (keychain) {
					return {
						keychain: keychain,
						access: 'read',
						entity: entity,
						key: key
					};
				})
				.then(promised.search)
				.then(function (filters) {
					query.filtered.must.push({
						bool: {
							must: filters.and,
							should: filters.or,
							must_not: filters.not
						}
					});
				});
		}

		function indexLocks (opts) {
			var entityId = _.get(opts, 'ent.id');

			return function (rows) {
				if (key !== 'id') { return rows; }

				q
					.list({
						entity_id: entityId
					})
					.then(function (locks) {
						var bulk = [];
						_.each(locks, function (lock) {
							bulk.push({ index: { _index: esIndex, _type: 'acl', _id: lock.id }});
							bulk.push(lock);
						});
						esClient.bulk({
							body: bulk
						}, function (err) {
							if (err) throw err;
						});
					});
				return rows;
			};
		}

		// TODO: Handle ACL records to ES with direct plugin

		return _.extend({}, queries, {
			search: function (args, done) {
				done(null, setPermissions(args.search.query, 'read'));
			},
			insert: function (opts) {
				queries.insert(opts).then(indexLocks(opts));
			},
			update: function (opts) {
				queries.update(opts).then(indexLocks(opts));
			},
			acl: (queries.acl || []).concat([
				{ entity: entity, key: key, acl: _acl }
			])
		});
	};
};
var _ = require('lodash');
var ACL = require('./acl');
var assert = require('assert');
var Promise = require('bluebird');

module.exports = function (db) {
	var toElasticSearch = require('./logic/elasticsearch')();

	return function (queries, acl, entity, key) {
		assert.ok(entity, 'entity required');
		key = key || 'id';

		var _acl = ACL(acl, entity, key);

		_acl.query = function (opts, done) {
			done(null, toElasticSearch(opts, _acl.conditions)());
		};

		var promised = {
			locks: Promise.promisfy(_acl.locks),
			keychain: Promise.promisfy(_acl.keychain),
			query: Promise.promisfy(_acl.query)
		};

		function setPermissions (query, access) {
			// checking context here to determine if we need to add ACLs
			if (!opts || !opts.user$) { return query; }

			promised.keychain(opts.user$)
				.then(function (keychain) {
					return {
						keychain: keychain,
						access: access,
						entity: entity,
						key: key
					};
				})
				.then(promised.query)
				.then(function (filters) {
					filters.must.push({
						bool: {
							must: filters.and,
							should: filters.or,
							must_not: filters.not
						}
					});
				});
		}

		return {
			search: function (args, callback) {
				if (_.has(args, 'search.query.filtered')) {
					setPermissions(args.search.query, 'read');
				}
				return this.prior(args, callback);
			},
			acl: (queries.acl || []).concat([
				{ entity: entity, key: key, acl: _acl }
			])
		};
	};
};
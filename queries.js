'use strict';

var query = require('../query');
var _ = require('lodash');

function _setColumns(opts) {
	return {
		id: opts.id,
		entity: opts.entity,
		entityId: opts.entityId,
		realm: opts.realm,
		grantId: opts.grantId,
		grantRead: opts.grantRead,
		grantWrite: opts.grantWrite,
		grantDelete: opts.grantDelete
	};
}

// columns that will be returned
function _getColumns(opts) {
	return [
		'id',
		'entity',
		'entityId',
		'realm',
		'grantId',
		'grantRead',
		'grantWrite',
		'grantDelete'
	];
}

/**
* set the where statement based on what is passed in with opts.entity.
* if the property doesn't exist on opts we don't query with that field:value.
*/
function _setWhere(knex, opts) {

	opts.entity && knex.where('entity', opts.entity);
	opts.entityId && knex.where('entityId', opts.entityId);
	opts.realm && knex.where('realm', opts.realm);
	opts.grantId && knex.where('grantId', opts.grantId);
	opts.grantRead && knex.where('grantRead', opts.grantRead);
	opts.grantWrite && knex.where('grantWrite', opts.grantWrite);
	opts.grantDelete && knex.where('grantDelete', opts.grantDelete);

	return knex;
}

function insert(opts) {
	var knex = query('acl');
	var columns = _.omit(_setColumns(opts), 'id');

	knex.insert(columns);

	return knex;
}

function list(opts) {
	var knex = query('acl');

	knex = _setWhere(knex, opts);
	knex.select(_getColumns(opts));

	return knex;
}

function load(opts) {
	var knex = list(opts);

	return knex;
}

function update(opts) {
	var knex = query('acl');
	var columns = _.omit(_setColumns(opts), 'id');

	knex = _setWhere(knex, opts);
	knex.update(columns);

	return knex;
}

function remove(opts) {
	var knex = query('acl');

	knex = _setWhere(knex, opts);
	knex.del();

	knex.toString();

	return knex;
}

/**
* This is used by entity/query.js to layer on access/permissions.
*
* @knex {object} knex object we need to verify, originated within entity/query.js
* @entity {string} name of the entity table we are joining ACLs too.
* @access {string} access we need to check.  (ie. grantRead, grantWrite, grantDelete)
* @opts {object} should contain data about the query, entity and user.
**/
function _setPermissionsWhere(knex, entity, access, opts) {
	// checking context here to determine if we need to add ACLs
	if (!opts.user$) { return knex; }
	if (!opts.q && !opts.q.id && !opts.q.ids) { return knex; }

	if (opts.q.id) {
		knex.whereIn('id', function() {
			var _subselect = this;

			_subselect.where('entity', entity);
			_subselect.where('entityId', opts.q.id);
			_subselect.where('realm', 'role');
			_subselect.whereIn('grantId', opts.user$.roles);
			_subselect.where(access, true);
			_subselect.select('entityId').from('acl');
		});

		knex.orWhereIn('id', function() {
			var _subselect = this;

			_subselect.where('entity', entity);
			_subselect.where('entityId', opts.q.id);
			_subselect.where('realm', 'user');
			_subselect.where('grantId', opts.user$.id);
			_subselect.where(access, true);
			_subselect.select('entityId').from('acl');
		});
	} else if (opts.q.ids) {
		knex.whereIn('id', function() {
			var _subselect = this;

			_subselect.where('entity', entity);
			_subselect.whereIn('entityId', opts.q.ids);
			_subselect.where('realm', 'role');
			_subselect.whereIn('grantId', opts.user$.roles);
			_subselect.where(access, true);
			_subselect.select('entityId').from('acl');
		});

		knex.orWhereIn('id', function() {
			var _subselect = this;

			_subselect.where('entity', entity);
			_subselect.whereIn('entityId', opts.q.ids);
			_subselect.where('realm', 'user');
			_subselect.where('grantId', opts.user$.id);
			_subselect.where(access, true);
			_subselect.select('entityId').from('acl');
		});
	}

	return knex;
}

/**
* @knex {object} knex object we need to verify, originated within entity/query.js
* @entity {string} name of the entity table we are joining ACLs too.
* @action {string} action knex query is trying to execute
* @opts {object} contains data about the entity and user
**/
function setPermissions(knex, entity, action, opts) {

	switch(action.toLowerCase()) {
		case 'insert':
			console.log('ACL for insert not implemented yet');
			break;
		case 'list': 
			knex = _setPermissionsWhere(knex, entity, 'grantRead', opts);
			break;
		case 'load': 
			knex = _setPermissionsWhere(knex, entity, 'grantRead', opts);
			break;
		case 'update':
			knex = _setPermissionsWhere(knex, entity, 'grantWrite', opts);
			break;
		case 'remove':
			knex = _setPermissionsWhere(knex, entity, 'grantDelete', opts);
			break;
		default:
			console.log('permissions action default? [' + action + ']');
			break;
	}

	return knex;
}

module.exports = {
	insert: insert,
	load: load,
	list: list,
	update: update,
	remove: remove,
	setPermissions: setPermissions
};
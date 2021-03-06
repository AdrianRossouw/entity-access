# Entity-access

This module provides a flexible way to manage access to 'entities' stored
in a relational database. It is built in such a way that you can easily filter
out records that a user does not have access to on a query level, before
the rest of your system even sees the data.

### How it works

An __entity__ is an object containing functions that return an instance of a [Knex.js](http://knexjs.org) query builder for each of the following basic crud
operations: `insert`, `update`, `list`, `load` and `remove`. This object can also
be loaded into a [seneca-knex-store](https://github.com/AdrianRossouw/seneca-knex-store), but this is not a requirement.

Whenever the entity is modified, entity-access will allow you to provide a set of __locks__ that would provide access to the content. These locks will also be persisted in the database by tapping into the entity's 'update' and 'insert' queries.

Whenever an entity is fetched from the database, the system will allow you to generate a __keychain__ for the user requesting the entities. This is a list of keys that the user provides, that will be used to open the entity's locks.

This keychain can then used to construct a __query__ that will be used to append an additional check on `list` and `load` queries to filter the results.

The resulting query should look something like :

```sql
SELECT * FROM entity
    WHERE id IN (SELECT entity_id FROM acl AS lock
        WHERE lock='lock' AND key IN (:keychain));
```

## Terminology

* __entity__: object with `insert`, `update`, `load`, `list`, and `remove` knex queries.
* __acl__: object with functions providing the `locks`, `keychain` and `query`.
* __locks__: each entity can declare one or more locks that need to be opened by one or more keys.
* __keychain__: each user has one or keys with which to open locks.
* __conditions__: The order and combination in which the locks need to open to provide access.

## Example

If we decode the unix file permission structure in this way :

* Each file has a `user lock`, a `group lock`, and an `others lock` (with read/write/execute bits).
* Each user has a `user key`, `group keys` for all it's groups, and an implicit `others key` in it's keychain.
* To gain access for the specific operation, the user has to have a key to unlock __any__ of the file's locks.

The rest of the code in this readme will document how to implement unix permissions.

## Usage

Since there are so many variations on how access control works, this library
tries not to make any assumptions by instead letting you implement the parts
that are almost always different between each project.

You enable the ACL on an entity by providing it with the knex functions required by the [seneca-knex-store](https://github.com/AdrianRossouw/seneca-knex-store),
and an object that contains implementations of the `locks`, `keychain` and `conditions` functions for your acl.

```javascript
var Acl = require('node/acl');

var fileQueries = require('./entities/file/queries');
var fileAcl = require('./entities/file/acl');

var aclQueries = Acl(fileQueries, fileAcl, 'file', 'id');
```

Inserting and updating records will generate entries in the `acl` table

```javascript
var file = {
	id: '/home/node/example.json',
	owner: 'node',
	group: 'admin'
};

aclQueries.insert({	ent: file }).then(function(res) { /* is written */ });
```

Listing records will filter to only those visible for the current user

```javascript
var user = {
	id: 'not-node',
	groups: ['node']
};

aclQueries.list({ user$: user }).then(function(rows) { /* no access */ });
```

By loading these wrapped queries into the seneca-knex-store, the seneca entity system
will automatically use this new ACL.

```javascript
var store = require('seneca-knex-store');
seneca.use(store('-/-/file', aclQueries));
```

## Implementing your own ACL.

### Locks

This function takes an entity and returns a series of records to write into
the acl table.

```javascript
function locks(ent, done) {
	var locks = [];

	// we are giving all files the same permissions here (640)
	
	// others have no permissions
	locks.push({
		lock: 'others',
		key: 'others',
		read: false, // you can leave out false perms
		write: false // these are just for example.
	});

	// the file's group can read it.
	locks.push({
		lock: 'groups',
		key: 'group='+ent.group, // notice the use of the ent's props
		read: true
	});

	// the owner of it can read and write it
	locks.push({
		lock: 'owner',
		key: 'user='+ent.owner,
		read: true,
		write: true
	});

	done(null, locks);
}
```

## Keychain

This function accepts a user object, and returns an array of keys
for the user.

```javascript
function keychain(user, done) {
	var keys = [];

	// everybody has an 'others' key
	keys.push('others');

	// the user has a key for itself
	keys.push('user='+user.id);

	// and a key for each of the groups it belongs to
	_.each(user.groups, function(group) {
		keys.push('group='+group);
	});

	done(null, keys);
}
```

## Conditions

This is the most complicated of the functions, because it's also the most flexible.

Whereas many solutions (such as unix file perms) can be solved with 'ANY' or 'ALL'
locks opened, there are many real world cases where this is not flexible enough.
By having the developer write the logic directly, they are able to mix and match
the conditions to exactly match their use-case.

How it works is that when you do a select (like `select * from files`), this logic will
be used to generate a query that will be added in a subselect to filter out the keys.

ie: `select * from files where id in (/* this query */)`.


```javascript
function(xpr) {
  return xpr.or('owner', 'group', 'other');
}
```

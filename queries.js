var _ = require('lodash');

module.exports = function(db) {
  function _setColumns(opts) {
    return {
      entity: opts.entity,
      entity_id: opts.entityId,
      lock: opts.lock,
      key: opts.key,
      read: opts.read,
      write: opts.write,
      remove: opts.remove
    };
  }

  // columns that will be returned
  function _getColumns(opts) {
    return [
      'entity',
      'entity_id as entityId',
      'lock',
      'key',
      'read',
      'write',
      'remove'
    ];
  }

  /**
  * set the where statement based on what is passed in with opts.entity.
  * if the property doesn't exist on opts we don't db with that field:value.
  */
  function _setWhere(knex, opts) {

    opts.entity && knex.where('entity', opts.entity);
    opts.entityId && knex.where('entity_id', opts.entityId);
    opts.lock && knex.where('lock', opts.lock);
    opts.key && knex.where('key', opts.key);
    opts.read && knex.where('read', opts.read);
    opts.write && knex.where('write', opts.write);
    opts.remove && knex.where('remove', opts.remove);

    return knex;
  }

  function insert(opts) {
    var knex = db('acl');
    var columns = _.omit(_setColumns(opts), 'id');

    knex.insert(columns);

    return knex;
  }

  function list(opts) {
    opts = opts || {};
    var knex = db('acl');

    knex = _setWhere(knex, opts);
    knex.select(_getColumns(opts));

    return knex;
  }

  function load(opts) {
    opts = opts || {};
    var knex = list(opts);

    return knex;
  }

  function update(opts) {
    opts = opts || {};
    var knex = db('acl');
    var columns = _.omit(_setColumns(opts), 'id');

    knex = _setWhere(knex, opts);
    knex.update(columns);

    return knex;
  }

  function remove(opts) {
    opts = opts || {};
    var knex = db('acl');

    knex = _setWhere(knex, opts);
    knex.del();

    knex.toString();

    return knex;
  }

  function setup(done) {
    db.schema.hasTable('acl').then(function(exists) {
      if (exists) { return done(); }

      db.schema
        .createTable('acl', tableDef)
        .asCallback(done);
    });

    function tableDef(table) {
      table.increments('id').primary().notNullable();
      table.string('entity_id').notNullable();
      table.string('entity').notNullable();
      table.string('lock').notNullable();
      table.string('key').notNullable();
      table.boolean('write').defaultTo(false).notNullable();
      table.boolean('read').defaultTo(false).notNullable();
      table.boolean('remove').defaultTo(false).notNullable();
    }
  }

  return {
    list: list,
    load: load,
    update: update,
    insert: insert,
    remove: remove,
    setup: setup
  };
};

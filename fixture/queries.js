module.exports = function(knex) {
  return {
    insert: function(opts) {
      opts = opts || {};
      return knex('test_table').insert(opts.ent);
    },
    update: function(opts) {
      opts = opts || {};
      return knex('test_table')
        .insert(opts.ent)
        .where(opts.ent.id);
    },
    remove: function(opts) {
      opts = opts || {};
      return knex('test_table').del();
    },
    list: function(opts) {
      opts = opts || {};
      var q = opts.q || {};
      return knex('test_table')
        .select()
        .where(q);
    },
    load: function(opts) {
      opts = opts || {};
      var q = opts.q || {};
      return knex('test_table')
        .select()
        .where(q);
    },
    setup: function(done) {

      knex.schema.hasTable('test_table').then(function(exists) {
        if (exists) { return done(); }

        knex.schema
          .createTable('test_table', tableDef)
          .asCallback(done);
      });

      function tableDef(table) {
        table.string('id');
        table.string('name');
        table.string('owner');
      }
    },
    breakdown: function(done) {
      knex.schema.dropTable('test_table').asCallback(done);
    }
  };
};

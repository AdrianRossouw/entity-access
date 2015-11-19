module.exports = function (db) {
  return {
    acl: require('./acl')(db),
    queries: require('./queries')(db)
  };
};

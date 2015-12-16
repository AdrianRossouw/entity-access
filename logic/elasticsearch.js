module.exports = function (db) {
	return function (opts, fn) {
		var locks = [];

		return function () {
			locks = [];
			var matchQuery = fn({ and: and, or: or, not: not });

			// TODO...
		};

		function and () {
			var args = arguments;

			_trackLocks(args);

			return function () {
				var must = [];
				_.each(args, function (cnd) {
					if (_.isString(cnd)) {
						var terms = {};
						terms[cnd + '.key'] = opts.keychain;
						must.push({
							terms: terms
						});
					} else {
						_.each(cnd, function (val, key) {
							var term = {};
							term[key] = val;
							must.push({
								term: term
							});
						});
					}
				});
			};
		}

		function or () {
			var args = arguments;

			_trackLocks(args);

			return function () {
				var shoulds = [];
				_.each(args, function (cnd) {
					if (_.isString(cnd)) {
						var terms = {};
						terms[cnd + '.key'] = opts.keychain;
						shoulds.push({
							terms: terms
						});
					} else {
						_.each(cnd, function (val, key) {
							var term = {};
							term[key] = val;
							shoulds.push({
								term: term
							});
						});
						shoulds = {
							bool: {
								must: shoulds
							}
						};
					}
				});
			};
		}

		function not () {
			var args = arguments;

			_trackLocks(args);

			return function () {
				var must_not = [];
				_.each(args, function (cnd) {
					if (_.isString(cnd)) {
						var terms = {};
						terms[cnd + '.key'] = opts.keychain;
						must_not.push({
							terms: terms
						});
					} else {
						_.each(cnd, function (val, key) {
							var term = {};
							term[key] = val;
							must_not.push({
								term: term
							});
						});
						must_not = {
							must: {
								must: must_not
							}
						};
					}
				});
			};
		}

		function _trackLocks (args) {
			_.each(args, function (cnd) {
				if (_.isString(cnd) && !~locks.indexOf(cnd)) {
					locks.push(cnd);
				}
			});
		}
	};
};
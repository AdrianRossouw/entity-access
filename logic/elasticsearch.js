module.exports = function () {
	return function (opts, fn) {

		return function () {
			var matchQuery = fn({ and: and, or: or, not: not });

			// TODO...
		};

		function and () {
			var args = arguments;

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
	};
};
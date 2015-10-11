__This module is still under active development, may change significantly__

# Entity-access

This module provides a mechanism to limit access to certain records in a database
by ammending additional conditions to the [Knex](https://knexjs.org) queries that are
passed to it.

The use case it is being developed for is to provide an additional layer of protection
to [seneca](https://github.com/rjrodger/seneca) entities built with the [seneca-knex-store](https://github.com/AdrianRossouw/seneca-knex-store).

That means that it is somewhat API-compatible with the seneca api, but it operates on a lower level
so seneca is not required for normal operation.

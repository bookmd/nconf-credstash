# nconf-credstash
[![CircleCI](https://circleci.com/gh/bookmd/nconf-credstash.svg?style=svg)](https://circleci.com/gh/bookmd/nconf-credstash)

A [CredStash](https://github.com/fugue/credstash) store for [nconf](https://github.com/indexzero/nconf).
Enabling managing secrets in CredStash and integrating them with nconf.

## Installation
### Setup CredStash
[Install and setup CredStash](https://github.com/fugue/credstash#setup).

### Install nconf-credstash
``` bash
  $ npm install nconf
  $ npm install nconf-credstash
```
## Usage
### Adding the store
To add `nconf-credstash` to the `nconf` hierarchy, just import `nconf-credstash` and use the `.use()` method, the following way:
```javascript
require('nconf-credstash');

nconf.use('nconf-credstash', { key: 'KEY' });
```

### Using a docker container.

To use a credstash on another machine have an environment variable, CREDSTASH_HOST, which can be resolved to the machines IP address set. If this exists, credstashApi requests will attempt to ssh into specified machine and run command.

### Fetching secrets
The store provided by `nconf-credstash` supports two ways of fetching secrets:

1. `.get(key)` to fetch a specific key. For every call to `.get(key)` the store searches it's inner cache and only if the key does not exist goes to CredStash to fetch it.
Because of Credstash's performance issues, we fetch all of the secrets as one group.
2. `.get()` to fetch the entire store from CredStash. The store is cached for subsequent calls.

All calls are synchronous, using node's ability to spawn child processes synchronously.


### Other options
1. `key` - The key that will be used the project's secrets within credstash
2. `table` - The table in DynamoDB. The default is credential-store. Optional.
3. `region` - AWS region. Optional.
4. `context` - [CredStash context object](https://github.com/fugue/credstash#controlling-and-auditing-secrets). Optional.

## Running tests
The tests are written in Jasmine.
``` bash
  $ npm test
```


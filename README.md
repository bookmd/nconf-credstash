# nconf-credstash
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

nconf.use('nconf-credstash', { prefix: 'credstash_' , separator: '.'});
```
### Fetching secrets
The store provided by `nconf-credstash` supports two ways of fetching secrets:

1. `.get(key)` to fetch a specific key. For every call to `.get(key)` the store searches it's inner cache and only if the key does not exist goes to CredStash to fetch it.
2. `.get()` to fetch the entire store from CredStash. The store is cached for subsequent calls.

All calls are synchronous, using node's ability to spawn child processes synchronously.

### Providing a prefix
A prefix can be used in order not to fetch unwanted keys, since each call to CredStash takes a few seconds.
If the `nconf-credstash` is set up with a prefix, only keys that begins with the prefix will be fetched. If the key has a long path (like 'path:to:key'), it will only be fetched if the last part begins with the prefix. 
For example, if the prefix is "credstash_", the keys "credstash_password" and "postgres:credstash_password" will be fetched and the keys "password", "postgres:password" or "credstash_postgres:password" will not be fetched. 

The prefix should not be a part of the key in CredStash. "postgres:credstash_password" should be saved in CredStash as "postgres.password".

### Other options
1. `separator` - a separator string for keys in CredStash. Required.
2. `table` - The table in DynamoDB. The default is credential-store. Optional.
3. `region` - AWS region. Optional.
4. `context` - [CredStash context object](https://github.com/fugue/credstash#controlling-and-auditing-secrets). Optional.

## Running tests
The tests are written in Jasmine.
``` bash
  $ npm test
```


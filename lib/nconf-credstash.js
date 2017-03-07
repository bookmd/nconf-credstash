/**
 * Created by meirshalev on 12/02/2017.
 */

const nconf = require('nconf');
const _ = require('lodash');
const CredstashApi = require('./credstashApi');

/**
 * Constructor function for the nconf-credstash plugin. Receives the options object that is passed when using nconf.use('credstash', options).
 * The options object is required to contain a separator, for separating complex keys. For example, the separator for keys of the form "mongo.password" is '.'.
 * It may contain:
 * prefix - a prefix for keys that may be on credstash. If a prefix is passes, all keys that do not match the prefix will be ignored.
 * table - the table name on DynamoDB, default is credential-store.
 * region - AWS region.
 * context - CredStash context parameters.
 * @param options
 * @constructor
 */
function Credstash (options) {
  if (!options.key) {
    throw new Error('key is required');
  }

  options = options || {};
  options.table = process.env.CREDSTASH_TABLE || options.table;
  this.credstashKey = options.key;
  this.store = {}; // local cache

  this.credstashApi = new CredstashApi({
    table: options.table,
    region: options.region,
    context: options.context
  });
}

/**
 * Could be used to get a specific value by providing a key or to get the entire configuration, if not specifying a key
 * @param key
 */
Credstash.prototype.get = function (key) {
  if (key) {
    return this._getByKey(key);
  } else { // no path, fetch all keys and return the entire store
    return this._getAll();
  }
};

/**
 * Private method that gets a specific value by his key.
 * Returns the value, if found on the local store or on CredStash.
 * @param key
 * @returns {*}
 * @private
 */
Credstash.prototype._getByKey = function(key) {
  if (_.isEmpty(this.store)) this._getAll();
  return _.get(this.store, key);
};


/**
 * Private method that gets all values from CredStash and sets the store to the value returned.
 * Returns the new store.
 * @returns {*}
 * @private
 */
Credstash.prototype._getAll = function() {
  const rawAll = this.credstashApi.get(this.credstashKey);
  this.store = JSON.parse(rawAll);
  return this.store;
};



module.exports = Credstash;

nconf.Credstash = Credstash; // adding the CredStash plugin to nconf so that it could be using by .use('credstash', options)

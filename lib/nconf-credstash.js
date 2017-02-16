/**
 * Created by meirshalev on 12/02/2017.
 */

var nconf = require('nconf');
var CredstashApi = require('./credstashApi');

/**
 * Constructor function for the nconf-credstash plugin. Receives the options object that is passed when using nconf.use('credstash', options).
 * The options object is required to contain a separator, for separating complex keys. For example, the separator for keys of the form "mongo.password" is '.'.
 * It may contain:
 * prefix - a prefix for keys that may be on credstash. If a prefix is passes, all keys that do not match the prefix will be ignored.
 * table - the table name on DynamoDB, default is credential-store.
 * region - AWS region.
 * environment - CredStash environment.
 * @param options
 * @constructor
 */
function Credstash (options) {

  if (!options.separator) {
    throw new Error('separator is a required argument');
  }

  options = options || {};

  this.prefix = options.prefix;
  this.regex = new RegExp(`.*${this.prefix}[^:]*`); // RegEx for identifying keys that may be stored on CredStash (containing the prefix).
  this.separator = options.separator;
  this.store = {}; // local cache

  this.credstashApi = new CredstashApi({ table: options.table, region: options.region, context: options.context });
}

/**
 * Could be used to get a specific value by providing a key or to get the entire configuration, if not specifying a key
 * @param key
 */
Credstash.prototype.get = function (key) {
  if (key) {
    return this._getByPath(key);
  } else { // no path, fetch all keys and return the entire store
    return this._getAll();
  }
};

/**
 * Private method that gets a specific value by his path (array that represents the path first:second:last like the following: ['first', 'second', 'last'])
 * Returns the value, if found on the local store or on CredStash.
 * @param key
 * @returns {*}
 * @private
 */
Credstash.prototype._getByPath = function(key) {
  var self = this;

  // Only check keys that starts with the given prefix, in order to only call CredStash and block for specific keys.
  if (this.prefix && key && !key.match(this.regex)) {
    return;
  }

  path = nconf.path(key); // convert the key (delimited by ':') to a path array.
  var credstashKey = this._buildCredstashKey(path);
  // If not already exists in the store
  if (!self._hasPath(path)) {
    const result =  self.credstashApi.get(credstashKey);
    if (result) {
      self._insertIntoStore(path, result);
    }
  }
  return self._fetchFromStore(path);
};

/**
 * Builds a credstash key from a key path, using the prefix and the separator.
 * @param path
 * @returns {*}
 * @private
 */
Credstash.prototype._buildCredstashKey = function (path) {
  var credstashKey = path[0];
  var self = this;

  if (path.length > 1) {
    for (var i=1; i<path.length-1; i++) { // add all elements of the path, besides the last one (will add it later).
      credstashKey = credstashKey.concat(self.separator, path[i]);
    }
    credstashKey = credstashKey.concat(self.separator, path[path.length-1].split(self.prefix)[1]); // remove the prefix from the last part of the path and add it also.
  }

  return credstashKey;
};

/**
 * Private method that gets all values from CredStash and sets the store to the value returned.
 * Returns the new store.
 * @returns {*}
 * @private
 */
Credstash.prototype._getAll = function() {
  var self = this;

  const result = self.credstashApi.getAll();
  if (result) {
    var keys = Object.keys(result);
    var newStore = {};
    keys.forEach(function(key) {
      var path = key.split(self.separator);
      var value = result[key];
      insertIntoObject(path, value, newStore, self.prefix);
    });
    this.store = newStore;
  }
  return this.store;
};

/**
 * Inserts the value to the store, on the specified path.
 * @param path
 * @param value
 * @private
 */
Credstash.prototype._insertIntoStore = function(path, value) {
  insertIntoObject(path, value, this.store);
};

/**
 * Fetches the value, on the path specified, from the store.
 * @param path
 * @returns {*}
 * @private
 */
Credstash.prototype._fetchFromStore = function(path) {
  var key;
  var loc = this.store;
  var path = path.slice();

  while (path.length > 0) {
    key = path.shift();
    loc = loc[key];
  }
  return loc;
};

/**
 * Checks is the specified path exists on the store.
 * @param path
 * @returns {boolean}
 * @private
 */
Credstash.prototype._hasPath = function (path) {
  var target = this.store;
  var key;
  var path = path.slice();

  while (path.length > 0) {
    key = path.shift();
    if (target && target.hasOwnProperty(key)) {
      target = target[key];
    } else {
      return false;
    }
  }
  return true;
};

/**
 * @param path
 * @param value
 * @param object
 * @param [prefix]
 */
function insertIntoObject(path, value, object, prefix) {
  var loc = object;
  var path = path.slice();
  while (path.length > 0) {
    key = path.shift();
    if (path.length === 0) {
      if (prefix) {
        key = ''.concat(prefix,key);
      }
      loc[key] = value;
    } else if (!loc[key]) {
      loc[key] = {};
    }
    loc = loc[key];
  }
}


module.exports = Credstash;

nconf.Credstash = Credstash; // adding the CredStash plugin to nconf so that it could be using by .use('credstash', options)

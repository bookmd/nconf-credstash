/**
 * Created by meirshalev on 12/02/2017.
 */

var nconf = require('nconf');
var childProcess = require('child_process');

const COMMAND = 'credstash';
const TABLE_FLAG = '-t';
const REGION_FLAG = '-r';
const CREDSTASH_ERROR = 'Error fetching configuration from CredStash. Error message:';

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
  this.regex = RegExp(`.*${this.prefix}[^:]*`); // RegEx for identifying keys that may be stored on CredStash (containing the prefix).
  this.table = options.table;
  this.region = options.region;
  this.separator = options.separator;
  this.environment = options.environment;
  this.store = {}; // local cache

  this.cmdArgs = [];
  if (this.table) {
    this.cmdArgs.concat([TABLE_FLAG, this.table]);
  }
  if (this.region) {
    this.cmdArgs.concat([REGION_FLAG, this.region]);
  }
  if (this.environment) {
    this.cmdArgs.concat(['environemt='+this.environment]);
  }
};

/**
 * Could be used to get a specific value by providing a key or to get the entire configuration, if not specifying a key
 * @param key
 */
Credstash.prototype.get = function (key) {
  // Only check keys that starts with the given prefix, in order to only call CredStash and block for specific keys.
  if (this.prefix && key && !key.match(this.regex)) {
    return;
  }
  path = nconf.path(key); // convert the key (delimited by ':') to a path array.
  if (path.length > 0) {
    return this._getByPath(path);
  } else { // no path, fetch all keys and return the entire store
    return this._getAll();
  }
};

/**
 * Private method that gets a specific value by his path (array that represents the path first:second:last like the following: ['first', 'second', 'last'])
 * Returns the value, if found on the local store or on CredStash.
 * @param path
 * @returns {*}
 * @private
 */
Credstash.prototype._getByPath = function(path) {
  var self = this;
  var credstashKey = this._buildCredstashKey(path);
  // If not already exists in the store
  if (!self._hasPath(path)) {
    const result = childProcess.spawnSync(COMMAND, [].concat(self.cmdArgs, ['get', credstashKey]));

    if (result.status != 0) {
      if (result.stderr.toString().match(new RegExp(`Item \{\'name\': \'${credstashKey}\'\} couldn\'t be found`))) { // not a real error, item wasn't found
        return;
      } else { // a real error
        throw new Error(CREDSTASH_ERROR + result.stderr.toString());
      }
    } else {
      self._insertIntoStore(path, result.stdout.toString().trim());
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

  const result = childProcess.spawnSync(COMMAND, [].concat(this.cmdArgs, 'getall'));
  if (result.status != 0) {
    throw new Error(CREDSTASH_ERROR + result.stderr.toString());
  } else {
    var returedObject = JSON.parse(result.stdout.toString());
    var keys = Object.keys(returedObject);
    var newStore = {};
    keys.forEach(function(key) {
      var path = key.split(self.separator);
      var value = returedObject[key];
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

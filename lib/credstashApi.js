/**
 * Created by meirshalev on 15/02/2017.
 */
var childProcess = require('child_process');

const LOCAL_COMMAND = 'credstash';
const SSH_COMMAND = 'ssh';
const SSH_COMMAND_ARGS = ['-o StrictHostKeyChecking=no', 'credstash'] 
const CREDSTASH_ERROR = 'Error fetching configuration from CredStash. Error message:';

/**
 * Creates a new CredstashApi object and executes the commands using node's child_process.spwan.
 * May receive an options objcet, that may contain the following attributes:
 * table - the table name on DynamoDB, default is credential-store.
 * region - AWS region.
 * context - CredStash context parameters.
 * @param [options]
 * @constructor
 */
function CredstashApi(options) {
  options = options || {};

  this.table = options.table;
  this.region = options.region;
  this.context = this._createContextArray(options.context);
  this.allowRemote = options.allowRemote;

  this.args = [];
  this._addArgument('-t', this.table, true);
  this._addArgument('r', this.region, true);
}

/**
 * Gets the specified key from CredStash.
 * @param key
 * @returns {string} value of the key
 */
CredstashApi.prototype.get = function(key) {
  const result = this._execute('get', key);
  if (result.status != 0) {
    if (result.stderr.toString().match(new RegExp(`Item \{\'name\': \'${key}\'\} couldn\'t be found`))) { // not a real error, item wasn't found
      return;
    } else { // a real error
      throw new Error(CREDSTASH_ERROR + result.stderr.toString());
    }
  } else {
    return result.stdout.toString().trim();
  }
};

/**
 * Gets all values from CredStash
 * @returns {Object} flat key-value map, for example: "{ postgres.password: 'pass', mongo.password: 'pass' }".
 */
CredstashApi.prototype.getAll = function() {
  const result = this._execute('getall');
  if (result.status != 0) {
    throw new Error(CREDSTASH_ERROR + result.stderr.toString());
  } else {
    var returedObject = JSON.parse(result.stdout.toString());
    return returedObject;
  }
};

/**
 * Puts the key and the value in CredStash.
 * @param key
 * @param value
 */
CredstashApi.prototype.put = function(key, value) {
  this._execute('put', key, value);
};

/**
 * Deletes the key from CredStash.
 * @param key
 */
CredstashApi.prototype.delete = function(key) {
  this._execute('delete', key);
};

/**
 * Creates the DynamoDB table.
 */
CredstashApi.prototype.setup = function() {
  this._execute('setup');
};

/**
 * Executes the command using node's child_process.spwan.
 * @param action
 * @param [key]
 * @param [value]
 * @returns {*} the result object that is returned by .spwanSync
 *
 * .
 * @private
 */
CredstashApi.prototype._execute = function(action, key, value) {
  var args;
  if (value && key) {
    args = [action, key, value];
  } else if (key) {
    args = [action, key];
  } else {
    args = [action];
  }

  // If we can we will use the Credstash container. If the environment variable does not exist we will attempt to use local credstash.
  if (this.allowRemote && process.env.CREDSTASH_HOST)
  {
    // if a port was specified, use that for ssh, otherwise use defualt.
    var port = (process.env.SSH_PORT) ? "-p " + process.env.SSH_PORT : "";
    return childProcess.spawnSync(SSH_COMMAND, [].concat(process.env.CREDSTASH_HOST, port, SSH_COMMAND_ARGS, this.args, args, this.context));
  }
  else
    return childProcess.spawnSync(LOCAL_COMMAND, [].concat(this.args, args, this.context));
};

CredstashApi.prototype._addArgument = function(key, value, isFlag) {
  if (value) {
    if (isFlag) { // should be '-key value'
      this.args = this.args.concat([key, value]);
    } else { // should be 'key=value'
      this.args = this.args.concat([''.concat(key, '=', value)]);
    }
  }
};

CredstashApi.prototype._createContextArray = function(context) {
  var rt = [];
  if (context) {
    Object.keys(context).forEach(function(key) {
      rt = rt.concat(''.concat(key, '=', context[key]));
    });
  }
  return rt;
};

module.exports = CredstashApi;
/**
 * Created by meirshalev on 15/02/2017.
 */
var childProcess = require('child_process');

const COMMAND = 'credstash';
const CREDSTASH_ERROR = 'Error fetching configuration from CredStash. Error message:';

function CredstashApi(options) {
  this.table = options.table;
  this.region = options.region;
  this.context = options.context;

  this.args = [];
  this._addArgument('-t', this.table, true);
  this._addArgument('r', this.region, true);
  this._addContext(this.context);
}

CredstashApi.prototype.get = function(key) {
  const result = childProcess.spawnSync(COMMAND, [].concat(this.args, ['get', key]));
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

CredstashApi.prototype.getAll = function() {
  const result = childProcess.spawnSync(COMMAND, [].concat(this.args, 'getall'));
  if (result.status != 0) {
    throw new Error(CREDSTASH_ERROR + result.stderr.toString());
  } else {
    var returedObject = JSON.parse(result.stdout.toString());
    return returedObject;
  }
};

CredstashApi.prototype.put = function(key, value) {
  this._execute(key, value, 'put');
};

CredstashApi.prototype.delete = function(key) {
  this._execute(key, undefined, 'delete');
};

CredstashApi.prototype._execute = function(key, value, action) {
  var args;
  if (value) {
    args = [action, key, value];
  } else {
    args = [action,key];
  }
  childProcess.spawnSync(COMMAND, args);
};

CredstashApi.prototype._addArgument = function(key, value, isFlag) {
  if (value) {
    var separator;
    if (isFlag) { // should be '-key value'
      separator = ' ';
    } else { // should be 'key=value'
      separator = '=';
    }
    this.args.concat([key, separator, value]);
  }
};

CredstashApi.prototype._addContext = function(context) {
  if (context) {
    Object.keys(context).forEach(function(key) {
      this._addArgument(key, context[key], false);
    });
  }
};

module.exports = CredstashApi;
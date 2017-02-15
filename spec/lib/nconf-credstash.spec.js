/**
 * Created by meirshalev on 14/02/2017.
 */

var nconf;
var credstash;

var childProcess = require('child_process');

const COMMAND = 'credstash';

const values = ['my_mongo_password', 'my_postgres_password'];
const keys = ['mongo.password', 'postgres.password'];
const confFile = './spec/lib/config.json';

describe('nconf-credstash', function() {

  beforeAll(function() {
    for (var i=0; i<keys.length; i++) {
      var result = childProcess.spawnSync(COMMAND, ['put', keys[i], values[i]]);
      result = childProcess.spawnSync(COMMAND, ['getall']);
    }
  });

  afterAll(function() {
    keys.forEach(function(key) {
      childProcess.spawnSync(COMMAND, ['delete', key]);
    });
  });

  beforeEach(function() {
    nconf = require('nconf');
    credstash = require('../../index');
    nconf.use('credstash', { prefix: 'credstash_', separator: '.' })
    .file({ file: confFile });

  });

  it('should return the key postgres.credstash_password', function() {
    var password = nconf.get('postgres:credstash_password');
    expect(password).toEqual('my_postgres_password');
  });

  it('should get the key from the store and not from CredStash', function() {
    var beginTime = new Date().getTime();
    var password = nconf.get('postgres:credstash_password');
    var endTime = new Date().getTime();

    expect(password).toEqual('my_postgres_password');
    expect(endTime-beginTime).toBeLessThan(10); // CredStash calls take seconds, so 10 milliseconds is small enough.
  });

  it('should retrieve the entire configuration using nconf.get()', function() {
    var conf = nconf.get();
    var expected = {
      'foo': 'bar',
      'postgres': {
        'url': 'i am postgres url',
        'credstash_password': 'my_postgres_password'
      },
      'mongo': {
        'url': 'i am mongo url',
        'credstash_password': 'my_mongo_password'
      }
    };
    expect(conf).toEqual(expected);
  });

  it('should skip keys that don\'t start with the prefix', function() {
    var beginTime = new Date().getTime();
    var bar = nconf.get('foo');
    var endTime = new Date().getTime();

    expect(bar).toEqual('bar');
    expect(endTime-beginTime).toBeLessThan(10); // CredStash calls take seconds, so 10 milliseconds is small enough.
  });

  it('should merge the configurations according to order of the stores', function() {
    nconf = new nconf.Provider(); // Recreate the nconf object, the same way it's being done on nconf.js
    nconf.Credstash = credstash; // Add again Credstash to the nconf object.

    nconf.file({ file: confFile })
    .use('credstash', { prefix: 'credstash_', separator: '.' });

    var expected = {
      'foo': 'bar',
      'postgres': {
        'url': 'i am postgres url',
        'credstash_password': ''
      },
      'mongo': {
        'url': 'i am mongo url',
        'credstash_password': 'my_mongo_password'
      }
    };
    var conf = nconf.get();

    expect(conf).toEqual(expected);
  });
});
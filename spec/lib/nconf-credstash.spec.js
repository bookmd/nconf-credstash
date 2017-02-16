/**
 * Created by meirshalev on 14/02/2017.
 */

var nconf;
var credstash;

var CredstashApi = require('../../lib/credstashApi');
var credstashApi = new CredstashApi({});

const values = ['my_mongo_password', 'my_postgres_password'];
const keys = ['mongo.password', 'postgres.password'];
const confFile = './spec/lib/config.json';

describe('nconf-credstash', function() {
  beforeAll(function() {
    for (var i=0; i<keys.length; i++) {
      credstashApi.put(keys[i], values[i]);
    }
  });

  afterAll(function() {
    keys.forEach(function(key) {
      credstashApi.delete(key);
    });
  });

  beforeEach(function() {
    nconf = require('nconf');
    credstash = require('../../index');
    nconf.use('credstash', { prefix: 'credstash_', separator: '.' })
    .file({ file: confFile });

  });

  it('returns the key postgres.credstash_password', function() {
    var password = nconf.get('postgres:credstash_password');
    expect(password).toEqual('my_postgres_password');
  });

  it('gets the key from the store and not from CredStash', function() {
    var beginTime = new Date().getTime();
    var password = nconf.get('postgres:credstash_password');
    var endTime = new Date().getTime();

    expect(password).toEqual('my_postgres_password');
    expect(endTime-beginTime).toBeLessThan(10); // CredStash calls take seconds, so 10 milliseconds is small enough.
  });

  it('retrieves the entire configuration using nconf.get()', function() {
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

  it('skips keys that don\'t start with the prefix', function() {
    var beginTime = new Date().getTime();
    var bar = nconf.get('foo');
    var endTime = new Date().getTime();

    expect(bar).toEqual('bar');
    expect(endTime-beginTime).toBeLessThan(10); // CredStash calls take seconds, so 10 milliseconds is small enough.
  });

  it('merges the configurations according to order of the stores', function() {
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
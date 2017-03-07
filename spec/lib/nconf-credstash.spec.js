/**
 * Created by meirshalev on 14/02/2017.
 */

var nconf;
var credstash;

var CredstashApi = require('../../lib/credstashApi');
var credstashApi;

const secrets = {
  mongo: {
    password: 'my_mongo_password',
  },
  postgres: {
    password: 'my_postgres_password'
  }
};

const confFile = './spec/lib/config.json';
const TABLE_NAME = 'nconf-credstash-tests';
const TEST_KEY = 'testkey';

describe('nconf-credstash', function() {
  beforeAll(function() {
    credstashApi = new CredstashApi({ table: TABLE_NAME});
    credstashApi.setup(); // create the test DDB table, if not created
    credstashApi.put(TEST_KEY, JSON.stringify(secrets));
  });

  afterAll(function() {
    credstashApi.delete(TEST_KEY);
  });

  beforeAll(function() {
    nconf = require('nconf');
    credstash = require('../../index');
    nconf
      .use('credstash', { key: TEST_KEY, table: TABLE_NAME })
      .file('defaults', confFile);
  });

  it('returns the key postgres.password', function() {
    var password = nconf.get('postgres.password');
    expect(password).toEqual('my_postgres_password');
  });

  it('retrieves the entire configuration using nconf.get()', function() {
    var conf = nconf.get();
    var expected = {
      'foo': 'bar',
      'postgres': {
        'url': 'i am postgres url',
        'password': 'my_postgres_password'
      },
      'mongo': {
        'url': 'i am mongo url',
        'password': 'my_mongo_password'
      }
    };
    expect(conf).toEqual(expected);
  });

  it('merges the configurations according to order of the stores', function() {
    nconf = new nconf.Provider(); // Recreate the nconf object, the same way it's being done on nconf.js
    nconf.Credstash = credstash; // Add again Credstash to the nconf object.

    nconf.file({ file: confFile })
    .use('credstash', { key: TEST_KEY, table: TABLE_NAME });

    var expected = {
      'foo': 'bar',
      'postgres': {
        'url': 'i am postgres url',
        'password': 'CREDSTASH'
      },
      'mongo': {
        'url': 'i am mongo url',
        'password': 'my_mongo_password'
      }
    };
    var conf = nconf.get();

    expect(conf).toEqual(expected);
  });
});
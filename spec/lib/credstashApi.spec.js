/**
 * Created by meirshalev on 15/02/2017.
 */
var CredstashApi = require('../../lib/credstashApi');
const TABLE_NAME = 'nconf-credstash-tests';

describe('CredstashApi', function() {

  function cleanup(api) {
    var store = api.getAll();
    Object.keys(store).forEach(function(key) {
      api.delete(key);
    });
  }

  var api = [];
  beforeEach(function() {
    api.push(new CredstashApi({ table: TABLE_NAME }));
    api.push(new CredstashApi({ table: TABLE_NAME, allowRemote: true }));

    api.forEach(function(credstashApi) {
      credstashApi.setup();
    });
  });

  afterEach(function() {
    api.forEach(function(credstashApi) {
      cleanup(credstashApi);
    });
    api = [];
  });

  describe('put, get and delete', function() {
    api.forEach(function(credstashApi) {
      it('puts a value into CredStash, gets it and deletes it', function() {
        var value = 'value';
        var key = 'key';

        credstashApi.put(key, value);
        var returned = credstashApi.get(key);
        expect(returned).toEqual(value);
        credstashApi.delete(key);

        var shouldNotBeUndefined = credstashApi.get(key);
        expect(shouldNotBeUndefined).not.toBeDefined();
      });
    });
  });

  describe('put, getAll and delete', function() {
    api.forEach(function(credstashApi) {
      it('puts 2 values into CredStash, gets them and deletes them', function() {
        var expected = {
          key1: 'value1',
          key2: 'value2'
        };

        Object.keys(expected).forEach(function(key) {
          credstashApi.put(key, expected[key]);
        });

        var returned = credstashApi.getAll();
        expect(returned).toEqual(expected);

        Object.keys(expected).forEach(function(key) {
          credstashApi.delete(key);
        });

        var shouldBeEmpty = credstashApi.getAll();
        expect(shouldBeEmpty).toEqual({});
      });
    });
  });

  describe('Test arguments', function() {
    var api1;
    var api2;
    const FIRST_TABLE_KEY = 'only_on_first_table';
    const SECOND_TABLE_KEY = 'only_on_second_table';

    afterEach(function() {
      api.forEach(function(credstashApi) {
        cleanup(credstashApi.api1);
        cleanup(credstashApi.api2);
      });
      api = [];
    });

    it('puts the values in the table specified in the constructor', function() {
      api1 = new CredstashApi({ table: 'firstTable' });
      api2 = new CredstashApi({ table: 'secondTable' });

      var apiLocal = {};
      apiLocal.api1 = api1;
      apiLocal.api2 = api2;

      api1 = new CredstashApi({ table: 'firstTable', allowRemote: true });
      api2 = new CredstashApi({ table: 'secondTable', allowRemote: true });

      var apiRemote = {};
      apiLocal.api1 = api1;
      apiLocal.api2 = api2;

      api.push(apiLocal);
      api.push(apiRemote);

      api.forEach(function(credstash){
        // set up credstash
        credstash.api1.setup();
        credstash.api2.setup();

        // put a value on the first table
        credstash.api1.put(FIRST_TABLE_KEY, FIRST_TABLE_KEY);
        var value1 = credstash.api1.get(FIRST_TABLE_KEY);
        expect(value1).toEqual(FIRST_TABLE_KEY);

        // assert that it doesn't appear on the second table
        var value2 = credstash.api2.get(FIRST_TABLE_KEY);
        expect(value2).not.toBeDefined();

        // put a value on the second table
        credstash.api2.put(SECOND_TABLE_KEY, SECOND_TABLE_KEY);
        var value3 = credstash.api2.get(SECOND_TABLE_KEY);
        expect(value3).toEqual(SECOND_TABLE_KEY);

        // assert that it doesn't appear on the first table
        var value4 = credstash.api1.get(SECOND_TABLE_KEY);
        expect(value4).not.toBeDefined();
      });
    });

    it('puts values with encryption context and only gets them when using \'get()\' with the same context', function() {
      api1 = new CredstashApi({ table: TABLE_NAME, context: { env: 'test1' } });
      api2 = new CredstashApi({ table: TABLE_NAME, context: { env: 'test2' } });

      var apiLocal = {};
      apiLocal.api1 = api1;
      apiLocal.api2 = api2;

      api1 = new CredstashApi({ table: TABLE_NAME, context: { env: 'test1', allowRemote: true } });
      api2 = new CredstashApi({ table: TABLE_NAME, context: { env: 'test2', allowRemote: true } });

      var apiRemote = {};
      apiLocal.api1 = api1;
      apiLocal.api2 = api2;

      api.forEach(function(credstash){
        // put a value on the first table
        credstash.api1.put(FIRST_TABLE_KEY, FIRST_TABLE_KEY);
        var value1 = credstash.api1.get(FIRST_TABLE_KEY);
        expect(value1).toEqual(FIRST_TABLE_KEY);
        // assert that it doesn't appear on the second table
        expect(function() { credstash.api2.get(FIRST_TABLE_KEY) }).toThrow();

        // put a value on the second table
        credstash.api2.put(SECOND_TABLE_KEY, SECOND_TABLE_KEY);
        var value3 = credstash.api2.get(SECOND_TABLE_KEY);
        expect(value3).toEqual(SECOND_TABLE_KEY);
        // assert that it doesn't appear on the first table
        expect(function() { credstash.api1.get(SECOND_TABLE_KEY) }).toThrow();
      });
    });
  });
});